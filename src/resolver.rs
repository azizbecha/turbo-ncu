use std::sync::Mutex;
use std::time::Instant;

use crate::cache::Cache;
use crate::registry::RegistryClient;
use crate::semver_utils;
use crate::types::{CheckOptions, CheckResult, PackageInfo, UpdateResult};

pub async fn resolve_updates(
    packages: Vec<PackageInfo>,
    options: &CheckOptions,
) -> CheckResult {
    let total_start = Instant::now();

    let registry = options
        .registry
        .as_deref()
        .unwrap_or("https://registry.npmjs.org");
    let target = options.target.as_deref().unwrap_or("latest");
    let concurrency = options.concurrency.unwrap_or(24);
    let timeout_ms = options.timeout_ms.unwrap_or(30000);
    let retries = options.retries.unwrap_or(3);
    let include_prerelease = options.include_prerelease.unwrap_or(false);
    let cache_ttl = options.cache_ttl_seconds.unwrap_or(600) as u64;

    let cache_file = options.cache_file.clone().unwrap_or_else(|| {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        format!("{}/.turbo-ncu-cache.json", home)
    });

    let cache = Mutex::new(Cache::new(&cache_file, cache_ttl));
    let mut cache_hits: u32 = 0;
    let mut cache_misses: u32 = 0;

    // Separate cached and uncached packages
    let mut cached_versions: Vec<(usize, Vec<String>)> = Vec::new();
    let mut to_fetch: Vec<(usize, String)> = Vec::new();

    for (i, pkg) in packages.iter().enumerate() {
        let c = cache.lock().unwrap();
        if let Some(info) = c.get(&pkg.name) {
            cached_versions.push((i, info.versions));
            cache_hits += 1;
        } else {
            to_fetch.push((i, pkg.name.clone()));
            cache_misses += 1;
        }
        drop(c);
    }

    // Fetch uncached packages
    let fetch_start = Instant::now();
    let client = RegistryClient::new(registry, concurrency, timeout_ms, retries);
    let names: Vec<String> = to_fetch.iter().map(|(_, n)| n.clone()).collect();
    let results = client.fetch_many(&names).await;
    let fetch_time_ms = fetch_start.elapsed().as_secs_f64() * 1000.0;

    // Store fetched results in cache
    let mut fetched_versions: Vec<(usize, Vec<String>)> = Vec::new();
    for (j, result) in results.into_iter().enumerate() {
        let (original_idx, _) = &to_fetch[j];
        if let Ok(info) = result {
            let mut c = cache.lock().unwrap();
            c.set(&info.name, info.versions.clone());
            drop(c);
            fetched_versions.push((*original_idx, info.versions));
        }
    }

    // Save cache
    {
        let mut c = cache.lock().unwrap();
        c.prune();
        let _ = c.save();
    }

    // Merge and resolve
    let mut all_versions: Vec<(usize, Vec<String>)> = Vec::new();
    all_versions.extend(cached_versions);
    all_versions.extend(fetched_versions);
    all_versions.sort_by_key(|(i, _)| *i);

    let mut updates: Vec<UpdateResult> = Vec::new();

    for (idx, versions) in &all_versions {
        let pkg = &packages[*idx];
        let resolved =
            semver_utils::resolve_target_version(&pkg.version_range, versions, target, include_prerelease);

        if let Some(new_version) = resolved {
            let current_version = semver_utils::parse_base_version(&pkg.version_range);
            let current_version_str = current_version
                .as_ref()
                .map(|v| format!("{}", v))
                .unwrap_or_default();

            let update_type = current_version
                .as_ref()
                .map(|cv| semver_utils::classify_update(cv, &new_version))
                .unwrap_or_else(|| "unknown".to_string());

            let new_range = semver_utils::construct_new_range(&pkg.version_range, &new_version);

            updates.push(UpdateResult {
                name: pkg.name.clone(),
                current: pkg.version_range.clone(),
                current_version: current_version_str,
                latest: format!("{}", new_version),
                new_range,
                update_type,
                dep_type: pkg.dep_type.clone(),
            });
        }
    }

    let total_time_ms = total_start.elapsed().as_secs_f64() * 1000.0;

    CheckResult {
        updates,
        cache_hits,
        cache_misses,
        fetch_time_ms,
        total_time_ms,
    }
}
