<script setup lang="ts">

const data_hello = await useFetch('/api/hello')

function navigate (path: string) {
  return navigateTo({
    path: path,
  })
}
</script>

<template>
  <pre>THIS IS ADMIN {{ data_hello.data }}</pre>
  <button loading-auto @click="navigate('/admin/patients')">Go Patients</button>
  <button loading-auto @click="navigate('/admin/formulas')">Go Formulas</button>
  <button loading-auto @click="navigate('/admin/users')">Go Users</button>
</template>