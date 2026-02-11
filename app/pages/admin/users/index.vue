<script setup lang="ts">

const {data: users}  = await useFetch('/api/users',
    {
        method: 'GET',
    }
)
</script>

<template>
    <h1>User List</h1>
    <ul v-if="users">
        <li v-for="user in users" :key="user.id">
        <NuxtLink :to="`/admin/users/${user.id}`">{{ user.username }} - {{ user.role }}</NuxtLink>
        </li>
    </ul>
</template>