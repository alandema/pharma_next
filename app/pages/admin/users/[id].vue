<script setup lang="ts">
import { useCurrentUser } from "../../../composables/useCurrentUser";

type Prescriber = {
  id: string;
  full_name?: string;
  email?: string;
  is_active?: boolean;
};

const route = useRoute();
const { currentUser } = useCurrentUser();

const prescriberId = computed(() => {
  const rawId = route.params.id;
  if (Array.isArray(rawId)) return rawId[0] ?? "";
  return typeof rawId === "string" ? rawId : "";
});

if (!prescriberId.value) {
  throw createError({
    statusCode: 400,
    statusMessage: "ID de prescritor inválido.",
  });
}

const { data: prescriber, refresh } = await useFetch<Prescriber>(
  `/api/users/admin/${prescriberId.value}`,
);

async function toggleActive() {
  await $fetch(`/api/users/admin/${prescriberId.value}`, {
    method: "PUT",
    body: {},
  });
  await refresh();
}

async function deletePrescriber() {
  const prescriberName =
    prescriber.value?.full_name || prescriber.value?.email || "este prescritor";
  if (!confirm(`Excluir prescritor "${prescriberName}"?`)) return;
  await $fetch(`/api/users/admin/${prescriberId.value}`, { method: "DELETE" });
  await navigateTo("/admin/users");
}
</script>

<template>
  <div class="page-header">
    <h1>Editar Prescritor</h1>
    <button @click="navigateTo('/admin/users')">← Voltar</button>
  </div>

  <div v-if="prescriber">
    <div style="max-width: 800px; margin: 0 auto">
      <div
        v-if="currentUser?.id !== prescriber.id"
        class="btn-group"
        style="margin-bottom: 1rem"
      >
        <button @click="toggleActive">
          {{ prescriber.is_active ? "Desativar" : "Ativar" }}
        </button>
        <button class="btn-danger" @click="deletePrescriber">Excluir</button>
      </div>
    </div>

    <PrescriberProfileForm :prescriberId="prescriberId" :isAdmin="true" />
  </div>
</template>
