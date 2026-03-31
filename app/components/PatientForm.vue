<script setup lang="ts">
import { useInputFormatting } from '../composables/useInputFormatting'
import { useToast } from '../composables/useToast'
import { GENDER_OPTIONS } from '#shared/utils/commonOptions'

const props = defineProps<{ initial?: Record<string, any>, submitLabel?: string }>()
const emit = defineEmits<{ submit: [data: Record<string, any>] }>()
const { add: addToast } = useToast()
const { formatBrazilPhoneInput, formatCepInput, formatCpfInput, isValidBrazilCpf, isBrazilCountry, normalizeText, isValidBirthDate, isValidBrazilCep, isValidBrazilPhone, isValidEmail } = useInputFormatting()

const f = reactive({
  name: '', rg: '', gender: '', cpf: '', birth_date: '', phone: '',
  email: '', send_email: true,
  zipcode: '', street: '', district: '', house_number: '',
  additional_info: '', country: '', state: '', city: '', medical_history: ''
})
if (props.initial) Object.assign(f, props.initial)

const { data: countries } = await useFetch<any[]>('https://servicodados.ibge.gov.br/api/v1/localidades/paises')
const states = ref<any[]>([])
const cities = ref<any[]>([])
const isBrazilPatient = computed(() => isBrazilCountry(f.country))
const isInternationalPatient = computed(() => {
  const country = normalizeText(f.country, { titleCase: true })
  return Boolean(country) && !isBrazilCountry(country)
})

