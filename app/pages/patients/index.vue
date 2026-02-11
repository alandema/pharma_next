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
        <NuxtLink :to="`/patients/${patient.id}`">{{ patient.name }} - {{ patient.cpf }}</NuxtLink>
        </li>
    </ul>
    <div>
        <button @click="$router.push('/patients/register')">Create New Patient</button>
    </div>
</template>