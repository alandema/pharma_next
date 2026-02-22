<script setup lang="ts">

type User = { id: string; username: string; role: string; is_active: boolean }

const route = useRoute()
const { data: user, refresh } = await useFetch<User>(`/api/users/admin/${route.params.id}`, { method: 'GET' })

async function toggleActive() {
  await $fetch(`/api/users/admin/${route.params.id}`, { method: 'PATCH' })
  await refresh()
}

async function deleteUser() {
  if (!confirm(`Delete user "${user.value?.username}"? Their patients will be transferred to you.`)) return
  await $fetch(`/api/users/admin/${route.params.id}`, { method: 'DELETE' })
  navigateTo('/admin/users')
}
</script>

<template>
    <h1>User Details</h1>
    <div v-if="user">
        <p>Username: {{ user.username }}</p>
        <p>Role: {{ user.role }}</p>
        <p>Status: {{ user.is_active ? 'Active' : 'Inactive' }}</p>
        <button @click="toggleActive">{{ user.is_active ? 'Deactivate' : 'Activate' }}</button>
        <button @click="deleteUser" style="margin-left:8px;color:red">Delete User</button>
    </div>
    <button @click="navigateTo('/admin/users')">Back to User List</button>
</template>