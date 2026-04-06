<script setup lang="ts">
import { useInputFormatting } from "../../composables/useInputFormatting";
import { useDateFormatting } from "../../composables/useDateFormatting";
import { useCurrentUser } from "../../composables/useCurrentUser";

type Patient = {
  id: string;
  name: string;
  email?: string;
  send_email?: boolean;
  registered_by: string;
  registered_by_full_name?: string | null;
  rg?: string;
  gender?: string;
  cpf?: string;
  birth_date?: string;
  phone?: string;
  zipcode?: string;
  street?: string;
  district?: string;
  house_number?: string;
  additional_info?: string;
  country?: string;
  state?: string;
  city?: string;
  medical_history?: string;
  prescriptions: Prescription[];
};

type Prescription = {
  id: string;
  patient_id: string;
  date_prescribed: string;
  json_form_info: {
    cid_code: string;
    formulas: {
      formula_id: string;
      formula_name: string;
      description: string;
    }[];
  };
  created_at: string;
};

const prescriptionSummary = (jsonFormInfo: Prescription["json_form_info"]) => {
  const formulas = jsonFormInfo.formulas;

  if (!formulas.length) return "Sem fórmulas";
  return (
    formulas
      .slice(0, 2)
      .map((item) => item.formula_name)
      .join(", ") + (formulas.length > 2 ? "..." : "")
  );
};

type Prescritor = {
  id: string;
  email: string;
  role: string;
  full_name: string;
};

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

const route = useRoute();
const toast = useToast();
const { isBrazilCountry, isValidBirthDate } = useInputFormatting();
const { formatDatePtBR } = useDateFormatting();
const { currentUser } = useCurrentUser();
const { data: patient, refresh } = await useFetch<Patient>(
  `/api/patients/${route.params.id}`,
  { method: "GET" },
);
const isAdmin = computed(() => {
  const role = currentUser.value?.role;
  return role === "admin" || role === "superadmin";
});
const canDelete = computed(() => {
  const currentUserId = currentUser.value?.id ?? currentUser.value?.userId;
  return isAdmin.value || currentUserId === patient.value?.registered_by;
});

const prescritoresPage = ref(1);

const { data: allPrescribersResponse } = await useFetch<
  PaginatedResponse<Prescritor>
>("/api/users/admin", {
  method: "GET",
  query: { page: prescritoresPage, limit: 10, role: "user" },
  watch: [prescritoresPage],
});

const prescritores = computed(() => allPrescribersResponse.value?.data ?? []);
const prescritoresMetadata = computed(
  () => allPrescribersResponse.value?.metadata || { page: 1, totalPages: 1 },
);
const selectedPrescritorId = ref("");
const transferError = ref("");
const transferSuccess = ref("");

const nextPrescritoresPage = () => {
  if (prescritoresPage.value < prescritoresMetadata.value.totalPages) {
    prescritoresPage.value++;
  }
};

const prevPrescritoresPage = () => {
  if (prescritoresPage.value > 1) {
    prescritoresPage.value--;
  }
};

const transferPatient = async () => {
  transferError.value = "";
  transferSuccess.value = "";
  if (!selectedPrescritorId.value) {
    transferError.value = "Por favor, selecione um prescritor.";
    return;
  }
  try {
    const result = await $fetch<{ transferred_to: string }>(
      `/api/patients/${route.params.id}/transfer`,
      {
        method: "POST",
        body: { prescritor_id: selectedPrescritorId.value },
      },
    );
    await refresh();
    transferSuccess.value = `Paciente transferido com sucesso para ${result.transferred_to}.`;
    selectedPrescritorId.value = "";
  } catch (err: any) {
    transferError.value = err?.data?.statusMessage ?? "Falha na transferência.";
  }
};

const deletePatient = async () => {
  if (!confirm("Excluir este paciente?")) return;
  await $fetch(`/api/patients/${route.params.id}`, { method: "DELETE" });
  await navigateTo("/patients");
};

const initialData = computed(() => {
  const p = patient.value;
  return p
    ? {
        name: p.name,
        email: p.email,
        send_email: p.send_email,
        rg: p.rg,
        gender: p.gender,
        cpf: p.cpf,
        birth_date: p.birth_date,
        phone: p.phone,
        zipcode: p.zipcode,
        street: p.street,
        district: p.district,
        house_number: p.house_number,
        additional_info: p.additional_info,
        country: p.country,
        state: p.state,
        city: p.city,
        medical_history: p.medical_history,
      }
    : undefined;
});

