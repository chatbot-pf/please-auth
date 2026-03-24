<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSignUp() {
  error.value = ''
  loading.value = true

  const { error: signUpError } = await authClient.signUp.email({
    name: name.value,
    email: email.value,
    password: password.value,
  })

  loading.value = false

  if (signUpError) {
    error.value = signUpError.message ?? 'Sign up failed'
    return
  }

  await navigateTo('/dashboard')
}
</script>

<template>
  <div style="max-width: 400px; margin: 40px auto; font-family: sans-serif;">
    <h1>Sign Up</h1>

    <form @submit.prevent="handleSignUp">
      <div style="margin-bottom: 12px;">
        <label for="name">Name</label><br>
        <input id="name" v-model="name" type="text" required style="width: 100%; padding: 8px;">
      </div>
      <div style="margin-bottom: 12px;">
        <label for="email">Email</label><br>
        <input id="email" v-model="email" type="email" required style="width: 100%; padding: 8px;">
      </div>
      <div style="margin-bottom: 12px;">
        <label for="password">Password</label><br>
        <input id="password" v-model="password" type="password" required minlength="8" style="width: 100%; padding: 8px;">
      </div>

      <p v-if="error" style="color: red;">{{ error }}</p>

      <button type="submit" :disabled="loading" style="padding: 8px 16px;">
        {{ loading ? 'Signing up...' : 'Sign Up' }}
      </button>
    </form>

    <p style="margin-top: 16px;">
      Already have an account? <NuxtLink to="/login">Sign In</NuxtLink>
    </p>
  </div>
</template>
