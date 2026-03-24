<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

const { data: session } = await authClient.useSession(useFetch)

async function handleSignOut() {
  await authClient.signOut()
  await navigateTo('/')
}
</script>

<template>
  <div style="max-width: 600px; margin: 40px auto; font-family: sans-serif;">
    <h1>Dashboard</h1>

    <div v-if="session">
      <p>Signed in as <strong>{{ session.user.email }}</strong></p>

      <h2>Session Info</h2>
      <pre style="background: #f4f4f4; padding: 16px; border-radius: 4px; overflow-x: auto;">{{ JSON.stringify(session, null, 2) }}</pre>

      <button style="padding: 8px 16px; margin-top: 16px;" @click="handleSignOut">
        Sign Out
      </button>
    </div>
  </div>
</template>
