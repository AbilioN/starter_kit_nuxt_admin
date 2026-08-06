<script setup lang="ts">
// Landlord-level pages (pricing, self-service signup) run on the bare root
// domain before any tenant is picked — unlike blank.vue/default.vue, this
// deliberately never calls loadTenantTheme(), since there is no tenant to
// resolve one from yet.
</script>
<template>
  <v-app>
    <NuxtPage />
  </v-app>
</template>
