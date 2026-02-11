<script setup lang="ts">
const username = ref('')
const password = ref('')
const handleSubmit = async () => {
  try {
    const data = await $fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    })
  } catch (error) {
    console.error('Error during signup:', error)
  }

  navigateTo('/auth/login')
}

function navigate (path: string) {
  return navigateTo({
    path: path,
  })
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="username" type="text" placeholder="Username" required />
    <input v-model="password" type="password" placeholder="Password" required />
    <button type="submit">Sign Up</button>
  </form>
  <button @click="navigate('/auth/login')">Already have an account? Log in</button>
</template>