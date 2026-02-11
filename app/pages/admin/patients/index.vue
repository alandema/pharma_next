<script setup lang="ts">

const {data: patients}  = await useFetch('/api/patients',
    {
        method: 'GET',
    }
)
</script>

<template>
    <h1>Patient List</h1>
    <ul v-if="patients">
        <li v-for="patient in patients" :key="patient.id">
        <NuxtLink :to="`/admin/patients/${patient.id}`">{{ patient.name }} - {{ patient.cpf }} {{ patient.registered_by }}</NuxtLink>
        </li>
    </ul>
    <div>
        <button @click="$router.push('/admin/patients/register')">Create New Patient</button>
    </div>
</template>