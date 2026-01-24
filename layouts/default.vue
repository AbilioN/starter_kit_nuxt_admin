<script setup lang="ts">
import { ref, onMounted } from "vue";
const title = ref("spikeadmin Nuxt 3 - Vuetify 3 - vite - Typescript Based Free Dashboard");
const isDev = ref(process.dev);

useHead({
  meta: [{ content: title }],
  titleTemplate: (titleChunk) => {
    return titleChunk
      ? `${titleChunk} - Nuxt3 Typescript based Free Admin Dashboard Template`
      : "spikeadmin Nuxt 3 - Vuetify 3 - vite - Typescript Based Free Dashboard";
  },
});
</script>

<template>
    <v-locale-provider >
        <v-app>
     
            <v-main>
                <LayoutMain/>
                <v-container fluid class="page-wrapper bg-background px-sm-5 px-4 rounded-xl">
                    <div class="maxWidth">
                        <NuxtPage  />
                    </div>
                </v-container>
                
                <!-- Chat Widget -->
                <ChatWidget />
                
                <!-- Debug Button (apenas em desenvolvimento) -->
              <!--   <DebugButton /> -->
                
                <!-- Notification Snackbar -->
                <NotificationSnackbarSimple />
            </v-main>
        </v-app>
    </v-locale-provider>
</template>
