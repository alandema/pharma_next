<script setup lang="ts">

const data_hello = await useFetch('/api/hello')

function navigate (path: string) {
  return navigateTo({
    path: path,
  })
}
</script>

<template>
  <pre>THIS IS INDEX {{ data_hello.data }}</pre>
  <button loading-auto @click="navigate('/patients')">Go Patients</button>
</template>