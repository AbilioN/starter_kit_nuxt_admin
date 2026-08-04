<script setup lang="ts">
import { ref, onMounted } from "vue";
const { tenantTheme, loadTenantTheme } = useTenantTheme();

useHead({
  titleTemplate: (titleChunk) => {
    const appName = tenantTheme.value?.name || "Admin Console";
    return titleChunk ? `${titleChunk} - ${appName}` : appName;
  },
});

onMounted(() => {
  loadTenantTheme();
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
