<script setup lang="ts">

const page = ref(1);

const { data: response } = await useFetch('/api/users/admin', {
  method: 'GET',
  query: { page, limit: 10 }
});

const users = computed(() => response.value?.data || []);
const metadata = computed(() => response.value?.metadata || { page: 1, totalPages: 1 });

const nextPage = () => {
  if (page.value < metadata.value.totalPages) {
    page.value++;
  }
};

const prevPage = () => {
  if (page.value > 1) {
    page.value--;
  }
};

</script>

<template>
  <div class="page-header">
    <h1>👤 Usuários</h1>
    <button class="btn-primary" @click="navigateTo('/admin/users/register')">+ Novo Usuário</button>
  </div>
  <div class="card">
    <template v-if="users.length">
      <table class="list-table">
        <thead>
          <tr><th>Nome</th><th>Privilégio</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" @click="navigateTo(`/admin/users/${user.id}`)">
            <td>{{ user.full_name }}</td>
            <td style="text-align:right"><span :class="['badge', user.role === 'admin' || user.role === 'superadmin' ? 'badge-admin' : 'badge-user']">{{ user.role }}</span></td>
            <td style="text-align:center"><span :class="['badge', user.is_active ? 'badge-active' : 'badge-inactive']">{{ user.is_active ? 'Ativo' : 'Inativo' }}</span></td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button class="btn-secondary" :disabled="page <= 1" @click="prevPage">Anterior</button>
        <span class="pagination-info">Página {{ metadata.page }} de {{ metadata.totalPages }}</span>
        <button class="btn-secondary" :disabled="page >= metadata.totalPages" @click="nextPage">Próxima</button>
      </div>
    </template>
    <div v-else class="empty">Nenhum usuário cadastrado.</div>
  </div>
</template>