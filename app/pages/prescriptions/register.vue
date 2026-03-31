<script setup lang="ts">
import { useDateFormatting } from '../../composables/useDateFormatting'

type Formula = { id: string; name: string; information?: string | null };
type PatientOption = { id: string; name: string };
type PrescriptionFormulaInput = { formula_id: string; description: string };
type PreviewResponse = { pdf_base64: string; pdf_hash: string };
type SignatureStatus = 'signed' | 'unsigned';
type SafeIdQrStatus = 'pending_authorization' | 'authorized' | 'processing' | 'signed' | 'denied' | 'failed' | 'expired';
type SafeIdQrStartResponse = { session_id: string; authorize_url: string; expires_at: string };
type SafeIdQrStatusResponse = {
  status: SafeIdQrStatus;
  signed_pdf_base64?: string;
  signed_pdf_hash?: string;
  error?: string;
};
type PaginationMetadata = { total: number; page: number; limit: number; totalPages: number };
type PaginatedResponse<T> = { data: T[]; metadata: PaginationMetadata };
type QueryValue = string | null | undefined | (string | null)[];

const route = useRoute();
const toast = useToast();
const { getTodayInputDate } = useDateFormatting()

const getSingleQueryValue = (value: QueryValue) => {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : ''
  }

  return typeof value === 'string' ? value : ''
}

const patient_id = ref(getSingleQueryValue(route.query.patient_id as QueryValue));
const patientOptionsPage = ref(1);
const date_prescribed = ref(getTodayInputDate());
const cid_code = ref(getSingleQueryValue(route.query.cid_code as QueryValue));
const manual_cid = ref('');
const formulaOptionsPage = ref(1);
const formulasInput = ref<PrescriptionFormulaInput[]>([]);
const selectedPatientFallback = ref<PatientOption | null>(null);
const isPreviewing = ref(false);
const previewPdfUrl = ref('');
const previewPayload = ref<PreviewResponse | null>(null);
const signatureStatus = ref<SignatureStatus>('unsigned');

const isPreparingSignature = ref(false);
const isSignPanelVisible = ref(false);
const signAuthorizeUrl = ref('');
const signSessionId = ref('');
const signStatusMessage = ref('');
let signStatusPollTimer: ReturnType<typeof setInterval> | null = null;

const isSubmitting = ref(false);
const formulaCache = ref<Record<string, Formula>>({});

const { data: cidsData } = await useAsyncData('cids', () => queryCollection('cids').first());
const { data: patientsResponse } = await useFetch<PaginatedResponse<PatientOption>>('/api/patients', {
  method: 'GET',
  query: { page: patientOptionsPage, limit: 10 },
  watch: [patientOptionsPage],
});
const { data: formulasResponse } = await useFetch<PaginatedResponse<Formula>>('/api/formulas', {
  method: 'GET',
  query: { page: formulaOptionsPage, limit: 10 },
  watch: [formulaOptionsPage],
});

const patients = computed<PatientOption[]>(() => patientsResponse.value?.data || []);
const patientsMetadata = computed(() => patientsResponse.value?.metadata || { total: 0, page: 1, limit: 10, totalPages: 1 });
const formulas = computed<Formula[]>(() => formulasResponse.value?.data || []);
const formulasMetadata = computed(() => formulasResponse.value?.metadata || { total: 0, page: 1, limit: 10, totalPages: 1 });

watch(formulas, (items) => {
  for (const formula of items) {
    formulaCache.value[formula.id] = formula;
  }
}, { immediate: true });

