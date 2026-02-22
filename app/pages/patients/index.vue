<script setup lang="ts">
const { data: patients } = await useFetch('/api/patients', { method: 'GET' })
const { data: me } = await useFetch('/api/users/me')
const isAdmin = computed(() => (me.value as any)?.role === 'admin')
</script>

<template>
    <h1>Patient List</h1>
    <ul v-if="patients">
        <li v-for="patient in patients" :key="patient.id">
        <NuxtLink :to="`/patients/${patient.id}`">{{ patient.name }} - {{ patient.cpf }}<span v-if="isAdmin"> ({{ patient.registered_by }})</span></NuxtLink>
        </li>
    </ul>
    <button @click="navigateTo('/patients/register')">Create New Patient</button>
</template>