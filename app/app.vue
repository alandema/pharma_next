<template>
  <header>
    Header content
    <button v-if="user?.role === 'admin'" loading-auto @click="navigateTo('/admin')">Go Home</button>
    <button v-else-if="user" loading-auto @click="navigateTo('/')">Go Home</button>
  </header>
  <NuxtPage />
  <footer>
    Footer content
    <button v-if="user" @click="handleLogout" loading-auto>Logout</button>
  </footer>
</template>

<script setup lang="ts">
interface User {
  userId: number;
  username: string;
  role: string;
}

// Fetch user data for conditional UI rendering
const { data: user } = await useFetch<User>('/api/users/me', {
  key: useRoute().path,  // Refresh user data on route change
  default: () => undefined,  // Fallback if fetch fails (e.g., not logged in)
  onResponseError: () => {}  // Ignore 401 errors to prevent breaking the layout
})


const handleLogout = async () => {
  
  await $fetch('/api/auth/logout', {
    method: 'POST',
    body: {}
  })

  await refreshNuxtData()

  navigateTo('/auth/login')
}

</script>