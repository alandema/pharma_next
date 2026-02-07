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

const handleLogout = async () => {
  loading.value = true
  error.value = null
  
  try {
    await $fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    
    // Redirect to login or home page
    await navigateTo('/login')
  } catch (err) {
    error.value = 'Logout failed. Please try again.'
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>