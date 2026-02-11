<script setup lang="ts">


type User = { id: string; username: string; role: string }

const {data: user}  = await useFetch<User>(`/api/users/${useRoute().params.id}`,
    {
        method: 'GET'
    }
)
</script>

<template>
    <h1>User Details</h1>
    <div v-if="user">
        <p>Username: {{ user.username }}</p>
        <p>Role: {{ user.role }}</p>
    </div>
    <div>
        <button @click="$router.back()">Back to User List</button>
    </div>
</template>