const save = async (data: Record<string, string>) => {
  if (data.birth_date && !isValidBirthDate(data.birth_date)) {
    toast.add("Data de nascimento inválida.", "error");
    return;
  }

  if (isBrazilCountry(data.country) && !data.zipcode) {
    toast.add("CEP é obrigatório para pacientes brasileiros.", "error");
    return;
  }

  try {
    await $fetch(`/api/patients/${route.params.id}`, {
      method: "PUT",
      body: data,
    });
    await refresh();
    toast.add("Paciente atualizado com sucesso!", "success");
    await navigateTo("/patients");
  } catch (error: any) {
    toast.add(
      error?.data?.statusMessage ??
        error?.data?.message ??
        "Não foi possível atualizar o paciente. Tente novamente.",
      "error",
    );
  }
};
</script>

<template>
  <div class="page-header">
    <h1>Detalhes do Paciente</h1>
    <div class="btn-group">
      <button @click="navigateTo('/patients')">← Voltar</button>
      <button v-if="canDelete" class="btn-danger" @click="deletePatient">
        Excluir
      </button>
    </div>
  </div>

  <div class="card mb-2">
    <PatientForm
      :initial="initialData"
      submit-label="Salvar Alterações"
      @submit="save"
    />
  </div>

  <div class="card mb-2">
    <h2>Últimas 3 Prescrições</h2>
    <template v-if="patient?.prescriptions?.length">
      <table class="list-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Resumo</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="prescription in patient.prescriptions"
            :key="prescription.id"
            @click="navigateTo(`/prescriptions/${prescription.id}`)"
          >
            <td>
              <strong>{{
                formatDatePtBR(prescription.date_prescribed)
              }}</strong>
            </td>
            <td>
              <span class="text-muted">{{
                prescriptionSummary(prescription.json_form_info)
              }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top: 1rem; text-align: center">
        <button
          class="btn-secondary btn-sm"
          @click="
            navigateTo({
              path: '/prescriptions',
              query: { patientId: route.params.id },
            })
          "
        >
          Ver Todas as Prescrições
        </button>
      </div>
    </template>
    <div v-else class="empty">Nenhuma prescrição encontrada.</div>
  </div>

  <div v-if="isAdmin" class="card">
    <h2>Transferir Paciente</h2>
    <p class="text-muted mb-2">
      Prescritor atual:
      <strong>{{
        patient?.registered_by_full_name ?? patient?.registered_by
      }}</strong>
    </p>
    <div class="gap-row">
      <select v-model="selectedPrescritorId" style="flex: 1">
        <option value="" disabled>Selecione um prescritor</option>
        <option
          v-for="prescritor in prescritores"
          :key="prescritor.id"
          :value="prescritor.id"
          :disabled="prescritor.id === patient?.registered_by"
        >
          {{ prescritor.full_name
          }}{{ prescritor.id === patient?.registered_by ? " (atual)" : "" }}
        </option>
      </select>
      <button
        class="btn-primary"
        @click="transferPatient"
        :disabled="!selectedPrescritorId"
      >
        Transferir
      </button>
    </div>
    <div
      v-if="prescritoresMetadata.totalPages > 1"
      class="lookup-pagination"
      style="margin-top: 0.5rem"
    >
      <button
        class="btn-sm"
        :disabled="prescritoresPage <= 1"
        @click="prevPrescritoresPage"
      >
        Anterior
      </button>
      <span
        >Página {{ prescritoresMetadata.page }} de
        {{ prescritoresMetadata.totalPages }}</span
      >
      <button
        class="btn-sm"
        :disabled="prescritoresPage >= prescritoresMetadata.totalPages"
        @click="nextPrescritoresPage"
      >
        Próxima
      </button>
    </div>
    <p
      v-if="transferSuccess"
      style="color: var(--c-success); margin-top: 0.5rem"
    >
      {{ transferSuccess }}
    </p>
    <p v-if="transferError" style="color: var(--c-danger); margin-top: 0.5rem">
      {{ transferError }}
    </p>
  </div>
</template>
