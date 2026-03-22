<script setup lang="ts">
import { GENDER_OPTIONS } from '#shared/utils/commonOptions'
import { AsYouType, parsePhoneNumberWithError } from 'libphonenumber-js'
import { computed, ref } from 'vue'

const props = defineProps<{
  userId?: string
  isAdmin?: boolean
}>()

const apiEndpoint = computed(() => props.userId ? `/api/users/admin/${props.userId}` : '/api/users/me')

const { add: addToast } = useToast()
const { data: professionals } = await useAsyncData('professionals', () => queryCollection('professionals').first())

const { data: userData, refresh } = await useFetch(apiEndpoint.value)
const profile = ref<any>({ ...(userData.value || {}) })

const formattedPhone = computed({
  get() {
    if (!profile.value.phone) return ''
    try {
      const parsed = parsePhoneNumberWithError(profile.value.phone, 'BR')
      if (parsed.isValid()) {
        return parsed.formatNational()
      }
    } catch (e) {}
    
    return new AsYouType('BR').input(profile.value.phone)
  },
  set(newValue) {
    profile.value.phone = new AsYouType('BR').input(newValue)
  }
})

const { data: states } = await useFetch<any[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados', {
  transform: (res) => res.sort((a, b) => a.nome.localeCompare(b.nome)),
  default: () => []
})

const { data: cities } = await useAsyncData(`cities-${props.userId || 'me'}`, async () => {
  if (!profile.value.state) return []
  const res = await $fetch<any[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${profile.value.state}/municipios`)
  return res.sort((a, b) => a.nome.localeCompare(b.nome))
}, {
  watch: [() => profile.value.state],
  default: () => []
})

const selectedProf = computed(() => professionals.value?.professionals?.find((p: any) => p.name === profile.value.professional_type))

const handleSubmit = async () => {
  try {
    await $fetch(apiEndpoint.value, {
      method: 'PUT',
      body: { ...profile.value } 
    })
    addToast('Perfil atualizado com sucesso!', 'success')
    await refresh()
  } catch (error: any) {
    addToast(error.data?.message || 'Erro ao atualizar perfil', 'error')
  }
}
</script>

<template>
  <div class="card" style="max-width: 800px; margin: 0 auto;">
    <form @submit.prevent="handleSubmit" class="grid-form">
      <div class="section-title">Informações de Acesso</div>
      <div class="form-group"><label>E-mail</label><input v-model="profile.email" disabled /></div>
      <div class="form-group"><label>Usuário</label><input type="text" v-model="profile.username" disabled /></div>
      <div class="form-group"><label>Senha</label><input type="password" :disabled="!isAdmin"/></div>

      
      <div class="section-title">Informações Pessoais</div>
      <div class="form-group"><label>Nome Completo</label><input v-model="profile.full_name" /></div>
      <div class="form-group"><label>CPF</label><input v-model="profile.cpf" :disabled="!isAdmin" /></div>
      
      <div class="form-group"><label>Sexo</label>
        <select v-model="profile.gender"><option value="">Selecione</option><option v-for="gender in GENDER_OPTIONS" :key="gender" :value="gender">{{ gender }}</option></select>
      </div>
      <div class="form-group"><label>Data de nascimento</label><input v-model="profile.birth_date" type="date" /></div>
      
      <div class="form-group"><label>Telefone</label><input v-model="formattedPhone" inputmode="tel" placeholder="Ex: (11) 91234-5678" /></div>
      
      <div class="section-title">Informações Profissionais</div>
      <div class="form-group"><label>Tipo de Profissional</label><select v-model="profile.professional_type"><option v-for="prof in professionals?.professionals" :key="prof.name" :value="prof.name">{{ prof.name }}</option></select></div>
      <div class="form-group"><label>Conselho</label><select v-model="profile.council"><option >{{ selectedProf?.council }}</option></select></div>
      <div class="form-group"><label>Número do Conselho</label><input v-model="profile.council_number" /></div>
      <div class="form-group"><label>UF Conselho</label><select v-model="profile.council_state"><option v-for="state in states" :key="state.id" :value="state.sigla">{{ state.sigla }}</option></select></div>
      <div class="form-group"><label>Especialidades</label><select v-model="profile.specialties[0]"><option v-for="spec in selectedProf?.specialties" :key="spec" :value="spec">{{ spec }}</option></select></div>


      <div class="section-title">Endereço Profissional</div>
      <div class="form-group"><label>CEP</label><input v-model="profile.zipcode" inputmode="numeric" placeholder="00000-000" /></div>
      <div class="form-group"><label>Estado</label><select v-model="profile.state"><option v-for="s in states" :key="s.id" :value="s.sigla">{{ s.nome }}</option></select></div>
      <div class="form-group"><label>Cidade</label><select v-model="profile.city" :disabled="!cities.length"><option v-for="c in cities" :key="c.id" :value="c.nome">{{ c.nome }}</option></select></div>
      <div class="form-group" style="grid-column: 1 / -1"><label>Endereço</label><input v-model="profile.street" /></div>
      <div class="form-group"><label>Número</label><input v-model="profile.address_number" inputmode="numeric" /></div>
      <div class="form-group"><label>Complemento</label><input v-model="profile.complement" /></div>

      <div class="form-group" style="grid-column: 1 / -1; display:flex; gap:0.5rem; align-items:center; margin-top: 1rem;">
        <input type="checkbox" id="se_me" v-model="profile.send_email" />
        <label for="se_me" style="margin:0">Receber e-mails de cópia das prescrições</label>
      </div>

      <div class="form-group" style="grid-column: 1 / -1">
        <button type="submit">Salvar Perfil</button>
      </div>
    </form>
  </div>
</template>