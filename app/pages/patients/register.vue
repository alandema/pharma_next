<script setup lang="ts">

const name = ref('')
const rg = ref('')
const gender = ref('')
const cpf = ref('')
const birth_date = ref('')
const phone = ref('')
const zipcode = ref('')
const street = ref('')
const district = ref('')
const house_number = ref('')
const additional_info = ref('')
const country = ref('')
const state = ref('')
const city = ref('')
const medical_history = ref('')

const submit = async () => {
  await $fetch('/api/patients', {
    method: 'POST',
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
  await navigateTo('/patients')
}
</script>

<template>
  <form @submit.prevent="submit">
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
  <div>
    <button @click="$router.push('/patients')">Back to Patient List</button>
  </div>
</template>