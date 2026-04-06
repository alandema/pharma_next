<template>
  <div
    style="
      position: fixed;
      bottom: 1.25rem;
      right: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      z-index: 9999;
    "
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :style="{
        padding: '.75rem 1.25rem',
        borderRadius: '12px',
        color: '#fff',
        fontWeight: '500',
        fontSize: '.9rem',
        background:
          toast.type === 'error'
            ? '#dc2626'
            : toast.type === 'warning'
              ? '#d97706'
              : '#16a34a',
        boxShadow: '0 4px 16px rgba(0,0,0,.2)',
        maxWidth: '340px',
        backdropFilter: 'blur(8px)',
      }"
    >
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
const { toasts } = useToast();
</script>
