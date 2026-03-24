---
seo:
  title: '@please-auth — Better Auth Plugins & Adapters'
  description: 'Production-ready plugins and adapters for Better Auth. Waitlist gating, Firestore database adapter, and more.'
---

:::u-page-hero
---
orientation: horizontal
---

#title
Better Auth Plugins & Adapters

#description
Production-ready [Better Auth](https://www.better-auth.com/) plugins and database adapters. Gate sign-ups with a waitlist, store data in Cloud Firestore, and more.

#links
  :::u-button
  ---
  to: /docs/getting-started/introduction
  size: xl
  ---
  Get Started
  :::

  :::u-button
  ---
  to: https://github.com/chatbot-pf/please-auth
  target: _blank
  color: neutral
  variant: subtle
  size: xl
  ---
  View on GitHub
  :::
:::

:::u-page-section
#title
Packages

#links

#default
  :::u-page-grid
    :::u-page-card
    ---
    icon: i-lucide-list-todo
    to: /docs/plugins/waitlist
    ---
    #title
    Waitlist Plugin

    #description
    Invite-based waitlist that gates **all** registration paths — email/password, OAuth, magic-link, OTP, and more.
    :::

    :::u-page-card
    ---
    icon: i-lucide-database
    to: /docs/adapters/firestore
    ---
    #title
    Firestore Adapter

    #description
    Cloud Firestore database adapter with snake_case mapping, custom collections, and full transaction support.
    :::
  :::
:::
