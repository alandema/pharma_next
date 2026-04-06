<script setup lang="ts">
import { useInputFormatting } from "../../composables/useInputFormatting";

const toast = useToast();
const { isBrazilCountry, isValidBirthDate } = useInputFormatting();

const submit = async (data: Record<string, string>) => {
  if (data.birth_date && !isValidBirthDate(data.birth_date)) {
    toast.add("Data de nascimento inválida.", "error");
    return;
  }

  if (isBrazilCountry(data.country) && !data.zipcode) {
    toast.add("CEP é obrigatório para pacientes brasileiros.", "error");
    return;
  }

  try {
    await $fetch("/api/patients", { method: "POST", body: data });
    toast.add("Paciente registrado com sucesso!", "success");
    await navigateTo("/patients");
  } catch (error: any) {
    toast.add(
      error?.data?.statusMessage ??
        error?.data?.message ??
        "Não foi possível registrar o paciente. Tente novamente.",
      "error",
    );
  }
};
</script>

<template>
  <div class="page-header">
    <h1>Novo Paciente</h1>
    <button @click="navigateTo('/patients')">← Voltar</button>
  </div>
  <div class="card">
    <PatientForm submit-label="Salvar Paciente" @submit="submit" />
  </div>
</template>
