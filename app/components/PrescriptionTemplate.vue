<script setup lang="ts">
import { useDateFormatting } from "../composables/useDateFormatting";

type Patient = {
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

type Prescriber = {
  id: string;
  full_name?: string | null;
  email?: string | null;
} | null;

type Prescription = {
  id: string;
  date_prescribed: string;
  json_form_info: ParsedPrescriptionInfo;
  patient: Patient;
  user: Prescriber;
};

type ParsedPrescriptionInfo = {
  cid_code?: string;
  formulas?: {
    formula_id?: string;
    formula_name?: string;
    description?: string;
  }[];
  [key: string]: unknown;
};

type CidEntry = {
  code: string;
  name: string;
};

const props = defineProps<{
  prescription: Prescription;
  cids: CidEntry[];
}>();

const formInfo = computed<ParsedPrescriptionInfo>(() => {
  return props.prescription.json_form_info;
});

const cidCode = computed(() => (formInfo.value.cid_code as string) ?? "");

const cidLabel = computed(() => {
  const entry = props.cids.find((c) => c.code === cidCode.value);
  return entry ? `${cidCode.value} – ${entry.name}` : cidCode.value;
});

const detailEntries = computed(() =>
  Object.entries(formInfo.value).filter(
    ([key]) => key !== "cid_code" && key !== "formulas",
  ),
);

const formulas = computed(() => formInfo.value.formulas ?? []);
const { formatDatePtBR, formatDateTimePtBR } = useDateFormatting();

const formattedDate = computed(() => {
  return formatDatePtBR(props.prescription.date_prescribed);
});

const patientAddress = computed(() => {
  const p = props.prescription.patient;
  return [p.street, p.house_number, p.district, p.city, p.state]
    .filter(Boolean)
    .join(", ");
});

const prescriptionShortId = computed(() =>
  props.prescription.id.substring(0, 8).toUpperCase(),
);

const humanizeKey = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const generatedAt = formatDateTimePtBR(new Date());
const { brand } = useAppConfig();
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="rx-header">
      <div>
        <div class="clinic-name">{{ brand.name }}</div>
        <div class="clinic-subtitle">{{ brand.subtitle }}</div>
      </div>
      <div class="prescription-id">Nº {{ prescriptionShortId }}</div>
    </div>

    <!-- Patient block -->
    <div class="patient-block">
      <div class="full-row">
        <label>Paciente: </label>
        <span>{{ prescription.patient.name }}</span>
      </div>
      <div v-if="prescription.patient.birth_date">
        <label>Data de Nascimento: </label>
        <span>{{ formatDatePtBR(prescription.patient.birth_date) }}</span>
      </div>
      <div v-else></div>
      <div v-if="prescription.patient.gender">
        <label>Sexo: </label>
        <span>{{ prescription.patient.gender }}</span>
      </div>
      <div v-else></div>
      <div v-if="prescription.patient.cpf">
        <label>CPF: </label>
        <span>{{ prescription.patient.cpf }}</span>
      </div>
      <div v-else></div>
      <div v-if="prescription.patient.rg">
        <label>RG: </label>
        <span>{{ prescription.patient.rg }}</span>
      </div>
      <div v-else></div>
      <div v-if="prescription.patient.phone">
        <label>Telefone: </label>
        <span>{{ prescription.patient.phone }}</span>
      </div>
      <div v-else></div>
      <div v-if="patientAddress" class="full-row">
        <label>Endereço: </label>
        <span>{{ patientAddress }}</span>
      </div>
    </div>

    <!-- Meta row (date + CID) -->
    <div class="meta-row">
      <div class="meta-item">
        <label>Data da Prescrição</label>
        <span>{{ formattedDate }}</span>
      </div>
      <div v-if="cidLabel" class="meta-item">
        <label>CID</label>
        <span>{{ cidLabel }}</span>
      </div>
    </div>

    <!-- Rx divider -->
    <div class="rx-divider">
      <span class="rx-symbol">Rx</span>
      <div class="rx-line"></div>
    </div>

    <!-- Prescription details -->
    <table v-if="formulas.length" class="details-table">
      <thead>
        <tr>
          <th class="detail-key">Fórmula</th>
          <th class="detail-value">Descrição</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in formulas"
          :key="`${item.formula_id || index}`"
        >
          <td class="detail-key">
            {{ item.formula_name || item.formula_id || `Fórmula ${index + 1}` }}
          </td>
          <td class="detail-value">{{ item.description || "" }}</td>
        </tr>
      </tbody>
    </table>

    <table v-else class="details-table">
      <tbody>
        <template v-if="detailEntries.length > 0">
          <tr v-for="[key, value] in detailEntries" :key="key">
            <td class="detail-key">{{ humanizeKey(key) }}</td>
            <td class="detail-value">{{ String(value ?? "") }}</td>
          </tr>
        </template>
        <tr v-else>
          <td colspan="2" class="no-details">
            Nenhum detalhe adicional fornecido.
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Signature -->
    <div class="signature-block">
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="prescriber">
          {{
            prescription.user?.full_name ||
            prescription.user?.email ||
            "Prescritor"
          }}
        </div>
        <div class="prescriber-label">Prescritor Responsável</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="rx-footer">
      <span>Documento gerado em {{ generatedAt }}</span>
      <span>ID: {{ prescription.id }}</span>
    </div>
  </div>
</template>

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}

