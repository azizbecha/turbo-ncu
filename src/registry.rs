use reqwest::Client;
use serde::Deserialize;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Semaphore;

use crate::types::RegistryVersionInfo;

#[derive(Deserialize)]
struct AbbreviatedPackument {
    name: Option<String>,
    versions: Option<HashMap<String, serde_json::Value>>,
}

pub struct RegistryClient {
    client: Client,
    registry: String,
    semaphore: Arc<Semaphore>,
    retries: u32,
}

impl RegistryClient {
    pub fn new(registry: &str, concurrency: u32, timeout_ms: u32, retries: u32) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_millis(timeout_ms as u64))
            .pool_max_idle_per_host(concurrency as usize)
            .build()
            .expect("Failed to create HTTP client");

        let registry_url = registry.trim_end_matches('/').to_string();

        Self {
            client,
            registry: registry_url,
            semaphore: Arc::new(Semaphore::new(concurrency as usize)),
            retries,
        }
    }

    pub async fn fetch_package(&self, name: &str) -> Result<RegistryVersionInfo, String> {
        let _permit = self
            .semaphore
            .acquire()
            .await
            .map_err(|e| format!("Semaphore error: {}", e))?;

        let url = if name.starts_with('@') {
            // Scoped package: @scope/name -> @scope%2fname
            let encoded = name.replacen('/', "%2f", 1);
            format!("{}/{}", self.registry, encoded)
        } else {
            format!("{}/{}", self.registry, name)
        };

        let mut last_error = String::new();
        for attempt in 0..=self.retries {
            if attempt > 0 {
                let delay = Duration::from_millis(100 * 2u64.pow(attempt - 1));
                tokio::time::sleep(delay).await;
            }

            match self.do_fetch(&url).await {
                Ok(info) => return Ok(info),
                Err(e) => {
                    last_error = e;
                }
            }
        }

        Err(format!(
            "Failed to fetch {} after {} retries: {}",
            name,
            self.retries,
            last_error
        ))
    }

    async fn do_fetch(&self, url: &str) -> Result<RegistryVersionInfo, String> {
        let response = self
            .client
            .get(url)
            .header("Accept", "application/vnd.npm.install-v1+json")
            .send()
            .await
            .map_err(|e| format!("HTTP error: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("HTTP {}", response.status()));
        }

        let packument: AbbreviatedPackument = response
            .json()
            .await
            .map_err(|e| format!("JSON parse error: {}", e))?;

        let name = packument.name.unwrap_or_default();
        let versions: Vec<String> = packument
            .versions
            .map(|v| v.keys().cloned().collect())
            .unwrap_or_default();

        Ok(RegistryVersionInfo { name, versions })
    }

    pub async fn fetch_many(
        &self,
        names: &[String],
    ) -> Vec<Result<RegistryVersionInfo, String>> {
        let futures: Vec<_> = names
            .iter()
            .map(|name| self.fetch_package(name))
            .collect();

        futures::future::join_all(futures).await
    }
}
