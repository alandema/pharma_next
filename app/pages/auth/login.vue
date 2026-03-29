<script setup lang="ts">
const email = ref('')
const password = ref('')
const { add: addToast } = useToast()

const { brand } = useAppConfig()

const handleSubmit = async () => {
  try {
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    addToast(res.message, 'success')
    await refreshNuxtData()
    await navigateTo('/')
  } catch (err: any) {
    addToast(err?.data?.statusMessage ?? err?.data?.message ?? 'Falha no login. Verifique suas credenciais.', 'error')
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
          <label>E-mail</label>
          <input v-model="email" type="email" placeholder="Digite seu e-mail" required />
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