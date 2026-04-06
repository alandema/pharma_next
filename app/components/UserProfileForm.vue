<script setup lang="ts">
import { GENDER_OPTIONS } from "#shared/utils/commonOptions";
import { AsYouType, parsePhoneNumberWithError } from "libphonenumber-js";
import { useInputFormatting } from "../composables/useInputFormatting";
import { useCurrentUser } from "../composables/useCurrentUser";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  prescriberId?: string;
  isAdmin?: boolean;
}>();

const apiEndpoint = computed(() =>
  props.prescriberId
    ? `/api/users/admin/${props.prescriberId}`
    : "/api/users/me",
);

const { add: addToast } = useToast();
const { formatCpfInput, isValidBrazilCpf } = useInputFormatting();
const { data: councils } = await useAsyncData("councils", () =>
  queryCollection("councils").first(),
);
const { currentUser, loadCurrentUser } = useCurrentUser();

await loadCurrentUser();
const { data: prescriberData, refresh } = await useFetch(apiEndpoint, {
  watch: [apiEndpoint],
});
const profile = ref<any>({ ...(prescriberData.value || {}) });
const password = ref("");

const isSelfProfile = computed(() => {
  if (!props.prescriberId) return true;
  const meId = currentUser.value?.id ?? currentUser.value?.userId;
  return Boolean(meId && meId === profile.value?.id);
});

const isAdminLikeMe = computed(() => {
  const role = currentUser.value?.role;
  return role === "admin" || role === "superadmin";
});

const canEditOwnIdentity = computed(
  () => isSelfProfile.value && isAdminLikeMe.value,
);
const canEditCpf = computed(
  () => Boolean(props.isAdmin) || canEditOwnIdentity.value,
);
const canEditPassword = computed(
  () => Boolean(props.isAdmin) || isSelfProfile.value,
);

const REQUIRED_PROFILE_FIELDS: Array<{ key: string; label: string }> = [
  { key: "full_name", label: "Nome completo" },
  { key: "gender", label: "Sexo" },
  { key: "birth_date", label: "Data de nascimento" },
  { key: "phone", label: "Telefone" },
  { key: "council", label: "Conselho" },
  { key: "council_number", label: "Número do conselho" },
  { key: "council_state", label: "UF do conselho" },
  { key: "zipcode", label: "CEP" },
  { key: "street", label: "Endereço" },
  { key: "address_number", label: "Número" },
  { key: "city", label: "Cidade" },
  { key: "state", label: "Estado" },
];

const hasRequiredValue = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
};

const getFirstMissingRequiredField = (payload: Record<string, unknown>) => {
  const fields = canEditCpf.value
    ? [{ key: "cpf", label: "CPF" }, ...REQUIRED_PROFILE_FIELDS]
    : REQUIRED_PROFILE_FIELDS;

  for (const field of fields) {
    if (!hasRequiredValue(payload[field.key])) {
      return field;
    }
  }

  return null;
};

const formattedPhone = computed({
  get() {
    if (!profile.value.phone) return "";
    try {
      const parsed = parsePhoneNumberWithError(profile.value.phone, "BR");
      if (parsed.isValid()) {
        return parsed.formatInternational();
      }
    } catch (e) {}

    const raw = String(profile.value.phone).trim();
    if (!raw) return "";

    const digits = raw.replace(/\D+/g, "");
    if (!digits) return "";

    const localDigits = digits.startsWith("55") ? digits.slice(2) : digits;
    return new AsYouType().input(`+55${localDigits}`);
  },
  set(newValue) {
    profile.value.phone = new AsYouType("BR").input(newValue);
  },
});

const { data: states } = await useFetch<any[]>(
  "https://servicodados.ibge.gov.br/api/v1/localidades/estados",
  {
    transform: (res) => res.sort((a, b) => a.nome.localeCompare(b.nome)),
    default: () => [],
  },
);

