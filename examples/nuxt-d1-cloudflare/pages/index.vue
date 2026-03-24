<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

const { data: session } = await authClient.useSession(useFetch)
</script>

<template>
  <div style="max-width: 600px; margin: 40px auto; font-family: sans-serif;">
    <h1>Better Auth + Nuxt + Cloudflare D1</h1>
    <p>A minimal example of using Better Auth with Nuxt on Cloudflare Pages with D1 database.</p>

    <div v-if="session">
      <p>Welcome, <strong>{{ session.user.name }}</strong>!</p>
      <NuxtLink to="/dashboard">Go to Dashboard</NuxtLink>
    </div>
    <div v-else>
      <p>
        <NuxtLink to="/login">Sign In</NuxtLink> |
        <NuxtLink to="/signup">Sign Up</NuxtLink>
      </p>
    </div>
  </div>
</template>
