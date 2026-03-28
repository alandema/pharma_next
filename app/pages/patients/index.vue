<script setup lang="ts">
import { useDateFormatting } from '../../composables/useDateFormatting'

interface Patient {
  id: string;
  name: string;
  user: { username: string; full_name: string };
  cpf: string | null;
  last_prescription_date?: string;
}

interface PaginatedResponse {
  data: Patient[];
  metadata: { total: number; page: number; limit: number; totalPages: number };
}

const page = ref(1);
const pageJumpInput = ref('1');
const { formatDatePtBR } = useDateFormatting()

const { data: response } = await useFetch<PaginatedResponse>('/api/patients', {
  method: 'GET',
  query: { page, limit: 10 }
})

const patients = computed(() => response.value?.data || []);
const metadata = computed(() => response.value?.metadata || { page: 1, totalPages: 1 });

const { data: me } = await useFetch('/api/users/me')
const isAdmin = computed(() => {
  const role = (me.value as any)?.role
  return role === 'admin' || role === 'superadmin'
})

const nextPage = () => {
  if (page.value < metadata.value.totalPages) {
    page.value++;
  }
};

const prevPage = () => {
  if (page.value > 1) {
    page.value--;
  }
};

const goToPage = () => {
  const parsedPage = Number.parseInt(pageJumpInput.value, 10);
  if (!Number.isFinite(parsedPage)) {
    pageJumpInput.value = String(metadata.value.page);
    return;
  }

  const totalPages = Math.max(1, metadata.value.totalPages);
  const targetPage = Math.min(totalPages, Math.max(1, parsedPage));

  page.value = targetPage;
  pageJumpInput.value = String(targetPage);
};

watch(() => metadata.value.page, (currentPage) => {
  pageJumpInput.value = String(currentPage);
}, { immediate: true });
</script>

<template>
  <div class="page-header">
    <h1>👥 Pacientes</h1>
    <button class="btn-primary" @click="navigateTo('/patients/register')">+ Novo Paciente</button>
  </div>
  <div class="card">
    <template v-if="patients.length">
      <table class="list-table">
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Última Prescrição</th>
            <th v-if="isAdmin">Prescritor Registrado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="patient in patients" :key="patient.id" @click="navigateTo(`/patients/${patient.id}`)">
            <td>{{ patient.name }}</td>
            <td><span class="text-muted">{{ formatDatePtBR(patient.last_prescription_date) }}</span></td>
            <td v-if="isAdmin"><span class="text-muted">{{ patient.user?.full_name || '—' }}</span></td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button class="btn-secondary" :disabled="page <= 1" @click="prevPage">Anterior</button>
        <span class="pagination-info">Página {{ metadata.page }} de {{ metadata.totalPages }}</span>
        <div class="pagination-jump">
          <label for="patients-page-jump">Ir para</label>
          <input
            id="patients-page-jump"
            v-model="pageJumpInput"
            type="number"
            inputmode="numeric"
            min="1"
            :max="Math.max(1, metadata.totalPages)"
            :disabled="metadata.totalPages <= 1"
            @keyup.enter.prevent="goToPage"
          />
        </div>
        <button class="btn-secondary" :disabled="page >= metadata.totalPages" @click="nextPage">Próxima</button>
      </div>
    </template>
    <div v-else class="empty">Nenhum paciente cadastrado.</div>
  </div>
</template>