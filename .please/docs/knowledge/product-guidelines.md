# Product Guidelines — @please-auth

## API Design Principles

1. **Convention over configuration** — Every plugin must work with zero required options. Sensible defaults should cover 80% of use cases.
2. **Type safety first** — All public APIs must be fully typed. Use Zod schemas for runtime validation and infer TypeScript types from them.
3. **Server + Client parity** — Every server plugin must ship a corresponding client plugin with typed helper methods and reactive atoms.
4. **Better Auth conventions** — Follow Better Auth's plugin contract (`BetterAuthPlugin`, `BetterAuthClientPlugin`). Use `createAuthEndpoint`, `createAuthMiddleware`, and `mergeSchema` from core.

## Code Style

- ESM only (`"type": "module"`)
- Strict TypeScript (`noEmit` for type checking, `tsdown` for builds)
- Prefer `interface` over `type` for public API shapes
- Use descriptive error codes (e.g., `WAITLIST_NOT_APPROVED`) instead of generic messages
- Keep dependencies minimal — only `zod` as a runtime dependency; everything else is a peer or dev dependency

## Documentation

- JSDoc on all exported functions and types with `@example` blocks
- README per package with Quick Start, API Reference, and Configuration sections
- English for code comments and documentation; Korean for internal project docs

## Quality Standards

- Test coverage target: >80% per package
- All public endpoints must have integration tests using `better-sqlite3`
- Package exports validated with `publint` and `@arethetypeswrong/cli`
- Conventional commits enforced via commitlint
