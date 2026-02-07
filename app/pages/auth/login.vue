<script setup lang="ts">
const username = ref('')
const password = ref('')
const handleSubmit = async () => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    if (!response.ok) {
      throw new Error('Login failed')
    }
    await navigateTo('/')
  } catch (error) {
    console.error('Error during login:', error)
  }
}

</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="username" type="text" placeholder="Username" required />
    <input v-model="password" type="password" placeholder="Password" required />
    <button type="submit">Sign In</button>
  </form>

  <button @click="$router.push('/auth/signup')">Go to Sign Up</button>
</template>