const { data: cities } = await useAsyncData(
  `cities-${props.prescriberId || "me"}`,
  async () => {
    if (!profile.value.state) return [];
    const res = await $fetch<any[]>(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${profile.value.state}/municipios`,
    );
    return res.sort((a, b) => a.nome.localeCompare(b.nome));
  },
  {
    watch: [() => profile.value.state],
    default: () => [],
  },
);

watch(
  () => profile.value?.cpf,
  (value) => {
    if (typeof value !== "string") return;
    const formatted = formatCpfInput(value);
    if (formatted !== value) {
      profile.value.cpf = formatted;
    }
  },
  { immediate: true },
);

const buildSubmitPayload = () => {
  const data = profile.value || {};

  const payload: Record<string, unknown> = {
    send_email: data.send_email,
    full_name: data.full_name,
    gender: data.gender,
    birth_date: data.birth_date,
    phone: data.phone,
    council: data.council,
    council_number: data.council_number,
    council_state: data.council_state,
    zipcode: data.zipcode,
    street: data.street,
    address_number: data.address_number,
    complement: data.complement,
    city: data.city,
    state: data.state,
  };

  if (canEditOwnIdentity.value) {
    payload.email = data.email;
    payload.username = data.username;
  }

  if (canEditCpf.value) {
    payload.cpf = formatCpfInput(data.cpf);
  }

  const normalizedPassword = password.value.trim();
  if (canEditPassword.value && normalizedPassword) {
    payload.password = normalizedPassword;
  }

  return payload;
};

const handleSubmit = async () => {
  try {
    const payload = buildSubmitPayload();

    const missingField = getFirstMissingRequiredField(payload);
    if (missingField) {
      addToast(`${missingField.label} é obrigatório.`, "error");
      return;
    }

    if (canEditCpf.value && !isValidBrazilCpf(payload.cpf)) {
      addToast("CPF inválido. Verifique os dígitos informados.", "error");
      return;
    }

    await $fetch(apiEndpoint.value, {
      method: "PUT",
      body: payload,
    });
    addToast("Perfil atualizado com sucesso!", "success");
    await refresh();
    profile.value = { ...(prescriberData.value || {}) };
    password.value = "";
    await navigateTo("/admin");
  } catch (error: any) {
    addToast(
      error?.data?.statusMessage ??
        error?.data?.message ??
        "Não foi possível atualizar o perfil. Verifique os dados e tente novamente.",
      "error",
    );
  }
};
</script>

<template>
  <div class="card" style="max-width: 800px; margin: 0 auto">
    <form @submit.prevent="handleSubmit" class="grid-form">
      <div class="section-title">Informações de Acesso</div>
      <div class="form-group">
        <label>E-mail</label>
        <input v-model="profile.email" :disabled="!canEditOwnIdentity" />
      </div>
      <div class="form-group">
        <label>Login do Prescritor</label>
        <input
          type="text"
          v-model="profile.username"
          :disabled="!canEditOwnIdentity"
        />
      </div>
      <div class="form-group">
        <label>Senha</label>
        <input
          type="password"
          v-model="password"
          :disabled="!canEditPassword"
          placeholder="Deixe em branco para não alterar"
        />
      </div>

      <div class="section-title">Informações Pessoais</div>
      <div class="form-group">
        <label>Nome Completo</label>
        <input v-model="profile.full_name" />
      </div>
      <div class="form-group">
        <label>CPF</label>
        <input
          v-model="profile.cpf"
          inputmode="numeric"
          maxlength="14"
          placeholder="000.000.000-00"
          :disabled="!canEditCpf"
        />
      </div>

      <div class="form-group">
        <label>Sexo</label>
        <select v-model="profile.gender">
          <option value="">Selecione</option>
          <option
            v-for="gender in GENDER_OPTIONS"
            :key="gender"
            :value="gender"
          >
            {{ gender }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>Data de nascimento</label>
        <input v-model="profile.birth_date" type="date" />
      </div>

      <div class="form-group">
        <label>Telefone</label>
        <input
          v-model="formattedPhone"
          inputmode="tel"
          placeholder="Ex: +55 11 91234-5678"
        />
      </div>

      <div class="section-title">Informações Profissionais</div>
      <div class="form-group">
        <label>Conselho</label>
        <select v-model="profile.council">
          <option value="">Selecione</option>
          <option
            v-for="council in councils?.councils"
            :key="council.id"
            :value="council.abbreviation"
          >
            {{ council.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>Número do Conselho</label>
        <input v-model="profile.council_number" />
      </div>
      <div class="form-group">
        <label>UF Conselho</label>
        <select v-model="profile.council_state">
          <option v-for="state in states" :key="state.id" :value="state.sigla">
            {{ state.sigla }}
          </option>
        </select>
      </div>

      <div class="section-title">Endereço Profissional</div>
      <div class="form-group">
        <label>CEP</label>
        <input
          v-model="profile.zipcode"
          inputmode="numeric"
          placeholder="00000-000"
        />
      </div>
      <div class="form-group">
        <label>Estado</label>
        <select v-model="profile.state">
          <option v-for="s in states" :key="s.id" :value="s.sigla">
            {{ s.nome }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>Cidade</label>
        <select v-model="profile.city" :disabled="!cities.length">
          <option v-for="c in cities" :key="c.id" :value="c.nome">
            {{ c.nome }}
          </option>
        </select>
      </div>
      <div class="form-group" style="grid-column: 1 / -1">
        <label>Endereço</label>
        <input v-model="profile.street" />
      </div>
      <div class="form-group">
        <label>Número</label>
        <input v-model="profile.address_number" inputmode="numeric" />
      </div>
      <div class="form-group">
        <label>Complemento</label>
        <input v-model="profile.complement" />
      </div>

      <div
        class="form-group"
        style="
          grid-column: 1 / -1;
          display: flex;
          gap: 0.5rem;
          align-items: center;
          margin-top: 1rem;
        "
      >
        <input type="checkbox" id="se_me" v-model="profile.send_email" />
        <label for="se_me" style="margin: 0"
          >Receber e-mails de cópia das prescrições</label
        >
      </div>

      <div class="form-group" style="grid-column: 1 / -1">
        <button type="submit">Salvar Perfil</button>
      </div>
    </form>
  </div>
</template>
