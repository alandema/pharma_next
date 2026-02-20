<script setup lang="ts">

const getTodayDate = () => new Date().toISOString().split('T')[0];

const patient_id = ref('');
const date_prescribed = ref(getTodayDate());
const json_form_info = ref('');
const cid_code = ref('');

const [{ data: patients }, { data: cidsData }] = await Promise.all([
  useFetch('/api/patients'),
  useAsyncData('cids', () => queryCollection('cids').first())
]);

const cids = computed(() => cidsData.value?.codes ?? []);

const submit = async () => {
  await $fetch('/api/prescriptions', {
    method: 'POST',
    body: { patient_id: patient_id.value, date_prescribed: date_prescribed.value, cid_code: cid_code.value, json_form_info: json_form_info.value }
  });
  await navigateTo('/prescriptions');
};

</script>

<template>
  <h1>Create New Prescription</h1>
  <form @submit.prevent="submit">
    <div>
      <label>Patient:</label>
      <select v-model="patient_id" required>
        <option value="" disabled>Select a patient</option>
        <option v-for="patient in patients" :key="patient.id" :value="patient.id">
          {{ patient.name }}
        </option>
      </select>
    </div>
    
    <div>
      <label>Date Prescribed:</label>
      <input v-model="date_prescribed" type="date" required />
    </div>
    
    <div>
      <label>CID Code:</label>
      <select v-model="cid_code" required>
        <option value="" disabled>Select a CID code</option>
        <option v-for="c in cids" :key="c.code" :value="c.code">{{ c.code }} – {{ c.name }}</option>
      </select>
    </div>

    <div>
      <label>Prescription Details:</label>
      <textarea v-model="json_form_info" placeholder="Enter prescription details" rows="10" required></textarea>
    </div>
    
    <button type="submit">Save Prescription</button>
  </form>
  <div>
    <button @click="navigateTo('/prescriptions')">Back to Prescription List</button>
  </div>
</template>