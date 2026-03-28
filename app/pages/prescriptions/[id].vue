<script setup lang="ts">
import { useDateFormatting } from '../../composables/useDateFormatting'

type Patient = {
  id: string;
  name: string;
  cpf?: string | null;
  rg?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  phone?: string | null;
  street?: string | null;
  district?: string | null;
  house_number?: string | null;
  city?: string | null;
  state?: string | null;
};

type User = {
  id: string;
  username: string;
  full_name: string;
};

type Prescription = {
  id: string;
  patient_id: string;
  prescribed_by: string | null;
  date_prescribed: string;
  pdf_url?: string | null;
  json_form_info: {
    cid_code?: string;
    formulas?: { formula_id: string; formula_name?: string; description: string }[];
  };
  created_at: string;
  patient: Patient;
  user: User | null;
};

const route = useRoute();
const { formatDatePtBR, formatDateTimePtBR } = useDateFormatting()

const { data: prescription } = await useFetch<Prescription>(
  `/api/prescriptions/${route.params.id}`,
  { method: 'GET' }
);

const openPrintPage = () => {
  if (prescription.value?.pdf_url) {
    window.open(prescription.value.pdf_url, '_blank');
  } else {
    alert("PDF não disponível para esta prescrição.");
  }
};

const formInfo = computed(() => {
  return prescription.value?.json_form_info;
});

const formulas = computed(() => formInfo.value?.formulas ?? []);

const reuse = () => {
  const q = new URLSearchParams({
    patient_id: prescription.value!.patient_id,
    cid_code: String(formInfo.value?.cid_code ?? ''),
    formulas: JSON.stringify(formulas.value.map((item: { formula_id: string; description: string }) => ({
      formula_id: item.formula_id,
      description: item.description,
    }))),
  });
  navigateTo(`/prescriptions/register?${q}`);
};

</script>

<template>
  <div class="page-header">
    <h1>Detalhes da Prescrição</h1>
    <div class="btn-group">
      <button @click="navigateTo('/prescriptions')">← Voltar</button>
      <button class="btn-primary" @click="openPrintPage">🖨️ Imprimir</button>
      <button @click="reuse">♻️ Reutilizar</button>
    </div>
  </div>

  <div v-if="prescription">
    <div class="card mb-2">
      <h2>Informações</h2>
      <div class="form-row">
        <div><label>Data</label><p>{{ formatDatePtBR(prescription.date_prescribed) }}</p></div>
        <div><label>Prescrito por</label><p>{{ prescription.user?.full_name || 'Desconhecido' }}</p></div>
      </div>
      <div><label>Criado em</label><p>{{ formatDateTimePtBR(prescription.created_at) }}</p></div>
    </div>

    <div class="card mb-2">
      <h2>Paciente</h2>
      <p><strong>{{ prescription.patient.name }}</strong></p>
      <p v-if="prescription.patient.cpf" class="text-muted">CPF: {{ prescription.patient.cpf }}</p>
      <p v-if="prescription.patient.phone" class="text-muted">Tel: {{ prescription.patient.phone }}</p>
      <p v-if="prescription.patient.birth_date" class="text-muted">Nasc: {{ formatDatePtBR(prescription.patient.birth_date) }}</p>
    </div>

    <div class="card">
      <h2>Conteúdo da Prescrição</h2>
      <p v-if="formInfo?.cid_code" class="text-muted mb-2">CID: <strong>{{ formInfo?.cid_code }}</strong></p>
      <table v-if="formulas.length" class="list-table">
        <thead>
          <tr><th>Fórmula</th><th>Descrição</th></tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in formulas" :key="`${item.formula_id}-${index}`">
            <td>{{ item.formula_id === 'free' ? 'Livre' : (item.formula_name || item.formula_id) }}</td>
            <td style="white-space: pre-wrap;">{{ item.description }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="text-muted">Nenhuma fórmula encontrada.</p>
    </div>
  </div>
  <div v-else class="card empty">Prescrição não encontrada.</div>
</template>