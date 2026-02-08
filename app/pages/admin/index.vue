<script setup lang="ts">
const data_hello = await useFetch('/api/hello')
</script>

<template>
  <pre>{{ data_hello.data }}</pre>
</template>