<script setup lang="ts">

const {data: users}  = await useFetch('/api/users',
    {
        method: 'GET',
    }
)
function navigate (path: string) {
  return navigateTo({
    path: path,
  })
}
</script>

<template>
    <h1>User List</h1>
    <ul v-if="users">
        <li v-for="user in users" :key="user.id">
        <NuxtLink :to="`/admin/users/${user.id}`">{{ user.username }} - {{ user.role }}</NuxtLink>
        </li>
    </ul>
    <button @click="navigate('/admin/users/register')">Create New User</button>
</template>