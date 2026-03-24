# Product Guide — @please-auth

## Vision

@please-auth is a collection of production-ready plugins for [Better Auth](https://www.better-auth.com/) that extend its core authentication capabilities with common growth and access-control patterns.

## Problem Statement

Better Auth provides a solid, extensible authentication foundation, but teams building SaaS products frequently need the same set of features on top of it — waitlists, invite codes, role-based access gates, and more. Implementing these from scratch per project is repetitive and error-prone.

## Target Users

- **SaaS developers** building products with Better Auth who need growth and access-control features out of the box.
- **Indie hackers and startups** who want to launch with an invite-based early access flow without writing custom middleware.

## Core Value Proposition

Drop-in Better Auth plugins that handle common access-control patterns (waitlist, invite codes, approval flows) with:
- Full server + client support
- Type-safe APIs with Zod validation
- Framework-agnostic (works wherever Better Auth works)
- Zero config defaults, deep customisation when needed

## Current Scope

| Package | Purpose |
|---|---|
| `@please-auth/waitlist` | Invite-based waitlist / early-access gating |

## Success Metrics

- Plugin adoption (npm downloads)
- Community engagement (GitHub issues, PRs)
- API stability (minimal breaking changes per major version)
