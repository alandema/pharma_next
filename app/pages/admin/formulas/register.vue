<script setup lang="ts">
import { useInputFormatting } from '../../../composables/useInputFormatting'


const name = ref('')
const information = ref('')
const { normalizeText } = useInputFormatting()

const toast = useToast()

const submit = async () => {
  const normalizedName = normalizeText(name.value, { titleCase: true })

  if (!normalizedName) {
    toast.add('Nome da fórmula é obrigatório.', 'error')
    return
  }

  const payload = {
    name: normalizedName,
    information: information.value,
  }

  try {
    await $fetch('/api/formulas', {
      method: 'POST',
      body: payload
    })
    await navigateTo('/admin/formulas')
  } catch (error: any) {
    toast.add(error?.data?.statusMessage ?? error?.data?.message ?? 'Não foi possível salvar a fórmula. Tente novamente.', 'error')
  }
}

</script>

<template>
  <div class="page-header">
    <h1>Nova Fórmula</h1>
    <button @click="navigateTo('/admin/formulas')">← Voltar</button>
  </div>
  <div class="card">
    <form @submit.prevent="submit">
      <div class="form-group"><label>Nome *</label><input v-model="name" placeholder="Nome da fórmula" required /></div>
      <div class="form-group"><label>Informação</label><textarea v-model="information" placeholder="Detalhes da fórmula" rows="5"></textarea></div>
      <button type="submit">Salvar Fórmula</button>
    </form>
  </div>
</template>