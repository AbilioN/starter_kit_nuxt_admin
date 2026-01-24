<template>
  <div>
    <v-snackbar
      v-model="localShow"
      :timeout="timeout"
      :color="snackbarColor"
      location="top right"
      variant="flat"
      elevation="6"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-3" color="white">{{ snackbarIcon }}</v-icon>
        <span class="text-white font-weight-medium">{{ message }}</span>
      </div>
      
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          icon
          @click="localShow = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
const { show, message, type, timeout, close } = useNotification();

// Usar variável local para controlar o v-model
const localShow = computed({
  get: () => show.value,
  set: (value) => {
    show.value = value;
    if (!value) close();
  }
});

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

// Debug
watch(show, (newVal) => {
  console.log('👀 Show changed:', newVal, 'Message:', message.value);
});
</script>
