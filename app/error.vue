<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();
</script>

<template>
  <div class="auth-page">
    <div class="card auth-card">
      <img
        src="/logo.png"
        alt="Logo da AMMA"
        class="auth-logo"
        style="opacity: 0.5"
      />
      <div style="font-size: 2.5rem; margin-bottom: 0.5rem; opacity: 0.7">
        ⚠️
      </div>
      <div class="auth-brand-name">Erro {{ error.statusCode }}</div>
      <p class="text-muted" style="margin-bottom: 1.75rem">
        {{ error.message || "Algo deu errado." }}
      </p>
      <button class="btn-primary" @click="clearError({ redirect: '/' })">
        ← Voltar ao início
      </button>
    </div>
  </div>
</template>
