<script setup lang="ts">

type Patient = {
  id: string;
  name: string;
  registered_by: string;
  registered_by_username?: string | null;
  rg?: string;
  gender?: string;
  cpf?: string;
  birth_date?: string;
  phone?: string;
  zipcode?: string;
  street?: string;
  district?: string;
  house_number?: string;
  additional_info?: string;
  country?: string;
  state?: string;
  city?: string;
  medical_history?: string;
  prescriptions: Prescription[];
}

type Prescription = {
  id: string;
  patient_id: string;
  date_prescribed: string;
  json_form_info: string;
  created_at: string;
}

type Doctor = { id: string; username: string; role: string }

const route = useRoute()
const { data: patient, refresh } = await useFetch<Patient>(`/api/patients/${route.params.id}`, { method: 'GET' })
const { data: me } = await useFetch('/api/users/me')
const isAdmin = computed(() => (me.value as any)?.role === 'admin')
const canDelete = computed(() => isAdmin.value || (me.value as any)?.userId === patient.value?.registered_by)

const { data: allUsers } = await useFetch<Doctor[]>('/api/users/admin', { method: 'GET' })
const doctors = computed(() => allUsers.value?.filter(u => u.role === 'doctor') ?? [])
const selectedDoctorId = ref('')
const transferError = ref('')
const transferSuccess = ref('')
const transferPatient = async () => {
  transferError.value = ''
  transferSuccess.value = ''
  if (!selectedDoctorId.value) { transferError.value = 'Please select a doctor.'; return }
  try {
    const result = await $fetch(`/api/patients/${route.params.id}/transfer`, {
      method: 'POST',
      body: { doctor_id: selectedDoctorId.value },
    })
    await refresh()
    transferSuccess.value = `Patient successfully transferred to ${result.transferred_to}.`
    selectedDoctorId.value = ''
  } catch (err: any) {
    transferError.value = err?.data?.statusMessage ?? 'Transfer failed.'
  }
}

const deletePatient = async () => {
  if (!confirm('Delete this patient?')) return
  await $fetch(`/api/patients/${route.params.id}`, { method: 'DELETE' })
  await navigateTo('/patients')
}

const name = ref(patient.value?.name || '')
const rg = ref(patient.value?.rg || '')
const gender = ref(patient.value?.gender || '')
const cpf = ref(patient.value?.cpf || '')
const birth_date = ref(patient.value?.birth_date || '')
const phone = ref(patient.value?.phone || '')
const zipcode = ref(patient.value?.zipcode || '')
const street = ref(patient.value?.street || '')
const district = ref(patient.value?.district || '')
const house_number = ref(patient.value?.house_number || '')
const additional_info = ref(patient.value?.additional_info || '')
const country = ref(patient.value?.country || '')
const state = ref(patient.value?.state || '')
const city = ref(patient.value?.city || '')
const medical_history = ref(patient.value?.medical_history || '')

const save = async () => {
  await $fetch(`/api/patients/${route.params.id}`, {
    method: 'PUT',
    body: {
      name: name.value,
      rg: rg.value,
      gender: gender.value,
      cpf: cpf.value,
      birth_date: birth_date.value,
      phone: phone.value,
      zipcode: zipcode.value,
      street: street.value,
      district: district.value,
      house_number: house_number.value,
      additional_info: additional_info.value,
      country: country.value,
      state: state.value,
      city: city.value,
      medical_history: medical_history.value,
    }
  })
  refresh()
  await navigateTo('/patients')
}
</script>

<template>
  <h1>Patient Details</h1>
  <form @submit.prevent="save">
    <input v-model="name" placeholder="Name" required />
    <input v-model="rg" placeholder="RG" />
    <input v-model="gender" placeholder="Gender" />
    <input v-model="cpf" placeholder="CPF" />
    <input v-model="birth_date" placeholder="Birth Date" />
    <input v-model="phone" placeholder="Phone" />
    <input v-model="zipcode" placeholder="Zipcode" />
    <input v-model="street" placeholder="Street" />
    <input v-model="district" placeholder="District" />
    <input v-model="house_number" placeholder="House Number" />
    <input v-model="additional_info" placeholder="Additional Info" />
    <input v-model="country" placeholder="Country" />
    <input v-model="state" placeholder="State" />
    <input v-model="city" placeholder="City" />
    <textarea v-model="medical_history" placeholder="Medical History"></textarea>
    <button type="submit">Save</button>
  </form>
  <h2>Prescriptions</h2>
  <ul v-if="patient?.prescriptions?.length">
    <li v-for="prescription in patient.prescriptions" :key="prescription.id">
      <strong>{{ prescription.date_prescribed }}</strong>: {{ prescription.json_form_info }}
    </li>
  </ul>
  <p v-else>No prescriptions found.</p>
  <template v-if="isAdmin">
    <hr />
    <h2>Transfer Patient</h2>
    <p>Current doctor: <strong>{{ patient?.registered_by_username ?? patient?.registered_by }}</strong></p>
    <select v-model="selectedDoctorId">
      <option value="" disabled>Select a doctor</option>
      <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id" :disabled="doctor.id === patient?.registered_by">
        {{ doctor.username }}{{ doctor.id === patient?.registered_by ? ' (current)' : '' }}
      </option>
    </select>
    <button type="button" @click="transferPatient" :disabled="!selectedDoctorId">Transfer</button>
    <p v-if="transferSuccess" style="color: green;">{{ transferSuccess }}</p>
    <p v-if="transferError" style="color: red;">{{ transferError }}</p>
  </template>
  <button @click="navigateTo('/patients')">Back to Patients</button>
  <button v-if="canDelete" @click="deletePatient" style="color:red">Delete Patient</button>
</template>