watch(() => f.country, async (name) => {
  const country = normalizeText(name, { titleCase: true })
  const brazilCountry = isBrazilCountry(name)
  const internationalCountry = Boolean(country) && !brazilCountry

  if (brazilCountry) {
    states.value = await $fetch<any[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
    if (f.state) {
      cities.value = await $fetch<any[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${f.state}/municipios`)
    } else {
      f.city = ''
      cities.value = []
    }

    const formattedCpf = formatCpfInput(f.cpf)
    if (formattedCpf !== f.cpf) f.cpf = formattedCpf

    const formattedPhone = formatBrazilPhoneInput(f.phone)
    if (formattedPhone !== f.phone) f.phone = formattedPhone

    const formattedZipcode = formatCepInput(f.zipcode)
    if (formattedZipcode !== f.zipcode) f.zipcode = formattedZipcode
    return
  }

  states.value = []
  cities.value = []

  if (!internationalCountry) {
    const formattedCpf = formatCpfInput(f.cpf)
    if (formattedCpf !== f.cpf) f.cpf = formattedCpf

    const formattedPhone = formatBrazilPhoneInput(f.phone)
    if (formattedPhone !== f.phone) f.phone = formattedPhone

    const formattedZipcode = formatCepInput(f.zipcode)
    if (formattedZipcode !== f.zipcode) f.zipcode = formattedZipcode
  }
}, { immediate: true })

watch(() => f.state, async (uf) => {
  if (!isBrazilPatient.value) return
  f.city = ''
  cities.value = uf ? await $fetch<any[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`) : []
})

watch(() => f.phone, (value) => {
  if (isInternationalPatient.value) return
  const formatted = formatBrazilPhoneInput(value)
  if (formatted !== value) f.phone = formatted
}, { immediate: true })

watch(() => f.zipcode, (value) => {
  if (isInternationalPatient.value) return
  const formatted = formatCepInput(value)
  if (formatted !== value) f.zipcode = formatted
}, { immediate: true })

watch(() => f.cpf, (value) => {
  if (isInternationalPatient.value) return
  const formatted = formatCpfInput(value)
  if (formatted !== value) f.cpf = formatted
}, { immediate: true })

const submitForm = () => {
  const mustApplyBrazilRules = !isInternationalPatient.value
  const normalizedName = normalizeText(f.name, { titleCase: true })
  const normalizedEmail = normalizeText(f.email)

  if (!normalizedName) {
    addToast('Nome é obrigatório.', 'error')
    return
  }

  if (f.send_email && !normalizedEmail) {
    addToast('E-mail é obrigatório para receber notificações.', 'error')
    return
  }

  if (normalizedEmail && !isValidEmail(normalizedEmail)) {
    addToast('E-mail inválido. Informe um e-mail válido.', 'error')
    return
  }

  if (f.birth_date && !isValidBirthDate(f.birth_date)) {
    addToast('Data de nascimento inválida.', 'error')
    return
  }

  if (mustApplyBrazilRules) {
    if (!normalizeText(f.phone)) {
      addToast('Telefone é obrigatório para pacientes brasileiros.', 'error')
      return
    }

    if (!isValidBrazilPhone(f.phone)) {
      addToast('Telefone inválido. Use um telefone brasileiro válido.', 'error')
      return
    }
  }

  if (isBrazilPatient.value) {
    if (!normalizeText(f.zipcode)) {
      addToast('CEP é obrigatório para pacientes brasileiros.', 'error')
      return
    }

    if (!isValidBrazilCep(f.zipcode)) {
      addToast('CEP inválido. Use o formato 00000-000.', 'error')
      return
    }
  }

  if (mustApplyBrazilRules && f.cpf && !isValidBrazilCpf(f.cpf)) {
    addToast('CPF inválido. Verifique os dígitos informados.', 'error')
    return
  }

  const payload = {
    ...f,
    name: normalizedName,
    email: normalizedEmail,
    rg: normalizeText(f.rg),
    gender: normalizeText(f.gender, { titleCase: true }),
    cpf: mustApplyBrazilRules ? formatCpfInput(f.cpf) : normalizeText(f.cpf),
    birth_date: normalizeText(f.birth_date),
    phone: mustApplyBrazilRules ? formatBrazilPhoneInput(f.phone) : normalizeText(f.phone),
    zipcode: mustApplyBrazilRules ? formatCepInput(f.zipcode) : normalizeText(f.zipcode),
    street: normalizeText(f.street, { titleCase: true }),
    district: normalizeText(f.district, { titleCase: true }),
    house_number: normalizeText(f.house_number),
    additional_info: normalizeText(f.additional_info, { titleCase: true }),
    country: normalizeText(f.country, { titleCase: true }),
    state: isInternationalPatient.value
      ? normalizeText(f.state, { titleCase: true })
      : (normalizeText(f.state)?.toUpperCase() ?? ''),
    city: normalizeText(f.city, { titleCase: true }),
    medical_history: normalizeText(f.medical_history),
  }

  emit('submit', payload)
}
</script>

<template>
  <form @submit.prevent="submitForm">
    <div class="form-group"><label>Nome *</label><input v-model="f.name" placeholder="Nome completo" required /></div>
    <div class="form-row">
      <div class="form-group"><label>E-mail</label><input v-model="f.email" type="email" placeholder="paciente@email.com" /></div>
      <div class="form-group" style="display:flex;align-items:center;gap:0.5rem;margin-top:1.5rem"><input type="checkbox" id="pe" v-model="f.send_email" checked="false" /><label for="pe" style="margin:0">Receber e-mails</label></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>{{ isInternationalPatient ? 'CPF (documento nacional)' : 'CPF' }}</label><input v-model="f.cpf" :inputmode="isInternationalPatient ? 'text' : 'numeric'" :maxlength="isInternationalPatient ? 32 : 14" :placeholder="isInternationalPatient ? 'Documento nacional' : '000.000.000-00'" /></div>
      <div class="form-group"><label>RG</label><input v-model="f.rg" placeholder="RG" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Gênero</label><select v-model="f.gender"><option value="">Selecione</option><option v-for="gender in GENDER_OPTIONS" :key="gender" :value="gender">{{ gender }}</option></select></div>
      <div class="form-group"><label>Data de Nascimento</label><input v-model="f.birth_date" type="date" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Telefone{{ isInternationalPatient ? '' : ' *' }}</label><input v-model="f.phone" :required="!isInternationalPatient" inputmode="tel" :placeholder="isInternationalPatient ? 'Telefone local ou internacional' : 'Ex: +55 11 91234-5678'" /></div>
      <div class="form-group"><label>{{ isInternationalPatient ? 'Código Postal' : (isBrazilPatient ? 'CEP *' : 'CEP') }}</label><input v-model="f.zipcode" :required="isBrazilPatient" :inputmode="isInternationalPatient ? 'text' : 'numeric'" :placeholder="isInternationalPatient ? 'ZIP / Código postal' : '00000-000'" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Rua</label><input v-model="f.street" placeholder="Rua" /></div>
      <div class="form-group"><label>Número</label><input v-model="f.house_number" placeholder="Nº" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Bairro</label><input v-model="f.district" placeholder="Bairro" /></div>
      <div class="form-group"><label>Complemento</label><input v-model="f.additional_info" placeholder="Apto, Bloco..." /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>País</label><select v-model="f.country"><option value="">Selecione</option><option v-for="c in countries" :key="c.id['M49']" :value="c.nome">{{ c.nome }}</option></select></div>
      <div class="form-group"><label>Estado</label><select v-if="isBrazilPatient" v-model="f.state" :disabled="!states.length"><option value="">Selecione</option><option v-for="s in states" :key="s.id" :value="s.sigla">{{ s.nome }}</option></select><input v-else v-model="f.state" placeholder="Estado / Província / Região" /></div>
    </div>
    <div class="form-group"><label>Cidade</label><select v-if="isBrazilPatient" v-model="f.city" :disabled="!cities.length"><option value="">Selecione</option><option v-for="c in cities" :key="c.id" :value="c.nome">{{ c.nome }}</option></select><input v-else v-model="f.city" placeholder="Cidade" /></div>
    <div class="form-group"><label>Histórico Médico</label><textarea v-model="f.medical_history" placeholder="Observações clínicas..." rows="4"></textarea></div>
    <button type="submit">{{ submitLabel ?? 'Salvar' }}</button>
  </form>
</template>
