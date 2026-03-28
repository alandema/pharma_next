<script setup lang="ts">
import { useDateFormatting } from '../../composables/useDateFormatting'

type Prescription = {
  id: string;
  patient_id: string;
  prescribed_by: string | null;
  date_prescribed: string;
  json_form_info: {
    cid_code: string;
    formulas: { formula_id: string; formula_name: string; description: string }[];
  };
  created_at: string;
  patient: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    username: string;
    full_name: string;
  } | null;
};

type PaginatedPrescriptionResponse = {
  data: Prescription[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type Patient = {
  id: string;
  name: string;
};

const route = useRoute();
const page = ref(1);
const { formatDatePtBR } = useDateFormatting()
const selectedPatientId = ref((route.query.patientId as string) || '');
const startDate = ref('');
const endDate = ref('');

const { data: me } = await useFetch('/api/users/me')
const isAdmin = computed(() => {
  const role = (me.value as any)?.role
  return role === 'admin' || role === 'superadmin'
})

const { data: patientsResponse } = await useFetch<any>('/api/patients', {
  method: 'GET',
  query: { limit: 1000 }
});
const patients = computed<Patient[]>(() => patientsResponse.value?.data || [])

const { data: response } = await useFetch<PaginatedPrescriptionResponse>('/api/prescriptions', {
  method: 'GET',
  query: {
    page,
    limit: 10,
    patientId: selectedPatientId,
    startDate,
    endDate
  },
  watch: [page, selectedPatientId, startDate, endDate]
});

const prescriptions = computed(() => response.value?.data || [])
const metadata = computed(() => response.value?.metadata || { page: 1, totalPages: 1 })

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

const filterByPatient = () => {
  page.value = 1;
};

const clearFilter = () => {
  selectedPatientId.value = '';
  startDate.value = '';
  endDate.value = '';
  page.value = 1;
};

</script>

<template>
  <div class="page-header">
    <h1>📋 Prescrições</h1>
    <button class="btn-primary" @click="navigateTo('/prescriptions/register')">+ Nova Prescrição</button>
  </div>

  <div class="filter-bar">
    <label>Paciente:</label>
    <select v-model="selectedPatientId" @change="filterByPatient">
      <option value="">Todos</option>
      <option v-for="patient in patients" :key="patient.id" :value="patient.id">{{ patient.name }}</option>
    </select>
    <label>De:</label>
    <input v-model="startDate" type="date" @change="filterByPatient" />
    <label>Até:</label>
    <input v-model="endDate" type="date" @change="filterByPatient" />
    <button v-if="selectedPatientId || startDate || endDate" class="btn-sm" @click="clearFilter">✕ Limpar</button>
  </div>

  <div class="card">
    <template v-if="prescriptions.length">
      <table class="list-table">
        <thead>
          <tr><th>Data</th><th>Paciente</th><th v-if="isAdmin">Prescritor</th></tr>
        </thead>
        <tbody>
          <tr v-for="prescription in prescriptions" :key="prescription.id" @click="navigateTo(`/prescriptions/${prescription.id}`)">
            <td>{{ formatDatePtBR(prescription.date_prescribed) }}</td>
            <td>{{ prescription.patient.name }}</td>
            <td v-if="isAdmin"><span class="text-muted">{{ prescription.user?.full_name || '—' }}</span></td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button class="btn-secondary" :disabled="page <= 1" @click="prevPage">Anterior</button>
        <span class="pagination-info">Página {{ metadata.page }} de {{ metadata.totalPages }}</span>
        <button class="btn-secondary" :disabled="page >= metadata.totalPages" @click="nextPage">Próxima</button>
      </div>
    </template>
    <div v-else class="empty">Nenhuma prescrição encontrada.</div>
  </div>
</template>