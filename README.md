# turbo-ncu

[![CI](https://github.com/azizbecha/turbo-ncu/actions/workflows/ci.yml/badge.svg)](https://github.com/azizbecha/turbo-ncu/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/turbo-ncu)](https://www.npmjs.com/package/turbo-ncu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Fast npm-check-updates clone powered by Rust. Check your npm dependencies for updates quickly and efficiently.

## Features

- **Lightning fast** ⚡ - Built with Rust for maximum performance
- **Multiple target versions** - Support for `latest`, `minor`, `patch`, and semver updates
- **Workspace support** - Check dependencies across monorepo workspaces
- **Flexible filtering** - Include/exclude packages by pattern
- **Global packages** - Check globally installed packages
- **JSON output** - Easy integration with other tools
- **Caching** - Built-in caching for faster repeated checks
- **Config file support** - Save your preferences in a config file

## Installation

```bash
npm install -g turbo-ncu
```

Or use directly with npx:

```bash
npx turbo-ncu
```

## Usage

### Basic Usage

Check for outdated dependencies in the current directory:

```bash
turbo-ncu
```

### Update Package.json

Automatically upgrade to latest versions:

```bash
turbo-ncu --upgrade
```

### Target Specific Version Types

```bash
# Latest versions (default)
turbo-ncu --target latest

# Minor updates only
turbo-ncu --target minor

# Patch updates only
turbo-ncu --target patch

# Semver-compatible updates
turbo-ncu --target semver
```

### Include Prerelease Versions

```bash
turbo-ncu --pre
```

### Filter Dependencies

```bash
# Check only specific packages
turbo-ncu --filter "react*"

# Exclude specific packages
turbo-ncu --reject "typescript"

# Combine both
turbo-ncu --filter "next*" --reject "next-env"
```

### Select Dependency Types

```bash
# Check production dependencies only
turbo-ncu --dep prod

# Check multiple types
turbo-ncu --dep prod dev

# Available types: prod, dev, peer, optional
turbo-ncu --dep prod dev peer optional
```

### Workspace Support

```bash
# Check all packages in a monorepo
turbo-ncu --workspaces

# Check a specific workspace
turbo-ncu --workspace packages/core

# Include root package when checking workspaces
turbo-ncu --workspaces --root
```

### Global Packages

```bash
turbo-ncu --global
```

### Performance Options

```bash
# Adjust concurrency (default: 24)
turbo-ncu --concurrency 10

# Set request timeout in ms (default: 30000)
turbo-ncu --timeout 60000

# Use custom cache file and TTL
turbo-ncu --cacheFile ./cache.json --cacheTtl 3600
```

### Output Formats

```bash
# Output as JSON
turbo-ncu --json

# Output full update details as JSON
turbo-ncu --jsonAll
```

### Custom Registry

```bash
turbo-ncu --registry https://custom-registry.example.com
```

### Custom Package File

```bash
turbo-ncu --packageFile ./custom-package.json
```

### Error Handling

```bash
# Exit codes:
# 0 = always exit successfully
turbo-ncu --errorLevel 0

# 1 = exit with error if no updates found
turbo-ncu --errorLevel 1

# 2 = exit with error if updates are found (default)
turbo-ncu --errorLevel 2
```

## Configuration File

Create a `.turbo-ncu.json` config file in your project root:

```json
{
  "target": "minor",
  "upgrade": false,
  "concurrency": 24,
  "cacheTtl": 3600,
  "filter": "!(devDep|test)",
  "reject": "webpack",
  "dep": ["prod", "dev"]
}
```

Then use it:

```bash
turbo-ncu --configFile .turbo-ncu.json
```

## CLI Options Reference

```
Options:
  -V, --version             output the version number
  -u, --upgrade             Overwrite package file with upgraded versions
  -t, --target <target>     Target version: latest, minor, patch, semver (default: "latest")
  --filter <pattern>        Include only matching package names
  --reject <pattern>        Exclude matching package names
  --dep <types...>          Dependency types: prod, dev, peer, optional (default: all)
  --cacheFile <path>        Path to cache file
  --cacheTtl <seconds>      Cache TTL in seconds (default: 600)
  --concurrency <n>         Number of concurrent requests (default: 24)
  --registry <url>          Custom npm registry URL
  --pre                     Include prerelease versions
  -w, --workspaces         Check all workspaces
  --workspace <name>        Check a specific workspace
  --root                    Include root package in workspace mode
  -g, --global             Check global packages
  --json                    Output as JSON
  --jsonAll                 Output full update details as JSON
  --configFile <path>       Path to config file
  --timeout <ms>            Request timeout in milliseconds (default: 30000)
  --errorLevel <level>      Error exit code behavior: 0, 1, or 2 (default: 2)
  -p, --packageFile <path>  Path to package.json file
  -h, --help               display help for command
```

## Examples

### Check for updates in a monorepo

```bash
turbo-ncu --workspaces --root --target minor
```

### Check and upgrade only production dependencies

```bash
turbo-ncu --upgrade --dep prod
```

### Check with custom concurrency and timeout

```bash
turbo-ncu --concurrency 8 --timeout 45000
```

### CI/CD Integration

```bash
# Check for updates and fail if any are found
turbo-ncu --errorLevel 2

# Check for updates but don't fail
turbo-ncu --errorLevel 0

# Output JSON for further processing
turbo-ncu --json > updates.json
```

## Performance Tips

- Use `--concurrency` to control API request parallelism (default is 24)
- Enable caching with `--cacheFile` and `--cacheTtl` for repeated checks
- Use `--filter` to limit checks to relevant packages
- Adjust `--timeout` if you're behind a slow network

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, project structure, and contribution guidelines.

## License

[MIT](./LICENSE)
