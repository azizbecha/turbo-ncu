# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-02-21

### Added

- Initial release
- Fast dependency update checking powered by Rust via NAPI-RS
- Multiple version targets: `latest`, `minor`, `patch`, `semver`
- Monorepo workspace support (npm, yarn, pnpm)
- Package filtering with regex, glob, and exact match patterns
- Global package checking
- Disk-based caching with configurable TTL
- JSON and detailed JSON output formats
- Concurrent registry requests with configurable concurrency
- Configuration file support (`.turbo-ncu.json`, `.ncurc.json`, YAML, JS)
- Prerelease version support
- Custom npm registry support
- CLI with 16+ options for flexible usage
