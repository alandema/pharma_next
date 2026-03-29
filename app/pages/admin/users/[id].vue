<script setup lang="ts">
const route = useRoute()
const { data: prescriber, refresh } = await useFetch<any>(`/api/users/admin/${route.params.id}`)
const { data: me } = await useFetch<any>('/api/users/me')

async function toggleActive() { 
  await $fetch(`/api/users/admin/${route.params.id}`, { method: 'PUT', body: {} })
  await refresh() 
}

async function deletePrescriber() {
  const prescriberName = prescriber.value?.full_name || prescriber.value?.email || 'este prescritor'
  if (!confirm(`Excluir prescritor "${prescriberName}"?`)) return
  await $fetch(`/api/users/admin/${route.params.id}`, { method: 'DELETE' })
  navigateTo('/admin/users')
}
</script>

<template>
  <div class="page-header">
    <h1>Editar Prescritor</h1>
    <button @click="navigateTo('/admin/users')">← Voltar</button>
  </div>
  
  <div v-if="prescriber">
    <div style="max-width: 800px; margin: 0 auto;">
      <div v-if="me?.id !== prescriber.id" class="btn-group" style="margin-bottom:1rem">
        <button @click="toggleActive">{{ prescriber.is_active ? 'Desativar' : 'Ativar' }}</button>
        <button class="btn-danger" @click="deletePrescriber">Excluir</button>
      </div>
    </div>
    
    <PrescriberProfileForm :prescriberId="route.params.id as string" :isAdmin="true" />
  </div>
</template>