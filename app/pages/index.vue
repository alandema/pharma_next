<script setup lang="ts">
definePageMeta({
  middleware: 'client-middleware'
})
const data_hello = await useFetch('/api/hello')
</script>

<template>
  <pre>{{ data_hello.data }}</pre>
</template>