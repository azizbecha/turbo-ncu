use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::types::RegistryVersionInfo;

#[derive(Debug, Serialize, Deserialize)]
struct CacheEntry {
    versions: Vec<String>,
    timestamp: u64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
struct CacheStore {
    entries: HashMap<String, CacheEntry>,
}

pub struct Cache {
    file_path: String,
    ttl_seconds: u64,
    store: CacheStore,
}

impl Cache {
    pub fn new(file_path: &str, ttl_seconds: u64) -> Self {
        let store = Self::load_from_file(file_path);
        Self {
            file_path: file_path.to_string(),
            ttl_seconds,
            store,
        }
    }

    fn load_from_file(path: &str) -> CacheStore {
        if !Path::new(path).exists() {
            return CacheStore::default();
        }

        match std::fs::read_to_string(path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => CacheStore::default(),
        }
    }

    fn now() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    }

    pub fn get(&self, name: &str) -> Option<RegistryVersionInfo> {
        let entry = self.store.entries.get(name)?;
        let now = Self::now();
        if now - entry.timestamp > self.ttl_seconds {
            return None;
        }
        Some(RegistryVersionInfo {
            name: name.to_string(),
            versions: entry.versions.clone(),
        })
    }

    pub fn set(&mut self, name: &str, versions: Vec<String>) {
        self.store.entries.insert(
            name.to_string(),
            CacheEntry {
                versions,
                timestamp: Self::now(),
            },
        );
    }

    pub fn save(&self) -> Result<(), String> {
        let json =
            serde_json::to_string_pretty(&self.store).map_err(|e| format!("Serialize: {}", e))?;

        // Ensure parent directory exists
        if let Some(parent) = std::path::Path::new(&self.file_path).parent() {
            if !parent.exists() {
                std::fs::create_dir_all(parent).map_err(|e| format!("Mkdir: {}", e))?;
            }
        }

        // Atomic write: write to tmp file then rename
        let tmp_path = format!("{}.tmp", self.file_path);
        std::fs::write(&tmp_path, &json).map_err(|e| format!("Write tmp: {}", e))?;
        std::fs::rename(&tmp_path, &self.file_path).map_err(|e| format!("Rename: {}", e))?;

        Ok(())
    }

    pub fn prune(&mut self) {
        let now = Self::now();
        self.store
            .entries
            .retain(|_, entry| now - entry.timestamp <= self.ttl_seconds);
    }

    pub fn clear(&mut self) {
        self.store.entries.clear();
        let _ = std::fs::remove_file(&self.file_path);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    use std::sync::atomic::{AtomicU64, Ordering};
    static TEST_COUNTER: AtomicU64 = AtomicU64::new(0);

    fn tmp_cache_path(label: &str) -> String {
        let id = TEST_COUNTER.fetch_add(1, Ordering::SeqCst);
        let mut path = env::temp_dir();
        path.push(format!("turbo-ncu-test-{}-{}-{}.json", label, std::process::id(), id));
        path.to_string_lossy().to_string()
    }

    #[test]
    fn test_cache_set_and_get() {
        let path = tmp_cache_path("setget");
        let mut cache = Cache::new(&path, 600);
        cache.set("lodash", vec!["4.17.21".to_string()]);

        let result = cache.get("lodash");
        assert!(result.is_some());
        assert_eq!(result.unwrap().versions, vec!["4.17.21"]);

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_cache_miss() {
        let path = tmp_cache_path("miss");
        let cache = Cache::new(&path, 600);
        assert!(cache.get("nonexistent").is_none());
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_cache_save_and_reload() {
        let path = tmp_cache_path("savereload");
        {
            let mut cache = Cache::new(&path, 600);
            cache.set("express", vec!["4.18.0".to_string(), "4.19.0".to_string()]);
            cache.save().unwrap();
        }
        {
            let cache = Cache::new(&path, 600);
            let result = cache.get("express");
            assert!(result.is_some());
            assert_eq!(result.unwrap().versions.len(), 2);
        }
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_cache_expired() {
        let path = tmp_cache_path("expired");
        let mut cache = Cache::new(&path, 0); // 0 second TTL
        cache.set("old-pkg", vec!["1.0.0".to_string()]);
        // With 0 TTL, entry should be expired immediately
        std::thread::sleep(std::time::Duration::from_secs(1));
        assert!(cache.get("old-pkg").is_none());
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_cache_clear() {
        let path = tmp_cache_path("clear");
        let mut cache = Cache::new(&path, 600);
        cache.set("pkg", vec!["1.0.0".to_string()]);
        cache.save().unwrap();
        cache.clear();
        assert!(cache.get("pkg").is_none());
        assert!(!Path::new(&path).exists());
    }
}
