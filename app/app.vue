<template>
  <div class="app-shell">
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
    </div>

    <nav v-if="prescriber" class="app-nav">
      <div class="nav-left">
        <div class="logo">
          <img src="/header.png" alt="Logo da AMMA" />
        </div>
        <span
          class="nav-home"
          @click="navigateTo(isAdminRole(prescriber?.role) ? '/admin' : '/')"
          >Início</span
        >
      </div>
      <div class="nav-actions">
        <span
          class="text-muted"
          style="font-size: 0.8rem; cursor: pointer"
          @click="navigateTo('/profile')"
          >{{ prescriber.full_name || prescriber.email }}</span
        >
        <button class="btn-sm" @click="handleLogout">Sair</button>
      </div>
    </nav>

    <main :class="prescriber ? 'app-main' : ''">
      <NuxtPage />
    </main>

    <footer v-if="prescriber" class="app-footer">
      © {{ new Date().getFullYear() }} {{ brand.name }} — Todos os direitos
      reservados
    </footer>

    <AppToast />
  </div>
</template>

<script setup lang="ts">
import { useCurrentUser } from "./composables/useCurrentUser";

interface Prescriber {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

const isAdminRole = (role?: string) =>
  role === "admin" || role === "superadmin";

const { brand } = useAppConfig();
useHead({ title: brand.name });

const { isLoading } = useLoadingIndicator();
const { currentUser, loadCurrentUser, clearCurrentUser } = useCurrentUser();

await loadCurrentUser();

const prescriber = computed<Prescriber | null>(() => {
  const user = currentUser.value;
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  };
});

const handleLogout = async () => {
  await $fetch("/api/auth/logout", { method: "POST", body: {} });
  clearCurrentUser();
  await navigateTo("/auth/login");
};
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
  to {
    transform: rotate(360deg);
  }
}
</style>