const formulaOptions = computed<Formula[]>(() => {
  const merged = new Map<string, Formula>();

  for (const formula of formulas.value) {
    merged.set(formula.id, formula);
  }

  for (const item of formulasInput.value) {
    if (!item.formula_id || item.formula_id === 'free') {
      continue;
    }

    const cached = formulaCache.value[item.formula_id];
    if (cached) {
      merged.set(cached.id, cached);
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
});

const cids = computed(() => {
  const codes = cidsData.value?.codes ?? [];
  return [...codes].sort((a, b) => a.name.localeCompare(b.name));
});

const parseFormulasFromQuery = () => {
  const formulasQuery = getSingleQueryValue(route.query.formulas as QueryValue);
  if (!formulasQuery) return;

  try {
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
  } catch {
    formulasInput.value = []
    toast.add('Parâmetros de fórmulas inválidos na URL. Revise e tente novamente.', 'error')
  }
};

const addFormula = () => {
  if (formulasInput.value.length >= 10) return;
  formulasInput.value.push({ formula_id: '', description: '' });
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

const nextFormulasPage = () => {
  if (formulaOptionsPage.value < formulasMetadata.value.totalPages) {
    formulaOptionsPage.value++;
  }
};

const prevFormulasPage = () => {
  if (formulaOptionsPage.value > 1) {
    formulaOptionsPage.value--;
  }
};

const removeFormula = (index: number) => {
  formulasInput.value.splice(index, 1);
};

const updateFormulaDescription = (item: PrescriptionFormulaInput) => {
  if (item.formula_id === 'free') {
    item.description = '';
    return;
  }

  const selected = formulaCache.value[item.formula_id] || formulaOptions.value.find((formula) => formula.id === item.formula_id);
  if (!selected || typeof selected.information !== 'string') {
    item.formula_id = '';
    item.description = '';
    toast.add('Fórmula inválida: informação obrigatória não encontrada.', 'error');
    return;
  }

  item.description = selected.information;
};

const getErrorMessage = (error: unknown) => {
  const normalized = error as { data?: { statusMessage?: string; message?: string }, statusMessage?: string, message?: string }
  return normalized?.data?.statusMessage || normalized?.data?.message || normalized?.statusMessage || normalized?.message || 'Não foi possível concluir a operação.'
}

const stopSignaturePolling = () => {
  if (signStatusPollTimer) {
    clearInterval(signStatusPollTimer)
    signStatusPollTimer = null
  }
}

const resetSignatureFlow = () => {
  stopSignaturePolling()
  isSignPanelVisible.value = false
  signSessionId.value = ''
  signStatusMessage.value = ''
  signAuthorizeUrl.value = ''
  isPreparingSignature.value = false
}

const clearPreview = () => {
  if (previewPdfUrl.value) {
    URL.revokeObjectURL(previewPdfUrl.value);
  }
  previewPdfUrl.value = '';
  previewPayload.value = null;
  signatureStatus.value = 'unsigned'
  resetSignatureFlow()
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

const applyPreviewData = (data: PreviewResponse) => {
  if (previewPdfUrl.value) {
    URL.revokeObjectURL(previewPdfUrl.value);
  }
  previewPayload.value = data;
  previewPdfUrl.value = base64ToPdfUrl(data.pdf_base64);
  isPreviewing.value = true;
};

const buildPayload = () => {
  const cleanedFormulas = formulasInput.value
    .map((item) => ({ formula_id: item.formula_id, description: item.description.trim() }))
    .filter((item) => item.formula_id && item.description);

  const selectedCid = cids.value.find((cid) => cid.code === cid_code.value);
  const cidDescription = selectedCid?.name;
  const finalCid = cid_code.value === 'Outro'
    ? manual_cid.value.trim()
    : cidDescription
      ? `${cid_code.value} - ${cidDescription}`
      : cid_code.value;

  return { patient_id: patient_id.value, cid_code: finalCid, formulas: cleanedFormulas };
};

const validateBeforeSubmit = () => {
  if (!patient_id.value) {
    toast.add('Paciente é obrigatório.', 'error')
    return false
  }

  if (!cid_code.value) {
    toast.add('CID é obrigatório.', 'error')
    return false
  }

  if (cid_code.value === 'Outro' && !manual_cid.value.trim()) {
    toast.add('Informe o CID manual quando selecionar "Outro".', 'error')
    return false
  }

  if (formulasInput.value.length === 0) {
    toast.add('Adicione ao menos uma fórmula.', 'error')
    return false
  }

  if (formulasInput.value.length > 10) {
    toast.add('Máximo de 10 fórmulas por prescrição.', 'error')
    return false
  }

  for (const [index, item] of formulasInput.value.entries()) {
    if (!item.formula_id) {
      toast.add(`Selecione a fórmula ${index + 1}.`, 'error')
      return false
    }

    if (!item.description.trim()) {
      toast.add(`Descrição da fórmula ${index + 1} é obrigatória.`, 'error')
      return false
    }
  }

  return true
}

const ensureSelectedPatientOption = async () => {
  if (!patient_id.value) {
    selectedPatientFallback.value = null;
    return;
  }

  const selectedInCurrentPage = patients.value.find((patient) => patient.id === patient_id.value);
  if (selectedInCurrentPage) {
    selectedPatientFallback.value = selectedInCurrentPage;
    return;
  }

  try {
    const selectedPatient = await $fetch<PatientOption>(`/api/patients/${patient_id.value}`, { method: 'GET' });
    selectedPatientFallback.value = { id: selectedPatient.id, name: selectedPatient.name };
  } catch {
    selectedPatientFallback.value = null;
  }
};

const hydrateFormulaCacheFromInputs = async () => {
  const missingIds = Array.from(new Set(
    formulasInput.value
      .map((item) => item.formula_id)
      .filter((id) => id && id !== 'free' && !formulaCache.value[id]),
  ));

  if (!missingIds.length) {
    return;
  }

  const fetched = await Promise.all(missingIds.map(async (id) => {
    try {
      return await $fetch<Formula>(`/api/formulas/${id}`, { method: 'GET' });
    } catch {
      return null;
    }
  }));

  for (const formula of fetched) {
    if (formula) {
      formulaCache.value[formula.id] = formula;
    }
  }
};

const requestPreview = async (targetSignatureStatus: SignatureStatus) => {
  const payload = buildPayload();
  return await $fetch<PreviewResponse>('/api/prescriptions', {
    method: 'POST',
    body: {
      ...payload,
      preview_only: true,
      signature_status: targetSignatureStatus,
    },
  });
}

const preview = async () => {
  const data = await requestPreview('unsigned');
  signatureStatus.value = 'unsigned'
  applyPreviewData(data)
};

const pollSignatureStatus = async () => {
  if (!signSessionId.value) {
    return
  }

  try {
    const response = await $fetch<SafeIdQrStatusResponse>('/api/safeid/qrcode/status', {
      method: 'GET',
      query: {
        session_id: signSessionId.value,
      },
    })

    if (response.status === 'pending_authorization') {
      signStatusMessage.value = 'Aguardando autorização na aba do SafeID.'
      return
    }

    if (response.status === 'authorized' || response.status === 'processing') {
      signStatusMessage.value = 'Autorização recebida. Aplicando assinatura digital no PDF...'
      return
    }

    if (response.status === 'signed') {
      if (typeof response.signed_pdf_base64 !== 'string' || typeof response.signed_pdf_hash !== 'string') {
        throw new Error('SafeID não retornou o conteúdo assinado.')
      }

      applyPreviewData({
        pdf_base64: response.signed_pdf_base64,
        pdf_hash: response.signed_pdf_hash,
      })
      signatureStatus.value = 'signed'
      resetSignatureFlow()
      toast.add('Documento assinado digitalmente com sucesso.', 'success')
      return
    }

    if (response.status === 'denied' || response.status === 'failed' || response.status === 'expired') {
      const statusMessage = response.error || 'Não foi possível concluir a assinatura digital.'
      resetSignatureFlow()
      toast.add(statusMessage, 'error')
    }
  } catch (error) {
    resetSignatureFlow()
    toast.add(getErrorMessage(error), 'error')
  }
}

const startSignaturePolling = () => {
  stopSignaturePolling()
  void pollSignatureStatus()
  signStatusPollTimer = setInterval(() => {
    void pollSignatureStatus()
  }, 2500)
}

const startDigitalSignature = async () => {
  if (isPreparingSignature.value || !isPreviewing.value || !previewPayload.value) {
    return
  }

  let authTab: Window | null = null
  isPreparingSignature.value = true
  isSignPanelVisible.value = true
  signStatusMessage.value = 'Abrindo autorização do SafeID em nova guia...'
  try {
    authTab = window.open('', '_blank')
    const previewForSignature = await requestPreview('signed')

    const qrSession = await $fetch<SafeIdQrStartResponse>('/api/safeid/qrcode/start', {
      method: 'POST',
      body: {
        pdf_base64: previewForSignature.pdf_base64,
        pdf_hash: previewForSignature.pdf_hash,
      },
    })

    signSessionId.value = qrSession.session_id
    signAuthorizeUrl.value = qrSession.authorize_url

    if (authTab && !authTab.closed) {
      authTab.location.href = qrSession.authorize_url
    } else {
      window.open(qrSession.authorize_url, '_blank')
    }

    signStatusMessage.value = 'A autorização foi aberta em nova guia. Conclua no SafeID e retorne para esta tela.'
    startSignaturePolling()
  } catch (error) {
    if (authTab && !authTab.closed) {
      authTab.close()
    }
    resetSignatureFlow()
    toast.add(getErrorMessage(error), 'error')
  } finally {
    isPreparingSignature.value = false
  }
}

const cancelSignatureFlow = () => {
  resetSignatureFlow()
}

const save = async () => {
  const payload = buildPayload();
  if (!previewPayload.value) {
    throw new Error('Pré-visualização ausente. Gere a pré-visualização antes de salvar.');
  }

  await $fetch('/api/prescriptions', {
    method: 'POST',
    body: {
      ...payload,
      preview_pdf_base64: previewPayload.value.pdf_base64,
      preview_pdf_hash: previewPayload.value.pdf_hash,
      signature_status: signatureStatus.value,
    }
  });
  clearPreview();
  await navigateTo('/prescriptions');
};

const submit = async () => {
  if (isSubmitting.value) return;

  if (!validateBeforeSubmit()) return;

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
await hydrateFormulaCacheFromInputs();
await ensureSelectedPatientOption();
if (!formulasInput.value.length) addFormula();

onBeforeUnmount(() => {
  stopSignaturePolling()
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
          <div v-if="patientsMetadata.totalPages > 1" class="lookup-pagination" style="margin-bottom:0.5rem;">
            <button type="button" class="btn-sm" :disabled="patientOptionsPage <= 1" @click="prevPatientsPage">Anterior</button>
            <span>Página {{ patientsMetadata.page }} de {{ patientsMetadata.totalPages }}</span>
            <button type="button" class="btn-sm" :disabled="patientOptionsPage >= patientsMetadata.totalPages" @click="nextPatientsPage">Próxima</button>
          </div>
          <select v-model="patient_id" required>
            <option value="" disabled>Selecione um paciente</option>
            <option
              v-if="selectedPatientFallback && !patients.some((patient) => patient.id === selectedPatientFallback!.id)"
              :value="selectedPatientFallback.id"
            >
              {{ selectedPatientFallback.name }}
            </option>
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
        <div v-if="formulasMetadata.totalPages > 1" class="lookup-pagination" style="margin-bottom:0.75rem;">
          <button type="button" class="btn-sm" :disabled="formulaOptionsPage <= 1" @click="prevFormulasPage">Anterior</button>
          <span>Página {{ formulasMetadata.page }} de {{ formulasMetadata.totalPages }}</span>
          <button type="button" class="btn-sm" :disabled="formulaOptionsPage >= formulasMetadata.totalPages" @click="nextFormulasPage">Próxima</button>
        </div>
        <div v-for="(item, index) in formulasInput" :key="index" class="card mb-2" style="padding: .75rem;">
          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label>Fórmula {{ index + 1 }} *</label>
              <select v-model="item.formula_id" @change="updateFormulaDescription(item)" required>
                <option value="" disabled>Selecione uma fórmula</option>
                <option value="free">*Personalizada*</option>
                <option v-for="formula in formulaOptions" :key="formula.id" :value="formula.id">{{ formula.name }}</option>
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

        <div class="card" style="padding:1rem;margin-bottom:1rem;">
          <div class="form-row" style="justify-content:space-between;align-items:center;gap:1rem;">
            <div>
              <label style="display:block;margin-bottom:.2rem;">Status da assinatura</label>
              <strong :style="{ color: signatureStatus === 'signed' ? '#166534' : '#B91C1C' }">
                {{ signatureStatus === 'signed' ? 'Assinado digitalmente' : 'DOCUMENTO NÃO ASSINADO' }}
              </strong>
            </div>

            <button
              v-if="signatureStatus !== 'signed'"
              type="button"
              class="btn-sm"
              :disabled="isPreparingSignature || isSubmitting"
              @click="startDigitalSignature"
            >
              {{ isPreparingSignature ? 'Preparando assinatura...' : 'Assinar' }}
            </button>
          </div>

          <div v-if="isSignPanelVisible" style="margin-top:1rem;border-top:1px solid var(--border,#ddd);padding-top:1rem;">
            <p class="text-muted" style="margin-top:0;margin-bottom:.75rem;">{{ signStatusMessage }}</p>
            <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center;">
              <a v-if="signAuthorizeUrl" :href="signAuthorizeUrl" target="_blank" rel="noopener noreferrer">Abrir autorização novamente</a>
              <button type="button" class="btn-danger" @click="cancelSignatureFlow">Cancelar assinatura</button>
            </div>
          </div>
        </div>
      </template>
      <div class="btn-group" style="justify-content:flex-end;gap:.5rem;">
        <button v-if="isPreviewing" type="button" :disabled="isSubmitting || isPreparingSignature" @click="clearPreview">Editar</button>
        <button type="submit" :disabled="isSubmitting || isPreparingSignature">{{ isSubmitting ? (isPreviewing ? 'Salvando...' : 'Gerando pré-visualização...') : (isPreviewing ? 'Confirmar e Salvar' : 'Pré-visualizar') }}</button>
      </div>
    </form>
  </div>
</template>