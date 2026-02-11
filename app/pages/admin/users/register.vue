<script setup lang="ts">
const username = ref('')
const password = ref('')
const role = ref('user')
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
        role: role.value,
      }),
    })
  } catch (error) {
    console.error('Error during signup:', error)
  }

  await navigateTo('/admin/users')
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
    <select v-model="role" required>
      <option value="user">User</option>
      <option value="admin">Admin</option>
    </select>
    <button type="submit">Create User</button>
  </form>
  <button @click="navigate('/admin/users')">Back to User List</button>
</template>