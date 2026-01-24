<template>
  <v-snackbar
    v-model="show"
    :timeout="timeout"
    :color="snackbarColor"
    location="top right"
    variant="tonal"
    multi-line
  >
    <div class="d-flex align-center">
      <v-icon class="mr-3" size="24">{{ snackbarIcon }}</v-icon>
      <span class="text-body-1 font-weight-medium">{{ message }}</span>
    </div>
    
    <template v-slot:actions>
      <v-btn
        variant="text"
        icon
        @click="close"
        size="small"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
const { show, message, type, timeout, close } = useNotification();

// Debug - verificar valores
watch([show, message, type], ([showVal, msgVal, typeVal]) => {
  console.log('🔔 Notification state:', {
    show: showVal,
    message: msgVal,
    type: typeVal,
    timeout: timeout.value
  });
});

// Computed para cores e ícones baseados no tipo
const snackbarColor = computed(() => {
  const colors = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };
  return colors[type.value] || 'info';
});

const snackbarIcon = computed(() => {
  const icons = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information'
  };
  return icons[type.value] || 'mdi-information';
});
</script>
