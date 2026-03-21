<template>
  <div class="app-shell">
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
    </div>

    <nav v-if="user" class="app-nav">
      <div class="nav-left">
        <div class="logo">
          <img src="/header.png" alt="amma" />
        </div>
        <span class="nav-home" @click="navigateTo(user.role === 'admin' ? '/admin' : '/')">Início</span>
      </div>
      <div class="nav-actions">
        <span class="text-muted" style="font-size:.8rem; cursor:pointer;" @click="navigateTo('/profile')">{{ user.username }}</span>
        <button class="btn-sm" @click="handleLogout">Sair</button>
      </div>
    </nav>

    <main :class="user ? 'app-main' : ''">
      <NuxtPage />
    </main>

    <footer v-if="user" class="app-footer">
      © {{ new Date().getFullYear() }} {{ brand.name }} — Todos os direitos reservados
    </footer>

    <AppToast />
  </div>
</template>

<script setup lang="ts">
interface User { userId: number; username: string; role: string }

const { brand } = useAppConfig()
useHead({ title: brand.name })

const { isLoading } = useLoadingIndicator()

const { data: user } = await useFetch<User>('/api/users/me', {
  key: useRoute().path,
  default: () => undefined,
  onResponseError: () => {}
})

const handleLogout = async () => {
  await $fetch('/api/auth/logout', { method: 'POST', body: {} })
  await refreshNuxtData()
  navigateTo('/auth/login')
}
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--c-border);
  border-top-color: var(--c-gold);
  border-right-color: var(--c-gold-light);
  border-radius: 50%;
  animation: spin 0.8s ease-in-out infinite;
  box-shadow: 0 0 15px rgba(184, 164, 78, 0.3);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>