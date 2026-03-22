<script setup lang="ts">
import { useInputFormatting } from '../../../composables/useInputFormatting'
import { GENDER_OPTIONS } from '#shared/utils/commonOptions'

const toast = useToast()
const route = useRoute()
const { data: user, refresh } = await useFetch<any>(`/api/users/admin/${route.params.id}`)
const { data: me } = await useFetch<any>('/api/users/me')
const { formatBrazilPhoneInput, formatCepInput, isValidBirthDate, normalizeText } = useInputFormatting()
const { data: profs } = await useAsyncData('profs', () => queryCollection('professionals').first())

const states = ref<any[]>([])
const cities = ref<any[]>([])
const newPassword = ref('')

const f = ref({ ...user.value })

const selectedProf = computed(() => profs.value?.professionals?.find((p: any) => p.name === f.value.professional_type))
const selectedSpecialty = computed({
  get: () => f.value.specialties?.[0] ?? '',
  set: (value: string) => {
    f.value.specialties = value ? [value] : []
  }
})

onMounted(async () => { states.value = await $fetch<any[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados') })
watch(() => f.value.state, async (uf) => { cities.value = uf ? await $fetch<any[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`) : [] }, { immediate: true })
watch(() => f.value.professional_type, () => {
  if (!selectedProf.value) {
    f.value.council = ''
    f.value.specialties = []
    return
  }
  f.value.council = selectedProf.value.council
  f.value.specialties = []
})

watch(() => f.value.phone, (value) => {
  const formatted = formatBrazilPhoneInput(value)
  if (formatted !== value) f.value.phone = formatted
}, { immediate: true })

watch(() => f.value.zipcode, (value) => {
  const formatted = formatCepInput(value)
  if (formatted !== value) f.value.zipcode = formatted
}, { immediate: true })

const normalizeForm = () => ({
  send_email: f.value.send_email,
  full_name: normalizeText(f.value.full_name, { titleCase: true }),
  cpf: normalizeText(f.value.cpf),
  gender: normalizeText(f.value.gender, { titleCase: true }),
  birth_date: normalizeText(f.value.birth_date),
  phone: formatBrazilPhoneInput(f.value.phone),
  professional_type: normalizeText(f.value.professional_type, { titleCase: true }),
  council: normalizeText(f.value.council),
  council_number: normalizeText(f.value.council_number),
  council_state: normalizeText(f.value.council_state).toUpperCase(),
  zipcode: formatCepInput(f.value.zipcode),
  street: normalizeText(f.value.street, { titleCase: true }),
  address_number: normalizeText(f.value.address_number),
  complement: normalizeText(f.value.complement, { titleCase: true }),
  city: normalizeText(f.value.city, { titleCase: true }),
  state: normalizeText(f.value.state).toUpperCase(),
  ...(newPassword.value.trim() ? { password: newPassword.value.trim() } : {}),
})

async function toggleActive() { await $fetch(`/api/users/admin/${route.params.id}`, { method: 'PATCH', body: {} }); await refresh() }
async function deleteUser() {
  if (!confirm(`Excluir usuário "${user.value?.username}"?`)) return
  await $fetch(`/api/users/admin/${route.params.id}`, { method: 'DELETE' })
  navigateTo('/admin/users')
}
async function saveSettings() {
  const payload = normalizeForm()

  if (!payload.zipcode) {
    toast.add('CEP é obrigatório para usuários/profissionais.', 'error')
    return
  }

  if (payload.birth_date && !isValidBirthDate(payload.birth_date)) {
    toast.add('Data de nascimento inválida.', 'error')
    return
  }

  try {
    await $fetch(`/api/users/admin/${route.params.id}`, { method: 'PATCH', body: payload })
    newPassword.value = ''
    toast.add('Usuário atualizado', 'success')
    await refresh()
  } catch (error: any) {
    toast.add(error?.data?.message ?? 'Erro ao atualizar usuário', 'error')
  }
}
</script>

<template>
  <div class="page-header">
    <h1>Editar Usuário: {{ user?.username }}</h1>
    <button @click="navigateTo('/admin/users')">← Voltar</button>
  </div>
  <div v-if="user" class="card">
    <div v-if="me?.userId !== user.id" class="btn-group" style="margin-bottom:1rem">
      <button @click="toggleActive">{{ user.is_active ? 'Desativar' : 'Ativar' }}</button>
      <button class="btn-danger" @click="deleteUser">Excluir</button>
    </div>
    <form @submit.prevent="saveSettings" class="grid-form">
      <div class="section-title">Informações de Acesso</div>
      <div class="form-group"><label>Username</label><input v-model="f.username" disabled /></div>
      <div class="form-group"><label>Email</label><input v-model="f.email" type="email" disabled /></div>
      <div class="form-group"><label>Nova Senha (opcional)</label><input v-model="newPassword" type="password" autocomplete="new-password" placeholder="Min. 8 caracteres com letras e números" /></div>
      <div class="form-group" style="display:flex;align-items:flex-end;padding-bottom:0.5rem"><label style="display:flex;align-items:center;gap:0.5rem;margin:0"><input type="checkbox" v-model="f.send_email" /> Receber E-mails</label></div>
      
      <div class="section-title">Informações Pessoais</div>
      <div class="form-group"><label>Nome Completo</label><input v-model="f.full_name" /></div>
      <div class="form-group"><label>CPF</label><input v-model="f.cpf" /></div>
      <div class="form-group"><label>Gênero</label>
        <select v-model="f.gender"><option value="">Selecione</option><option v-for="gender in GENDER_OPTIONS" :key="gender" :value="gender">{{ gender }}</option></select>
      </div>
      <div class="form-group"><label>Nascimento</label><input v-model="f.birth_date" type="date" /></div>
      <div class="form-group"><label>Telefone</label><input v-model="f.phone" inputmode="numeric" placeholder="+55 (00) 00000-0000" /></div>

      <div class="section-title">Informações Profissionais</div>
      <div class="form-group"><label>Tipo Profissional</label>
        <select v-model="f.professional_type">
          <option v-for="p in profs?.professionals" :key="p.id" :value="p.name">{{ p.name }}</option>
        </select>
      </div>
      <div class="form-group"><label>Conselho</label><input v-model="f.council" disabled /></div>
      <div class="form-group"><label>Número do Conselho</label><input v-model="f.council_number" /></div>
      <div class="form-group"><label>UF Conselho</label>
        <select v-model="f.council_state"><option v-for="s in states" :key="s.id" :value="s.sigla">{{ s.sigla }}</option></select>
      </div>

      <div class="form-group" style="grid-column: 1 / -1" v-if="selectedProf">
        <label>Especialidades</label>
        <select v-model="selectedSpecialty">
          <option value="" disabled>Selecione uma especialidade</option>
          <option v-for="spec in selectedProf.specialties" :key="spec" :value="spec">{{ spec }}</option>
        </select>
      </div>

      <div class="section-title">Endereço Profissional</div>
      <div class="form-group"><label>CEP</label><input v-model="f.zipcode" inputmode="numeric" placeholder="00000-000" /></div>
      <div class="form-group"><label>Estado</label><select v-model="f.state"><option v-for="s in states" :key="s.id" :value="s.sigla">{{ s.nome }}</option></select></div>
      <div class="form-group"><label>Cidade</label><select v-model="f.city"><option v-for="c in cities" :key="c.id" :value="c.nome">{{ c.nome }}</option></select></div>
      <div class="form-group" style="grid-column: 1 / -1"><label>Endereço</label><input v-model="f.street" /></div>
      <div class="form-group"><label>Número</label><input v-model="f.address_number" /></div>
      <div class="form-group"><label>Complemento</label><input v-model="f.complement" /></div>

      <div class="form-group" style="grid-column: 1 / -1; margin-top: 1rem;"><button type="submit">Salvar Alterações</button></div>
    </form>
  </div>
</template>
<style scoped>
.grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.section-title { grid-column: 1 / -1; margin-top: 1rem; margin-bottom: 0.5rem; font-weight: 600; font-size: 1.1rem; border-bottom: 1px solid #eee; padding-bottom: 0.25rem; color: #444; }
.card { padding: 1.5rem; }
</style>