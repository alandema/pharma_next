<script setup lang="ts">
import { useDateFormatting } from "../../../composables/useDateFormatting";

type PaginationMetadata = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type PaginatedResponse<T> = {
  data: T[];
  metadata: PaginationMetadata;
};

type PrescriberOption = {
  id: string;
  email: string;
  full_name: string;
  role: string;
};

type PatientOption = {
  id: string;
  name: string;
};

type LogEntry = {
  id: string;
  event_time: string;
  message: string;
  user?: {
    full_name?: string;
    email?: string;
  } | null;
  patient?: {
    name?: string;
  } | null;
};

const page = ref(1);
const pageJumpInput = ref("1");
const prescriberOptionsPage = ref(1);
const patientOptionsPage = ref(1);
const selectedPrescriberId = ref("");
const selectedPatientId = ref("");
const selectedDate = ref("");
const { formatDateTimePtBR } = useDateFormatting();

const { data: prescribersResponse } = await useFetch<
  PaginatedResponse<PrescriberOption>
>("/api/users/admin", {
  method: "GET",
  query: { page: prescriberOptionsPage, limit: 10 },
  watch: [prescriberOptionsPage],
});
const { data: patientsResponse } = await useFetch<
  PaginatedResponse<PatientOption>
>("/api/patients", {
  method: "GET",
  query: { page: patientOptionsPage, limit: 10 },
  watch: [patientOptionsPage],
});

const prescribers = computed(() => prescribersResponse.value?.data || []);
const patients = computed(() => patientsResponse.value?.data || []);
const prescribersMetadata = computed(
  () => prescribersResponse.value?.metadata || { page: 1, totalPages: 1 },
);
const patientsMetadata = computed(
  () => patientsResponse.value?.metadata || { page: 1, totalPages: 1 },
);

const { data: response } = await useFetch<PaginatedResponse<LogEntry>>(
  "/api/logs",
  {
    method: "GET",
    query: {
      page,
      limit: 20,
      userId: selectedPrescriberId,
      patientId: selectedPatientId,
      date: selectedDate,
    },
    watch: [page, selectedPrescriberId, selectedPatientId, selectedDate],
  },
);

const logs = computed(() => response.value?.data || []);
const metadata = computed(
  () => response.value?.metadata || { page: 1, totalPages: 1 },
);

const clearFilters = () => {
  prescriberOptionsPage.value = 1;
  patientOptionsPage.value = 1;
  selectedPrescriberId.value = "";
  selectedPatientId.value = "";
  selectedDate.value = "";
  page.value = 1;
};

const nextPrescribersPage = () => {
  if (prescriberOptionsPage.value < prescribersMetadata.value.totalPages) {
    prescriberOptionsPage.value++;
  }
};

const prevPrescribersPage = () => {
  if (prescriberOptionsPage.value > 1) {
    prescriberOptionsPage.value--;
  }
};

const nextPatientsPage = () => {
  if (patientOptionsPage.value < patientsMetadata.value.totalPages) {
    patientOptionsPage.value++;
  }
};

const prevPatientsPage = () => {
  if (patientOptionsPage.value > 1) {
    patientOptionsPage.value--;
  }
};

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

watch(
  () => metadata.value.page,
  (currentPage) => {
    pageJumpInput.value = String(currentPage);
  },
  { immediate: true },
);
</script>

<template>
  <div class="page-header">
    <h1>📝 Registros</h1>
  </div>

  <div class="filter-bar">
    <div class="filter-group">
      <label>Prescritor:</label>
      <select v-model="selectedPrescriberId" @change="page = 1">
        <option value="">Todos</option>
        <option
          v-for="prescriber in prescribers"
          :key="prescriber.id"
          :value="prescriber.id"
        >
          {{ prescriber.full_name }}
        </option>
      </select>
      <div v-if="prescribersMetadata.totalPages > 1" class="lookup-pagination">
        <button
          class="btn-sm"
          :disabled="prescriberOptionsPage <= 1"
          @click="prevPrescribersPage"
        >
          Anterior
        </button>
        <span
          >Página {{ prescribersMetadata.page }} de
          {{ prescribersMetadata.totalPages }}</span
        >
        <button
          class="btn-sm"
          :disabled="prescriberOptionsPage >= prescribersMetadata.totalPages"
          @click="nextPrescribersPage"
        >
          Próxima
        </button>
      </div>
    </div>
    <div class="filter-group">
      <label>Paciente:</label>
      <select v-model="selectedPatientId" @change="page = 1">
        <option value="">Todos</option>
        <option v-for="p in patients" :key="p.id" :value="p.id">
          {{ p.name }}
        </option>
      </select>
      <div v-if="patientsMetadata.totalPages > 1" class="lookup-pagination">
        <button
          class="btn-sm"
          :disabled="patientOptionsPage <= 1"
          @click="prevPatientsPage"
        >
          Anterior
        </button>
        <span
          >Página {{ patientsMetadata.page }} de
          {{ patientsMetadata.totalPages }}</span
        >
        <button
          class="btn-sm"
          :disabled="patientOptionsPage >= patientsMetadata.totalPages"
          @click="nextPatientsPage"
        >
          Próxima
        </button>
      </div>
    </div>
    <div class="filter-group">
      <label>Data:</label>
      <input type="date" v-model="selectedDate" @change="page = 1" />
    </div>
    <button
      v-if="selectedPrescriberId || selectedPatientId || selectedDate"
      class="btn-sm"
      @click="clearFilters"
    >
      ✕ Limpar
    </button>
  </div>

  <div class="card">
    <template v-if="logs.length">
      <table class="list-table">
        <thead>
          <tr>
            <th>Data/Hora</th>
            <th>Mensagem</th>
            <th>Prescritor</th>
            <th>Paciente</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td>
              <span class="text-muted">{{
                formatDateTimePtBR(log.event_time)
              }}</span>
            </td>
            <td>{{ log.message }}</td>
            <td>
              <span class="text-muted">{{
                log.user?.full_name || log.user?.email || "—"
              }}</span>
            </td>
            <td>
              <span class="text-muted">{{ log.patient?.name || "—" }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button class="btn-secondary" :disabled="page <= 1" @click="prevPage">
          Anterior
        </button>
        <span class="pagination-info"
          >Página {{ metadata.page }} de {{ metadata.totalPages }}</span
        >
        <div class="pagination-jump">
          <label for="admin-logs-page-jump">Ir para</label>
          <input
            id="admin-logs-page-jump"
            v-model="pageJumpInput"
            type="number"
            inputmode="numeric"
            min="1"
            :max="Math.max(1, metadata.totalPages)"
            :disabled="metadata.totalPages <= 1"
            @keyup.enter.prevent="goToPage"
          />
        </div>
        <button
          class="btn-secondary"
          :disabled="page >= metadata.totalPages"
          @click="nextPage"
        >
          Próxima
        </button>
      </div>
    </template>
    <div v-else class="empty">Nenhum registro encontrado.</div>
  </div>
</template>
