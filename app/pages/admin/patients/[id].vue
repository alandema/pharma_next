<script setup lang="ts">


type Patient = {
  id: string;
  name: string;
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
}

const route = useRoute()
const { data: patient, refresh } = await useFetch<Patient>(`/api/patients/${route.params.id}`, {
  method: 'GET'
})

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
  await navigateTo('/admin/patients')
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
</template>