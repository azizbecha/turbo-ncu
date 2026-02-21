use node_semver::{Range, Version};

/// Extract the prefix (^, ~, >=, etc.) from a version range string
pub fn extract_prefix(range_str: &str) -> &str {
    let trimmed = range_str.trim();
    if trimmed.starts_with(">=") {
        ">="
    } else if trimmed.starts_with("<=") {
        "<="
    } else if trimmed.starts_with('^') {
        "^"
    } else if trimmed.starts_with('~') {
        "~"
    } else if trimmed.starts_with('>') {
        ">"
    } else if trimmed.starts_with('<') {
        "<"
    } else if trimmed.starts_with('=') {
        "="
    } else if trimmed.contains(" - ") {
        // Hyphen range
        ""
    } else if trimmed.contains("||") {
        ""
    } else if trimmed.parse::<Version>().is_ok() {
        // Exact version like "1.2.3"
        ""
    } else {
        ""
    }
}

/// Parse the base version from a range string (e.g., "^1.2.3" -> "1.2.3")
pub fn parse_base_version(range_str: &str) -> Option<Version> {
    let trimmed = range_str.trim();
    let version_part = trimmed
        .trim_start_matches(">=")
        .trim_start_matches("<=")
        .trim_start_matches('^')
        .trim_start_matches('~')
        .trim_start_matches('>')
        .trim_start_matches('<')
        .trim_start_matches('=')
        .trim();

    // Handle x-ranges like "1.x" or "1.2.x"
    let normalized = version_part
        .replace(".x", ".0")
        .replace(".*", ".0");

    normalized.parse::<Version>().ok()
}

/// Classify the update type between two versions
pub fn classify_update(current: &Version, new_version: &Version) -> String {
    if new_version.major > current.major {
        "major".to_string()
    } else if new_version.minor > current.minor {
        "minor".to_string()
    } else if new_version.patch > current.patch {
        "patch".to_string()
    } else if !new_version.pre_release.is_empty() || !current.pre_release.is_empty() {
        "prerelease".to_string()
    } else {
        "none".to_string()
    }
}

/// Construct a new range string preserving the original prefix
pub fn construct_new_range(original_range: &str, new_version: &Version) -> String {
    let prefix = extract_prefix(original_range);
    let version_str = format!("{}.{}.{}", new_version.major, new_version.minor, new_version.patch);

    if !new_version.pre_release.is_empty() {
        let pre: Vec<String> = new_version.pre_release.iter().map(|id| format!("{}", id)).collect();
        format!("{}{}-{}", prefix, version_str, pre.join("."))
    } else {
        format!("{}{}", prefix, version_str)
    }
}

