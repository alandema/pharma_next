<script setup lang="ts">
// Profile page now uses the UserProfileForm component
</script>

<template>
  <div class="page-header">
    <h1>Meu Perfil</h1>
    <button @click="navigateTo('/')">← Voltar</button>
  </div>
  <UserProfileForm />
</template>