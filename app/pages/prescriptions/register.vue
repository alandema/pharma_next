<script setup lang="ts">
type Formula = { id: string; name: string; information?: string | null };
type PrescriptionFormulaInput = { formula_id: string; description: string };
type PreviewResponse = { pdf_base64: string; pdf_hash: string };

const getTodayDate = () => new Date().toISOString().split('T')[0];

const route = useRoute();
const toast = useToast();
const patient_id = ref((route.query.patient_id as string) || '');
const date_prescribed = ref(getTodayDate());
const cid_code = ref((route.query.cid_code as string) || '');
const manual_cid = ref('');
const formulasInput = ref<PrescriptionFormulaInput[]>([]);
const isPreviewing = ref(false);
const previewPdfUrl = ref('');
const previewPayload = ref<PreviewResponse | null>(null);
const isSubmitting = ref(false);

const [{ data: patientsResponse }, { data: cidsData }, { data: formulasResponse }] = await Promise.all([
  useFetch<any>('/api/patients', { query: { limit: 1000 } }),
  useAsyncData('cids', () => queryCollection('cids').first()),
  useFetch<any>('/api/formulas', { query: { limit: 1000 } })
]);

const patients = computed(() => patientsResponse.value?.data || []);
const formulas = computed<Formula[]>(() => formulasResponse.value?.data || []);

const cids = computed(() => {
  const codes = cidsData.value?.codes ?? [];
  return [...codes].sort((a, b) => a.name.localeCompare(b.name));
});

const parseFormulasFromQuery = () => {
  const formulasQuery = route.query.formulas as string | undefined;
  if (!formulasQuery) return;
  const parsed = JSON.parse(formulasQuery);

  if (!Array.isArray(parsed)) {
    throw new Error('Parâmetro formulas inválido.');
  }

  formulasInput.value = parsed
    .slice(0, 10)
    .map((item: { formula_id?: string; description?: string }) => {
      if (typeof item.formula_id !== 'string' || typeof item.description !== 'string') {
        throw new Error('Formato de fórmula inválido na URL.');
      }

      return {
        formula_id: item.formula_id,
        description: item.description,
      };
    });
};

const addFormula = () => {
  if (formulasInput.value.length >= 10) return;
  formulasInput.value.push({ formula_id: '', description: '' });
};

const removeFormula = (index: number) => {
  formulasInput.value.splice(index, 1);
};

const updateFormulaDescription = (item: PrescriptionFormulaInput) => {
  if (item.formula_id === 'free') {
    item.description = '';
    return;
  }

  const selected = formulas.value?.find((formula) => formula.id === item.formula_id);
  if (!selected || typeof selected.information !== 'string') {
    item.formula_id = '';
    item.description = '';
    toast.add('Fórmula inválida: informação obrigatória não encontrada.', 'error');
    return;
  }

  item.description = selected.information;
};

const clearPreview = () => {
  if (previewPdfUrl.value) {
    URL.revokeObjectURL(previewPdfUrl.value);
  }
  previewPdfUrl.value = '';
  previewPayload.value = null;
  isPreviewing.value = false;
};

const base64ToPdfUrl = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
};

const buildPayload = () => {
  const cleanedFormulas = formulasInput.value
    .map((item) => ({ formula_id: item.formula_id, description: item.description.trim() }))
    .filter((item) => item.formula_id && item.description);

  const finalCid = cid_code.value === 'Outro' ? manual_cid.value.trim() : cid_code.value;

  return { patient_id: patient_id.value, cid_code: finalCid, formulas: cleanedFormulas };
};

const preview = async () => {
  const payload = buildPayload();
  const data = await $fetch<PreviewResponse>('/api/prescriptions', {
    method: 'POST',
    body: { ...payload, preview_only: true }
  });

  if (previewPdfUrl.value) {
    URL.revokeObjectURL(previewPdfUrl.value);
  }

  previewPayload.value = data;
  previewPdfUrl.value = base64ToPdfUrl(data.pdf_base64);
  isPreviewing.value = true;
};

