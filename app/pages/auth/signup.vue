<script setup lang="ts">
definePageMeta({
  middleware: 'client-middleware'
})
const username = ref('')
const password = ref('')
const handleSubmit = async () => {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    if (!response.ok) {
      throw new Error('Signup failed')
    }
    const data = await response.json()
    console.log('Signup successful:', data)
  } catch (error) {
    console.error('Error during signup:', error)
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="username" type="text" placeholder="Username" required />
    <input v-model="password" type="password" placeholder="Password" required />
    <button type="submit">Sign Up</button>
  </form>
</template>