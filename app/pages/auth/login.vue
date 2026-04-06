<script setup lang="ts">
const email = ref("");
const password = ref("");
const { add: addToast } = useToast();
const { isValidEmail } = useInputFormatting();
const { loadCurrentUser } = useCurrentUser();

const isAdminRole = (role?: string) =>
  role === "admin" || role === "superadmin";

const { brand } = useAppConfig();

const handleSubmit = async () => {
  const normalizedEmail = email.value.trim();
  const normalizedPassword = password.value.trim();

  if (!normalizedEmail || !normalizedPassword) {
    addToast("E-mail e senha são obrigatórios.", "error");
    return;
  }

  if (!isValidEmail(normalizedEmail)) {
    addToast("E-mail inválido. Informe um e-mail válido.", "error");
    return;
  }

  try {
    const res = await $fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      body: { email: normalizedEmail, password: normalizedPassword },
    });
    addToast(res.message, "success");

    const user = await loadCurrentUser({ force: true });
    if (!user) {
      addToast(
        "Login realizado, mas não foi possível carregar sua sessão.",
        "error",
      );
      return;
    }

    await navigateTo(isAdminRole(user.role) ? "/admin" : "/");
  } catch (err: any) {
    addToast(
      err?.data?.statusMessage ??
        err?.data?.message ??
        "Falha no login. Verifique suas credenciais.",
      "error",
    );
  }
};
</script>

<template>
  <div class="auth-page">
    <div class="card auth-card">
      <img src="/logo.png" alt="Logo da AMMA" class="auth-logo" />
      <p class="text-muted auth-sub">{{ brand.subtitle }}</p>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>E-mail</label>
          <input
            v-model="email"
            type="email"
            placeholder="Digite seu e-mail"
            required
          />
        </div>
        <div class="form-group">
          <label>Senha</label>
          <input
            v-model="password"
            type="password"
            placeholder="Digite sua senha"
            required
          />
        </div>
        <button type="submit">Entrar</button>
      </form>
    </div>
  </div>
</template>
