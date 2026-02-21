use napi_derive::napi;

#[napi(object)]
#[derive(Debug, Clone)]
pub struct PackageInfo {
    pub name: String,
    pub version_range: String,
    pub dep_type: String,
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct CheckOptions {
    pub registry: Option<String>,
    pub target: Option<String>,
    pub concurrency: Option<u32>,
    pub timeout_ms: Option<u32>,
    pub cache_file: Option<String>,
    pub cache_ttl_seconds: Option<u32>,
    pub include_prerelease: Option<bool>,
    pub retries: Option<u32>,
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct UpdateResult {
    pub name: String,
    pub current: String,
    pub current_version: String,
    pub latest: String,
    pub new_range: String,
    pub update_type: String,
    pub dep_type: String,
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct CheckResult {
    pub updates: Vec<UpdateResult>,
    pub cache_hits: u32,
    pub cache_misses: u32,
    pub fetch_time_ms: f64,
    pub total_time_ms: f64,
}

// Internal types not exposed via napi
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RegistryVersionInfo {
    pub name: String,
    pub versions: Vec<String>,
}

impl Default for CheckOptions {
    fn default() -> Self {
        Self {
            registry: None,
            target: Some("latest".to_string()),
            concurrency: Some(24),
            timeout_ms: Some(30000),
            cache_file: None,
            cache_ttl_seconds: Some(600),
            include_prerelease: Some(false),
            retries: Some(3),
        }
    }
}
