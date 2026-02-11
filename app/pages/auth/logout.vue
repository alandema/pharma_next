<!-- pages/logout.vue -->
<template>
  <div>
    <h1>Logout</h1>
    <button @click="handleLogout" :disabled="loading">
      {{ loading ? 'Logging out...' : 'Logout' }}
    </button>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
const loading = ref(false)
const error = ref(null)

  definePageMeta({
  middleware: [
    'user-pages-middleware',
  ],
})


const handleLogout = async () => {
  loading.value = true
  error.value = null
  
  try {
    await $fetch('/api/auth/logout', {
      method: 'POST',
    })
  } catch (error) {
    console.error('Error during logout:', error)
  } finally {
    loading.value = false
  }
  navigateTo('/')
}
</script>