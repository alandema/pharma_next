<script setup lang="ts">

const page = ref(1);

const { data: response } = await useFetch('/api/formulas', {
  method: 'GET',
  query: { page, limit: 10 }
});

const formulas = computed(() => response.value?.data || []);
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
    <h1>🧪 Fórmulas</h1>
    <button class="btn-primary" @click="navigateTo('/admin/formulas/register')">+ Nova Fórmula</button>
  </div>
  <div class="card">
    <template v-if="formulas.length">
      <table class="list-table">
        <thead>
          <tr><th>Fórmula</th></tr>
        </thead>
        <tbody>
          <tr v-for="formula in formulas" :key="formula.id" @click="navigateTo(`/admin/formulas/${formula.id}`)">
            <td>{{ formula.name }}</td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button class="btn-secondary" :disabled="page <= 1" @click="prevPage">Anterior</button>
        <span class="pagination-info">Página {{ metadata.page }} de {{ metadata.totalPages }}</span>
        <button class="btn-secondary" :disabled="page >= metadata.totalPages" @click="nextPage">Próxima</button>
      </div>
    </template>
    <div v-else class="empty">Nenhuma fórmula cadastrada.</div>
  </div>
</template>