/// Resolve the target version from a list of available versions
pub fn resolve_target_version(
    current_range: &str,
    versions: &[String],
    target: &str,
    include_prerelease: bool,
) -> Option<Version> {
    let current_version = parse_base_version(current_range)?;

    let mut parsed_versions: Vec<Version> = versions
        .iter()
        .filter_map(|v| v.parse::<Version>().ok())
        .filter(|v| {
            if !include_prerelease && !v.pre_release.is_empty() {
                return false;
            }
            true
        })
        .collect();

    parsed_versions.sort();

    match target {
        "latest" => {
            // Find the highest version
            parsed_versions.into_iter().rev().next()
                .filter(|v| v > &current_version)
        }
        "minor" => {
            // Find highest version with same major
            parsed_versions
                .into_iter()
                .rev()
                .find(|v| v.major == current_version.major && v > &current_version)
        }
        "patch" => {
            // Find highest version with same major.minor
            parsed_versions
                .into_iter()
                .rev()
                .find(|v| {
                    v.major == current_version.major
                        && v.minor == current_version.minor
                        && v > &current_version
                })
        }
        "semver" => {
            // Find highest version satisfying the current range
            if let Ok(range) = current_range.parse::<Range>() {
                parsed_versions
                    .into_iter()
                    .rev()
                    .find(|v| range.satisfies(v) && v > &current_version)
            } else {
                None
            }
        }
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_prefix() {
        assert_eq!(extract_prefix("^1.2.3"), "^");
        assert_eq!(extract_prefix("~1.2.3"), "~");
        assert_eq!(extract_prefix(">=1.0.0"), ">=");
        assert_eq!(extract_prefix(">1.0.0"), ">");
        assert_eq!(extract_prefix("1.2.3"), "");
    }

    #[test]
    fn test_parse_base_version() {
        let v = parse_base_version("^1.2.3").unwrap();
        assert_eq!(v.major, 1);
        assert_eq!(v.minor, 2);
        assert_eq!(v.patch, 3);

        let v = parse_base_version("~0.5.1").unwrap();
        assert_eq!(v.major, 0);
        assert_eq!(v.minor, 5);
        assert_eq!(v.patch, 1);

        let v = parse_base_version(">=2.0.0").unwrap();
        assert_eq!(v.major, 2);
    }

    #[test]
    fn test_classify_update() {
        let v1 = "1.0.0".parse::<Version>().unwrap();
        let v2 = "2.0.0".parse::<Version>().unwrap();
        assert_eq!(classify_update(&v1, &v2), "major");

        let v3 = "1.1.0".parse::<Version>().unwrap();
        assert_eq!(classify_update(&v1, &v3), "minor");

        let v4 = "1.0.1".parse::<Version>().unwrap();
        assert_eq!(classify_update(&v1, &v4), "patch");
    }

    #[test]
    fn test_construct_new_range() {
        let v = "2.0.0".parse::<Version>().unwrap();
        assert_eq!(construct_new_range("^1.0.0", &v), "^2.0.0");
        assert_eq!(construct_new_range("~1.0.0", &v), "~2.0.0");
        assert_eq!(construct_new_range("1.0.0", &v), "2.0.0");
    }

    #[test]
    fn test_resolve_target_latest() {
        let versions = vec![
            "1.0.0".to_string(),
            "1.1.0".to_string(),
            "2.0.0".to_string(),
            "2.1.0".to_string(),
        ];
        let result = resolve_target_version("^1.0.0", &versions, "latest", false);
        assert!(result.is_some());
        let v = result.unwrap();
        assert_eq!(v.major, 2);
        assert_eq!(v.minor, 1);
    }

    #[test]
    fn test_resolve_target_minor() {
        let versions = vec![
            "1.0.0".to_string(),
            "1.1.0".to_string(),
            "1.2.0".to_string(),
            "2.0.0".to_string(),
        ];
        let result = resolve_target_version("^1.0.0", &versions, "minor", false);
        assert!(result.is_some());
        let v = result.unwrap();
        assert_eq!(v.major, 1);
        assert_eq!(v.minor, 2);
    }

    #[test]
    fn test_resolve_target_patch() {
        let versions = vec![
            "1.0.0".to_string(),
            "1.0.1".to_string(),
            "1.0.2".to_string(),
            "1.1.0".to_string(),
        ];
        let result = resolve_target_version("^1.0.0", &versions, "patch", false);
        assert!(result.is_some());
        let v = result.unwrap();
        assert_eq!(v.patch, 2);
    }

    #[test]
    fn test_resolve_excludes_prerelease() {
        let versions = vec![
            "1.0.0".to_string(),
            "2.0.0-alpha.1".to_string(),
            "2.0.0".to_string(),
        ];
        let result = resolve_target_version("^1.0.0", &versions, "latest", false);
        let v = result.unwrap();
        assert_eq!(format!("{}", v), "2.0.0");
    }

    #[test]
    fn test_resolve_includes_prerelease() {
        let versions = vec![
            "1.0.0".to_string(),
            "2.0.0".to_string(),
            "3.0.0-beta.1".to_string(),
        ];
        let result = resolve_target_version("^1.0.0", &versions, "latest", true);
        let v = result.unwrap();
        assert_eq!(v.major, 3);
    }
}