const save = async () => {
  const payload = buildPayload();
  if (!previewPayload.value) {
    throw new Error('Preview ausente. Gere o preview antes de salvar.');
  }

  await $fetch('/api/prescriptions', {
    method: 'POST',
    body: {
      ...payload,
      preview_pdf_base64: previewPayload.value.pdf_base64,
      preview_pdf_hash: previewPayload.value.pdf_hash,
    }
  });
  clearPreview();
  await navigateTo('/prescriptions');
};

const submit = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    if (isPreviewing.value) {
      await save();
      return;
    }
    await preview();
  } finally {
    isSubmitting.value = false;
  }
};

parseFormulasFromQuery();
if (!formulasInput.value.length) addFormula();

onBeforeUnmount(() => {
  if (previewPdfUrl.value) {
    URL.revokeObjectURL(previewPdfUrl.value);
  }
});

</script>

<template>
  <div class="page-header">
    <h1>Nova Prescrição</h1>
    <button v-if="!isPreviewing" @click="navigateTo('/prescriptions')">← Voltar</button>
  </div>
  <div class="card">
    <form @submit.prevent="submit">
      <template v-if="!isPreviewing">
      <div class="form-row">
        <div class="form-group">
          <label>Paciente *</label>
          <select v-model="patient_id" required>
            <option value="" disabled>Selecione um paciente</option>
            <option v-for="patient in patients" :key="patient.id" :value="patient.id">{{ patient.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Data *</label>
          <input v-model="date_prescribed" type="date" disabled />
        </div>
      </div>
      <div class="form-group">
        <label>Código CID *</label>
        <select v-model="cid_code" required>
          <option value="" disabled>Selecione um código CID</option>
          <option v-for="c in cids" :key="c.code" :value="c.code">{{ c.code }} – {{ c.name }}</option>
        </select>
      </div>
      <div class="form-group" v-if="cid_code === 'Outro'">
        <input v-model="manual_cid" type="text" placeholder="Digite o CID" required />
      </div>
      <div class="form-group">
        <label>Fórmulas Prescritas *</label>
        <div v-for="(item, index) in formulasInput" :key="index" class="card mb-2" style="padding: .75rem;">
          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label>Fórmula {{ index + 1 }} *</label>
              <select v-model="item.formula_id" @change="updateFormulaDescription(item)" required>
                <option value="" disabled>Selecione uma fórmula</option>
                <option value="free">*Personalizada*</option>
                <option v-for="formula in formulas" :key="formula.id" :value="formula.id">{{ formula.name }}</option>
              </select>
            </div>
            <div style="display:flex;align-items:flex-end;">
              <button v-if="formulasInput.length > 1" type="button" class="btn-danger" @click="removeFormula(index)">Remover</button>
            </div>
          </div>
          <div class="form-group">
            <label>Descrição *</label>
            <textarea v-model="item.description" :placeholder="item.formula_id === 'free' ? 'Digite a descrição que sairá na receita...' : 'Você pode editar a fórmula aqui.'" rows="3" required></textarea>
          </div>
        </div>
        <button type="button" class="btn-sm" @click="addFormula" :disabled="formulasInput.length >= 10">+ Adicionar Fórmula</button>
        <p class="text-muted" style="margin-top:.5rem">{{ formulasInput.length }}/10 fórmulas</p>
      </div>
      </template>
      <template v-else>
        <div class="form-group">
          <label>Prescrição</label>
          <iframe
            :src="previewPdfUrl"
            title="Pré-visualização da prescrição"
            style="width:100%;height:75vh;border:1px solid var(--border,#ddd);border-radius:8px;background:#fff;"
          ></iframe>
        </div>
      </template>
      <div class="btn-group" style="justify-content:flex-end;gap:.5rem;">
        <button v-if="isPreviewing" type="button" :disabled="isSubmitting" @click="clearPreview">Editar</button>
        <button type="submit" :disabled="isSubmitting">{{ isSubmitting ? (isPreviewing ? 'Salvando...' : 'Gerando Preview...') : (isPreviewing ? 'Confirmar e Salvar' : 'Pré-visualizar') }}</button>
      </div>
    </form>
  </div>
</template>