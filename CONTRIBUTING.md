# Contributing to turbo-ncu

Thanks for your interest in contributing! This guide will help you get started.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/tools/install) (stable toolchain)
- npm (comes with Node.js)

## Getting Started

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/<your-username>/turbo-ncu.git
   cd turbo-ncu
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:

   ```bash
   npm run build
   ```

4. Run the tests:

   ```bash
   npm test
   ```

## Project Structure

```
turbo-ncu/
  src/              # Rust source (NAPI native module)
    lib.rs          # Entry point, exports to Node.js
    registry.rs     # npm registry HTTP client
    resolver.rs     # Update resolution orchestration
    semver_utils.rs # Semantic versioning logic
    cache.rs        # Disk-based caching
    types.rs        # Shared type definitions
  cli/
    src/            # TypeScript CLI source
    bin/            # CLI entry point
  __test__/         # Integration tests
  index.js          # ESM wrapper for native module
  index.d.ts        # TypeScript declarations for native module
```

## Available Scripts

| Script              | Description                      |
| ------------------- | -------------------------------- |
| `npm run build`     | Full build (Rust + TypeScript)   |
| `npm run build:rs`  | Build Rust native module only    |
| `npm run build:ts`  | Build TypeScript CLI only        |
| `npm test`          | Run tests                        |
| `npm run lint`      | Run oxlint                       |
| `npm run lint:fix`  | Run oxlint with auto-fix         |
| `npm run fmt`       | Format code with oxfmt           |
| `npm run fmt:check` | Check formatting without writing |

## Code Style

- **Linting**: [oxlint](https://oxc.rs/docs/guide/usage/linter) enforces code quality rules.
- **Formatting**: [oxfmt](https://oxc.rs/docs/guide/usage/formatter) handles code formatting.
- **Pre-commit hook**: Husky runs lint-staged on every commit, which runs oxlint and oxfmt on staged files.

Run `npm run lint` and `npm run fmt` before committing, or let the pre-commit hook handle it.

## Pull Request Workflow

1. Create a feature branch from `main`:

   ```bash
   git checkout -b feat/my-feature
   ```

2. Make your changes and ensure:
   - `npm run lint` passes
   - `npm run fmt:check` passes
   - `npm test` passes (requires a prior `npm run build`)

3. Commit your changes with a descriptive message.

4. Push and open a pull request against `main`.

## Reporting Issues

Please open an issue on GitHub with:

- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node.js version, Rust version)
