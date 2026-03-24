<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSignIn() {
  error.value = ''
  loading.value = true

  const { error: signInError } = await authClient.signIn.email({
    email: email.value,
    password: password.value,
  })

  loading.value = false

  if (signInError) {
    error.value = signInError.message ?? 'Sign in failed'
    return
  }

  await navigateTo('/dashboard')
}
</script>

<template>
  <div style="max-width: 400px; margin: 40px auto; font-family: sans-serif;">
    <h1>Sign In</h1>

    <form @submit.prevent="handleSignIn">
      <div style="margin-bottom: 12px;">
        <label for="email">Email</label><br>
        <input id="email" v-model="email" type="email" required style="width: 100%; padding: 8px;">
      </div>
      <div style="margin-bottom: 12px;">
        <label for="password">Password</label><br>
        <input id="password" v-model="password" type="password" required style="width: 100%; padding: 8px;">
      </div>

      <p v-if="error" style="color: red;">{{ error }}</p>

      <button type="submit" :disabled="loading" style="padding: 8px 16px;">
        {{ loading ? 'Signing in...' : 'Sign In' }}
      </button>
    </form>

    <p style="margin-top: 16px;">
      Don't have an account? <NuxtLink to="/signup">Sign Up</NuxtLink>
    </p>
  </div>
</template>
