<script setup lang="ts">
type Formula = { id: string; name: string; information?: string };

const route = useRoute();
const toast = useToast();
const { data: formula, refresh } = await useFetch<Formula>(
  `/api/formulas/${route.params.id}`,
  {
    method: "GET",
  },
);

const information = ref(formula.value?.information ?? "");

const save = async () => {
  const payload = {
    information: String(information.value ?? ""),
  };

  try {
    await $fetch(`/api/formulas/${route.params.id}`, {
      method: "PUT",
      body: payload,
    });
    refresh();
    await navigateTo("/admin/formulas");
  } catch (error: any) {
    toast.add(
      error?.data?.statusMessage ??
        "Não foi possível salvar a fórmula. Tente novamente.",
      "error",
    );
  }
};

const deleteFormula = async (id: string) => {
  if (
    !confirm(
      "Tem certeza que deseja excluir esta fórmula? Esta ação não pode ser desfeita.",
    )
  )
    return;
  await $fetch(`/api/formulas/${id}`, { method: "DELETE" });
  await navigateTo("/admin/formulas");
};
</script>

<template>
  <div class="page-header">
    <h1>Editar Fórmula</h1>
    <button @click="navigateTo('/admin/formulas')">← Voltar</button>
  </div>
  <div class="card">
    <form @submit.prevent="save">
      <div class="form-group">
        <label>Nome</label>
        <div class="text-muted">{{ formula?.name }}</div>
      </div>
      <div class="form-group">
        <label>Informação</label>
        <textarea
          v-model="information"
          placeholder="Detalhes da fórmula"
          rows="5"
        >
        </textarea>
      </div>
      <button type="submit">Salvar Alterações</button>
      <button
        v-if="formula?.id"
        type="button"
        class="btn-secondary"
        @click="deleteFormula(formula.id)"
      >
        Excluir Fórmula
      </button>
    </form>
  </div>
</template>
