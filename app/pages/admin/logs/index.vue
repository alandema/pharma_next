<script setup lang="ts">
import { useDateFormatting } from '../../../composables/useDateFormatting'

const page = ref(1)
const selectedUserId = ref('')
const selectedPatientId = ref('')
const selectedDate = ref('')
const { formatDateTimePtBR } = useDateFormatting()

const { data: usersResponse } = await useFetch<any>('/api/users/admin', { method: 'GET', query: { limit: 1000 } })
const { data: patientsResponse } = await useFetch<any>('/api/patients', { method: 'GET', query: { limit: 1000 } })

const users = computed(() => usersResponse.value?.data || [])
const patients = computed(() => patientsResponse.value?.data || [])

const { data: response } = await useFetch<any>('/api/logs', {
  method: 'GET',
  query: { page, limit: 20, userId: selectedUserId, patientId: selectedPatientId, date: selectedDate },
  watch: [page, selectedUserId, selectedPatientId, selectedDate],
})

const logs = computed(() => response.value?.data || [])
const metadata = computed(() => response.value?.metadata || { page: 1, totalPages: 1 })

const clearFilters = () => {
  selectedUserId.value = ''
  selectedPatientId.value = ''
  selectedDate.value = ''
  page.value = 1
}

const nextPage = () => {
  if (page.value < metadata.value.totalPages) {
    page.value++
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
  }
}
</script>

<template>
  <div class="page-header">
    <h1>📝 Registros</h1>
  </div>

  <div class="filter-bar">
    <label>Usuário:</label>
    <select v-model="selectedUserId" @change="page = 1">
      <option value="">Todos</option>
      <option v-for="u in users" :key="u.id" :value="u.id">{{ u.username }}</option>
    </select>
    <label>Paciente:</label>
    <select v-model="selectedPatientId" @change="page = 1">
      <option value="">Todos</option>
      <option v-for="p in patients" :key="p.id" :value="p.id">{{ p.name }}</option>
    </select>
    <label>Data:</label>
    <input type="date" v-model="selectedDate" @change="page = 1" />
    <button v-if="selectedUserId || selectedPatientId || selectedDate" class="btn-sm" @click="clearFilters">✕ Limpar</button>
  </div>

  <div class="card">
    <template v-if="logs.length">
      <table class="list-table">
        <thead>
          <tr><th>Data/Hora</th><th>Mensagem</th><th>Usuário</th><th>Paciente</th></tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td><span class="text-muted">{{ formatDateTimePtBR(log.event_time) }}</span></td>
            <td>{{ log.message }}</td>
            <td><span class="text-muted">{{ log.user?.username || '—' }}</span></td>
            <td><span class="text-muted">{{ log.patient?.name || '—' }}</span></td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button class="btn-secondary" :disabled="page <= 1" @click="prevPage">Anterior</button>
        <span class="pagination-info">Página {{ metadata.page }} de {{ metadata.totalPages }}</span>
        <button class="btn-secondary" :disabled="page >= metadata.totalPages" @click="nextPage">Próxima</button>
      </div>
    </template>
    <div v-else class="empty">Nenhum registro encontrado.</div>
  </div>
</template>