.page {
  font-family: "Times New Roman", Times, serif;
  color: #111;
  background: #fff;
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 20mm 20mm 15mm 20mm;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Header ──────────────────────────────────────── */
.rx-header {
  border-bottom: 3px double #b8a44e;
  padding-bottom: 8px;
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.clinic-name {
  font-size: 22px;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #b8a44e;
}
.clinic-subtitle {
  font-size: 11px;
  color: #555;
  margin-top: 2px;
}
.prescription-id {
  font-size: 10px;
  color: #888;
  text-align: right;
}

/* ── Patient block ───────────────────────────────── */
.patient-block {
  border: 1px solid #bbb;
  border-radius: 4px;
  padding: 10px 14px;
  margin-bottom: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 20px;
  font-size: 12px;
}
.patient-block .full-row {
  grid-column: 1 / -1;
}
.patient-block label {
  font-weight: bold;
  color: #444;
}
.patient-block span {
  display: inline;
}

/* ── Meta row ────────────────────────────────────── */
.meta-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
  font-size: 12px;
  gap: 20px;
}
.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.meta-item label {
  font-weight: bold;
  color: #444;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

/* ── Rx divider ──────────────────────────────────── */
.rx-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.rx-symbol {
  font-size: 36px;
  font-style: italic;
  font-weight: bold;
  color: #b8a44e;
  line-height: 1;
}
.rx-line {
  flex: 1;
  border-top: 1.5px solid #b8a44e;
}

/* ── Details table ───────────────────────────────── */
.details-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-bottom: 20px;
  flex: 1;
}
.detail-key {
  font-weight: bold;
  text-transform: capitalize;
  width: 30%;
  padding: 5px 8px 5px 0;
  vertical-align: top;
  border-bottom: 1px dotted #ccc;
  color: #333;
}
.detail-value {
  padding: 5px 0 5px 8px;
  vertical-align: top;
  border-bottom: 1px dotted #ccc;
  white-space: pre-wrap;
  word-break: break-word;
}
.no-details {
  color: #888;
  font-style: italic;
  padding: 8px 0;
}

/* ── Signature ───────────────────────────────────── */
.signature-block {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 40px;
}
.signature-box {
  text-align: center;
  min-width: 220px;
}
.signature-line {
  border-top: 1.5px solid #333;
  margin-bottom: 4px;
}
.prescriber {
  font-size: 12px;
  font-weight: bold;
}
.prescriber-label {
  font-size: 10px;
  color: #555;
}

/* ── Footer ──────────────────────────────────────── */
.rx-footer {
  border-top: 1px solid #bbb;
  margin-top: 20px;
  padding-top: 6px;
  font-size: 9px;
  color: #888;
  display: flex;
  justify-content: space-between;
}

/* ── Print ───────────────────────────────────────── */
@media print {
  .page {
    margin: 0;
    padding: 15mm 15mm 10mm 15mm;
    width: 100%;
    min-height: 100vh;
  }
}
</style>
