# Tech Stack — @please-auth

## Runtime & Language

| Layer | Technology | Notes |
|---|---|---|
| Runtime | Bun | Package manager + script runner |
| Language | TypeScript (strict) | `noEmit` for type checking |
| Module system | ESM only | `"type": "module"` in all packages |

## Build & Bundle

| Tool | Purpose |
|---|---|
| tsdown | Library bundling (outputs `.mjs` + `.d.mts`) |
| publint | Package export validation |
| @arethetypeswrong/cli | Type export correctness checking |

## Testing

| Tool | Purpose |
|---|---|
| Vitest | Test runner (globals mode) |
| Istanbul | Coverage provider (target: >80%) |
| better-sqlite3 | In-memory database for integration tests |

## Code Quality

| Tool | Purpose |
|---|---|
| ESLint | Linting |
| commitlint | Conventional commit enforcement |
| TypeScript `tsc --noEmit` | Type checking |

## Validation & Schema

| Tool | Purpose |
|---|---|
| Zod v4 | Runtime validation, type inference |

## Framework

| Tool | Purpose |
|---|---|
| Better Auth | Core auth framework (plugin system) |
| better-call | Endpoint definition |
| nanostores | Client-side reactive state (optional peer) |

## Infrastructure

| Tool | Purpose |
|---|---|
| GitHub Actions | CI (lint, test, build) |
| Codecov | Coverage reporting |
| Bun workspaces | Monorepo package management |

## Development Commands

```bash
# Install dependencies
bun install

# Run tests
bun run --filter '*' test

# Run tests with coverage
bun run --filter '*' coverage

# Build all packages
bun run --filter '*' build

# Type check
bun run --filter '*' typecheck

# Lint
bun run --filter '*' lint

# Lint fix
bun run --filter '*' lint:fix

# Package export validation
bun run --filter '*' lint:package
```
