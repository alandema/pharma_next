<script setup lang="ts">
import { useInputFormatting } from '../../composables/useInputFormatting'
import { GENDER_OPTIONS } from '#shared/utils/commonOptions'

const { data: me, refresh } = await useFetch<any>('/api/users/me')
const { data: profs } = await useAsyncData('profs', () => queryCollection('professionals').first())
const { formatBrazilPhoneInput, formatCepInput, isValidBirthDate, normalizeText } = useInputFormatting()

const states = ref<any[]>([])
const cities = ref<any[]>([])
const successMessage = ref('')
const errorMessage = ref('')

const form = ref({ ...me.value })

const selectedProf = computed(() => profs.value?.professionals?.find((p: any) => p.name === form.value.professional_type))

onMounted(async () => { states.value = await $fetch<any[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados') })
watch(() => form.value.state, async (uf) => { cities.value = uf ? await $fetch<any[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`) : [] }, { immediate: true })

watch(() => form.value.phone, (value) => {
  const formatted = formatBrazilPhoneInput(value)
  if (formatted !== value) form.value.phone = formatted
}, { immediate: true })

watch(() => form.value.zipcode, (value) => {
  const formatted = formatCepInput(value)
  if (formatted !== value) form.value.zipcode = formatted
}, { immediate: true })

const normalizeForm = () => ({
  send_email: form.value.send_email,
  full_name: normalizeText(form.value.full_name, { titleCase: true }),
  gender: normalizeText(form.value.gender, { titleCase: true }),
  birth_date: normalizeText(form.value.birth_date),
  phone: formatBrazilPhoneInput(form.value.phone),
  zipcode: formatCepInput(form.value.zipcode),
  street: normalizeText(form.value.street, { titleCase: true }),
  address_number: normalizeText(form.value.address_number),
  complement: normalizeText(form.value.complement, { titleCase: true }),
  city: normalizeText(form.value.city, { titleCase: true }),
  state: normalizeText(form.value.state).toUpperCase(),
})

const save = async () => {
  successMessage.value = ''
  errorMessage.value = ''
  const payload = normalizeForm()

  if (!payload.zipcode) {
    errorMessage.value = 'CEP é obrigatório para usuários/profissionais.'
    return
  }

  if (payload.birth_date && !isValidBirthDate(payload.birth_date)) {
    errorMessage.value = 'Data de nascimento inválida.'
    return
  }

  try {
    await $fetch('/api/users/me', { method: 'PUT', body: payload })
    successMessage.value = 'Configurações atualizadas!'
    await refresh()
  } catch (error: any) {
    errorMessage.value = error?.data?.message ?? 'Não foi possível salvar o perfil.'
  }
}
</script>

<template>
  <div class="page-header">
    <h1>Meu Perfil</h1>
  </div>
  <div class="card" style="max-width: 800px; margin: 0 auto;">
    <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
    <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
    <form @submit.prevent="save" class="grid-form">
      <div class="section-title">Informações de Acesso</div>
      <div class="form-group"><label>E-mail</label><input v-model="form.email" disabled /></div>
      <div class="form-group"><label>Senha</label><input type="password" placeholder="********" disabled /></div>
      
      <div class="section-title">Informações Pessoais</div>
      <div class="form-group"><label>Nome Completo</label><input v-model="form.full_name" /></div>
      <div class="form-group"><label>CPF</label><input v-model="form.cpf" disabled /></div>
      
      <div class="form-group"><label>Sexo</label>
        <select v-model="form.gender"><option value="">Selecione</option><option v-for="gender in GENDER_OPTIONS" :key="gender" :value="gender">{{ gender }}</option></select>
      </div>
      <div class="form-group"><label>Data de nascimento</label><input v-model="form.birth_date" type="date" /></div>
      
      <div class="form-group"><label>Telefone</label><input v-model="form.phone" inputmode="tel" placeholder="Ex: +55 11 91234-5678" /></div>
      
      <div class="section-title">Informações Profissionais</div>
      <div class="form-group"><label>Tipo de Profissional</label><input v-model="form.professional_type" disabled /></div>

      <div class="form-group"><label>Conselho</label><input v-model="form.council" disabled /></div>
      <div class="form-group"><label>Número do Conselho</label><input v-model="form.council_number" disabled /></div>
      <div class="form-group"><label>UF Conselho</label><input v-model="form.council_state" disabled /></div>
      
      <div class="form-group" style="grid-column: 1 / -1" v-if="selectedProf">
        <label>Especialidades (Apenas visualização)</label>
        <div style="display:flex;gap:1rem;flex-wrap:wrap">
          <label v-for="spec in selectedProf.specialties" :key="spec" style="display:flex;align-items:center;gap:0.5rem"><input type="checkbox" :value="spec" v-model="form.specialties" disabled /> {{spec}}</label>
        </div>
      </div>

      <div class="section-title">Endereço Profissional</div>
      <div class="form-group"><label>CEP</label><input v-model="form.zipcode" inputmode="numeric" placeholder="00000-000" /></div>
      <div class="form-group"><label>Estado</label><select v-model="form.state"><option v-for="s in states" :key="s.id" :value="s.sigla">{{ s.nome }}</option></select></div>
      <div class="form-group"><label>Cidade</label><select v-model="form.city" :disabled="!cities.length"><option v-for="c in cities" :key="c.id" :value="c.nome">{{ c.nome }}</option></select></div>
      <div class="form-group" style="grid-column: 1 / -1"><label>Endereço</label><input v-model="form.street" /></div>
      <div class="form-group"><label>Número</label><input v-model="form.address_number" /></div>
      <div class="form-group"><label>Complemento</label><input v-model="form.complement" /></div>

      <div class="form-group" style="grid-column: 1 / -1; display:flex; gap:0.5rem; align-items:center; margin-top: 1rem;">
        <input type="checkbox" id="se_me" v-model="form.send_email" />
        <label for="se_me" style="margin:0">Receber e-mails de cópia das prescrições</label>
      </div>

      <div class="form-group" style="grid-column: 1 / -1">
        <button type="submit">Salvar Perfil</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.section-title { grid-column: 1 / -1; margin-top: 1.5rem; margin-bottom: 0.25rem; font-weight: 600; font-size: 1.1rem; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem; color: #333; }
.card { padding: 1.5rem; }
</style>