<script setup lang="ts">
const route = useRoute()
const { data: user, refresh } = await useFetch<any>(`/api/users/admin/${route.params.id}`)
const { data: me } = await useFetch<any>('/api/users/me')

async function toggleActive() { 
  await $fetch(`/api/users/admin/${route.params.id}`, { method: 'PUT', body: {} })
  await refresh() 
}

async function deleteUser() {
  if (!confirm(`Excluir usuário "${user.value?.username}"?`)) return
  await $fetch(`/api/users/admin/${route.params.id}`, { method: 'DELETE' })
  navigateTo('/admin/users')
}
</script>

<template>
  <div class="page-header">
    <h1>Editar Usuário</h1>
    <button @click="navigateTo('/admin/users')">← Voltar</button>
  </div>
  
  <div v-if="user">
    <div style="max-width: 800px; margin: 0 auto;">
      <div v-if="me?.id !== user.id" class="btn-group" style="margin-bottom:1rem">
        <button @click="toggleActive">{{ user.is_active ? 'Desativar' : 'Ativar' }}</button>
        <button class="btn-danger" @click="deleteUser">Excluir</button>
      </div>
    </div>
    
    <UserProfileForm :userId="route.params.id as string" :isAdmin="true" />
  </div>
</template>