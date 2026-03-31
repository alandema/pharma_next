<script setup lang="ts">
import { useInputFormatting } from '../../../composables/useInputFormatting'
import { GENDER_OPTIONS } from '#shared/utils/commonOptions'

const f = ref({
  password: '', email: '',
  send_email: true,
  full_name: '', cpf: '', gender: '', birth_date: '', phone: '',
  council: '', council_number: '', council_state: '',
  zipcode: '', street: '', address_number: '', complement: '', city: '', state: ''
})
const { add: addToast } = useToast()
const { formatBrazilPhoneInput, formatCepInput, formatCpfInput, isValidBrazilCpf, isValidBirthDate, normalizeText, isValidBrazilCep, isValidBrazilPhone, isValidEmail, validatePasswordPolicy } = useInputFormatting()

const { data: councils } = await useAsyncData('councils', () => queryCollection('councils').first())

const states = ref<any[]>([])
const cities = ref<any[]>([])
const sortByName = <T extends { nome: string }>(items: T[]) => [...items].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

onMounted(async () => {
  states.value = sortByName(await $fetch<any[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados'))
})

watch(() => f.value.state, async (uf) => {
  f.value.city = ''
  cities.value = uf ? sortByName(await $fetch<any[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)) : []
})

watch(() => f.value.phone, (value) => {
  const formatted = formatBrazilPhoneInput(value)
  if (formatted !== value) f.value.phone = formatted
})

watch(() => f.value.zipcode, (value) => {
  const formatted = formatCepInput(value)
  if (formatted !== value) f.value.zipcode = formatted
})

watch(() => f.value.cpf, (value) => {
  const formatted = formatCpfInput(value)
  if (formatted !== value) f.value.cpf = formatted
})

const normalizeForm = () => ({
  ...f.value,
  email: normalizeText(f.value.email),
  full_name: normalizeText(f.value.full_name, { titleCase: true }),
  cpf: formatCpfInput(f.value.cpf),
  gender: normalizeText(f.value.gender, { titleCase: true }),
  birth_date: normalizeText(f.value.birth_date),
  phone: formatBrazilPhoneInput(f.value.phone),
  council: normalizeText(f.value.council),
  council_number: normalizeText(f.value.council_number),
  council_state: normalizeText(f.value.council_state).toUpperCase(),
  zipcode: formatCepInput(f.value.zipcode),
  street: normalizeText(f.value.street, { titleCase: true }),
  address_number: normalizeText(f.value.address_number),
  complement: normalizeText(f.value.complement, { titleCase: true }),
  city: normalizeText(f.value.city, { titleCase: true }),
  state: normalizeText(f.value.state).toUpperCase(),
})

const submit = async () => {
  const payload = normalizeForm()

  const passwordError = validatePasswordPolicy(payload.password)
  if (passwordError) {
    addToast(passwordError, 'error')
    return
  }

  if (!payload.email || !isValidEmail(payload.email)) {
    addToast('E-mail inválido. Informe um e-mail válido.', 'error')
    return
  }

  if (!payload.zipcode) {
    addToast('CEP é obrigatório para prescritores/profissionais.', 'error')
    return
  }

  if (!isValidBrazilCep(payload.zipcode)) {
    addToast('CEP inválido. Use o formato 00000-000.', 'error')
    return
  }

  if (payload.birth_date && !isValidBirthDate(payload.birth_date)) {
    addToast('Data de nascimento inválida.', 'error')
    return
  }

  if (!isValidBrazilCpf(payload.cpf)) {
    addToast('CPF inválido. Verifique os dígitos informados.', 'error')
    return
  }

  if (!payload.phone || !isValidBrazilPhone(payload.phone)) {
    addToast('Telefone inválido. Use um número brasileiro válido.', 'error')
    return
  }

  try {
    await $fetch('/api/users/admin', { method: 'POST', body: payload })
    addToast('Prescritor criado como inativo. Um e-mail de ativação foi enviado.', 'success')
    await navigateTo('/admin/users')
  } catch (error: any) {
    addToast(error?.data?.statusMessage ?? error?.data?.message ?? 'Não foi possível criar o prescritor. Verifique os dados e tente novamente.', 'error')
  }
}
</script>

<template>
  <div class="page-header">
    <h1>Novo Prescritor</h1>
    <button @click="navigateTo('/admin/users')">← Voltar</button>
  </div>
  <div class="card">
    <form @submit.prevent="submit" class="grid-form">
      <div class="section-title">Informações de Acesso</div>
      <div class="form-group"><label>Senha *</label><input v-model="f.password" type="password" required /></div>
      <div class="form-group text-muted" style="align-self:end;">A senha deve ter 8-25 caracteres com letras e números.</div>
      <div class="form-group"><label>Email *</label><input v-model="f.email" type="email" required /></div>
      <div class="form-group" style="display:flex;align-items:center;gap:0.5rem;margin-top:1.5rem"><input type="checkbox" id="se_admin_register" v-model="f.send_email" /><label for="se_admin_register" style="margin:0">Receber e-mails de cópia das prescrições</label></div>
      
      <div class="section-title">Informações Pessoais</div>
      <div class="form-group"><label>Nome Completo *</label><input v-model="f.full_name" required /></div>
      <div class="form-group"><label>CPF *</label><input v-model="f.cpf" inputmode="numeric" maxlength="14" placeholder="000.000.000-00" required /></div>
      <div class="form-group"><label>Gênero *</label>
        <select v-model="f.gender" required><option value="" disabled>Selecione</option><option v-for="gender in GENDER_OPTIONS" :key="gender" :value="gender">{{ gender }}</option></select>
      </div>
      <div class="form-group"><label>Nascimento *</label><input v-model="f.birth_date" type="date" required /></div>
      <div class="form-group"><label>Telefone *</label><input v-model="f.phone" inputmode="tel" placeholder="Ex: +55 11 91234-5678" required /></div>

      <div class="section-title">Informações Profissionais</div>
      <div class="form-group"><label>Conselho *</label>
        <select v-model="f.council" required>
          <option value="" disabled>Selecione</option>
          <option v-for="council in councils?.councils" :key="council.id" :value="council.abbreviation">{{ council.name }}</option>
        </select>
      </div>
      <div class="form-group"><label>Número do Conselho *</label><input v-model="f.council_number" required /></div>
      <div class="form-group"><label>UF Conselho *</label>
        <select v-model="f.council_state" required>
          <option v-for="s in states" :key="s.id" :value="s.sigla">{{ s.sigla }}</option>
        </select>
      </div>

      <div class="section-title">Endereço Profissional</div>
      <div class="form-group"><label>CEP *</label><input v-model="f.zipcode" inputmode="numeric" placeholder="00000-000" required /></div>
      <div class="form-group"><label>Estado *</label>
        <select v-model="f.state" required>
          <option v-for="s in states" :key="s.id" :value="s.sigla">{{ s.nome }}</option>
        </select>
      </div>
      <div class="form-group"><label>Cidade *</label>
        <select v-model="f.city" :disabled="!cities.length" required>
          <option v-for="c in cities" :key="c.id" :value="c.nome">{{ c.nome }}</option>
        </select>
      </div>
      <div class="form-group" style="grid-column: 1 / -1"><label>Endereço *</label><input v-model="f.street" required /></div>
      <div class="form-group"><label>Número *</label><input v-model="f.address_number" required /></div>
      <div class="form-group"><label>Complemento</label><input v-model="f.complement" /></div>

      <div class="form-group" style="grid-column: 1 / -1">
        <button type="submit">Criar Prescritor</button>
      </div>
    </form>
  </div>
</template>
<style scoped>
.grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.section-title { grid-column: 1 / -1; margin-top: 1.5rem; margin-bottom: 0.25rem; font-weight: 600; font-size: 1.1rem; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem; color: #333; }
.card { padding: 1.5rem; }
</style>