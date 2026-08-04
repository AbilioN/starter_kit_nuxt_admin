<script setup lang="ts">
const { loadTenantTheme } = useTenantTheme();

onMounted(() => {
  loadTenantTheme();
});
</script>
<template>
  <v-app>
    <NuxtPage  />
  </v-app>
</template>