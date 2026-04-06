<script setup lang="ts">
const page = ref(1);
const pageJumpInput = ref("1");

const { data: response } = await useFetch("/api/formulas", {
  method: "GET",
  query: { page, limit: 10 },
});

const formulas = computed(() => response.value?.data || []);
const metadata = computed(
  () => response.value?.metadata || { page: 1, totalPages: 1 },
);

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

const goToPage = () => {
  const parsedPage = Number.parseInt(pageJumpInput.value, 10);
  if (!Number.isFinite(parsedPage)) {
    pageJumpInput.value = String(metadata.value.page);
    return;
  }

  const totalPages = Math.max(1, metadata.value.totalPages);
  const targetPage = Math.min(totalPages, Math.max(1, parsedPage));

  page.value = targetPage;
  pageJumpInput.value = String(targetPage);
};

watch(
  () => metadata.value.page,
  (currentPage) => {
    pageJumpInput.value = String(currentPage);
  },
  { immediate: true },
);
</script>

<template>
  <div class="page-header">
    <h1>🧪 Fórmulas</h1>
    <button class="btn-primary" @click="navigateTo('/admin/formulas/register')">
      + Nova Fórmula
    </button>
  </div>
  <div class="card">
    <template v-if="formulas.length">
      <table class="list-table">
        <thead>
          <tr>
            <th>Fórmula</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="formula in formulas"
            :key="formula.id"
            @click="navigateTo(`/admin/formulas/${formula.id}`)"
          >
            <td>{{ formula.name }}</td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button class="btn-secondary" :disabled="page <= 1" @click="prevPage">
          Anterior
        </button>
        <span class="pagination-info"
          >Página {{ metadata.page }} de {{ metadata.totalPages }}</span
        >
        <div class="pagination-jump">
          <label for="admin-formulas-page-jump">Ir para</label>
          <input
            id="admin-formulas-page-jump"
            v-model="pageJumpInput"
            type="number"
            inputmode="numeric"
            min="1"
            :max="Math.max(1, metadata.totalPages)"
            :disabled="metadata.totalPages <= 1"
            @keyup.enter.prevent="goToPage"
          />
        </div>
        <button
          class="btn-secondary"
          :disabled="page >= metadata.totalPages"
          @click="nextPage"
        >
          Próxima
        </button>
      </div>
    </template>
    <div v-else class="empty">Nenhuma fórmula cadastrada.</div>
  </div>
</template>
