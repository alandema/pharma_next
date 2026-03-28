<script setup lang="ts">
const username = ref('')
const password = ref('')
const { add: addToast } = useToast()

const { brand } = useAppConfig()

const handleSubmit = async () => {
  try {
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username: username.value, password: password.value },
    })
    addToast(res.message, 'success')
    await refreshNuxtData()
    await navigateTo('/')
  } catch (err: any) {
    addToast(err.data?.message, 'error')
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="card auth-card">
      <img src="/logo.png" alt="Logo da AMMA" class="auth-logo" />
      <p class="text-muted auth-sub">{{ brand.subtitle }}</p>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Usuário</label>
          <input v-model="username" type="text" placeholder="Digite seu usuário" required />
        </div>
        <div class="form-group">
          <label>Senha</label>
          <input v-model="password" type="password" placeholder="Digite sua senha" required />
        </div>
        <button type="submit">Entrar</button>
      </form>
    </div>
  </div>
</template>