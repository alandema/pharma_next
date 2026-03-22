<script setup lang="ts">
interface Patient {
  id: string;
  name: string;
  user: { username: string; };
  cpf: string | null;
  last_prescription_date?: string;
}

const { data: patients } = await useFetch<Patient[]>('/api/patients', { method: 'GET' })
const { data: me } = await useFetch('/api/users/me')
const isAdmin = computed(() => {
  const role = (me.value as any)?.role
  return role === 'admin' || role === 'superadmin'
})
</script>

<template>
  <div class="page-header">
    <h1>👥 Pacientes</h1>
    <button class="btn-primary" @click="navigateTo('/patients/register')">+ Novo Paciente</button>
  </div>
  <div class="card">
    <template v-if="patients?.length">
      <table class="list-table">
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Última Prescrição</th>
            <th v-if="isAdmin">Prescritor</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="patient in patients" :key="patient.id" @click="navigateTo(`/patients/${patient.id}`)">
            <td>{{ patient.name }}</td>
            <td><span class="text-muted">{{ patient.last_prescription_date || '—' }}</span></td>
            <td v-if="isAdmin"><span class="text-muted">{{ patient.user?.username || '—' }}</span></td>
          </tr>
        </tbody>
      </table>
    </template>
    <div v-else class="empty">Nenhum paciente cadastrado.</div>
  </div>
</template>