<script setup lang="ts">
type Formula = { id: string; name: string; information?: string | null };
type PrescriptionFormulaInput = { formula_id: string; description: string };

const getTodayDate = () => new Date().toISOString().split('T')[0];

const route = useRoute();
const patient_id = ref((route.query.patient_id as string) || '');
const date_prescribed = ref(getTodayDate());
const cid_code = ref((route.query.cid_code as string) || '');
const manual_cid = ref('');
const formulasInput = ref<PrescriptionFormulaInput[]>([]);

const [{ data: patients }, { data: cidsData }, { data: formulas }] = await Promise.all([
  useFetch('/api/patients'),
  useAsyncData('cids', () => queryCollection('cids').first()),
  useFetch<Formula[]>('/api/formulas')
]);

const cids = computed(() => {
  const codes = cidsData.value?.codes ?? [];
  return [...codes].sort((a, b) => a.name.localeCompare(b.name));
});

// If the prepopulated cid_code is not empty, not 'Outro', and not in the list of CIDs, it means it's a manual CID from reuse.
if (cid_code.value && cid_code.value !== 'Outro' && !cids.value.some(c => c.code === cid_code.value)) {
  manual_cid.value = cid_code.value;
  cid_code.value = 'Outro';
}

const parseFormulasFromQuery = () => {
  const formulasQuery = route.query.formulas as string | undefined;
  if (!formulasQuery) return;
  try {
    const parsed = JSON.parse(formulasQuery);
    if (Array.isArray(parsed)) {
      formulasInput.value = parsed
        .slice(0, 10)
        .map((item: { formula_id?: string; description?: string }) => ({
          formula_id: item.formula_id || '',
          description: item.description || '',
        }));
    }
  } catch {}
};

const addFormula = () => {
  if (formulasInput.value.length >= 10) return;
  formulasInput.value.push({ formula_id: '', description: '' });
};

const removeFormula = (index: number) => {
  formulasInput.value.splice(index, 1);
};

const submit = async () => {
  const cleanedFormulas = formulasInput.value
    .map((item) => ({ formula_id: item.formula_id, description: item.description.trim() }))
    .filter((item) => item.formula_id && item.description);

  const finalCid = cid_code.value === 'Outro' ? manual_cid.value.trim() : cid_code.value;

  await $fetch('/api/prescriptions', {
    method: 'POST',
    body: { patient_id: patient_id.value, cid_code: finalCid, formulas: cleanedFormulas }
  });
  await navigateTo('/prescriptions');
};

parseFormulasFromQuery();
if (!formulasInput.value.length) addFormula();

</script>

<template>
  <div class="page-header">
    <h1>Nova Prescrição</h1>
    <button @click="navigateTo('/prescriptions')">← Voltar</button>
  </div>
  <div class="card">
    <form @submit.prevent="submit">
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
              <select v-model="item.formula_id" @change="item.description = (item.formula_id === 'free' ? '' : (formulas?.find(f => f.id === item.formula_id)?.information || ''))" required>
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
      <button type="submit">Salvar Prescrição</button>
    </form>
  </div>
</template>