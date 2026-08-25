<script setup lang="ts">
import { ref, onMounted } from "vue";
const { tenantTheme, loadTenantTheme, iconUrl } = useTenantTheme();
const { t, locale } = useI18n();

useHead({
  titleTemplate: (titleChunk) => {
    // referencing locale.value makes this recompute when the language switches
    const appName = tenantTheme.value?.name || t('app.title', {}, { locale: locale.value });
    return titleChunk ? `${titleChunk} - ${appName}` : appName;
  },
  // The tab icon is the one piece of branding visible while the user is on
  // another tab — the 32px variant exists precisely for this, so there is no
  // reason to make the browser downscale a 512px logo for it. Omitted (rather
  // than nulled) until the theme loads, so the static favicon stays.
  link: () => {
    const favicon = iconUrl('small');
    return favicon ? [{ rel: 'icon', type: 'image/png', href: favicon }] : [];
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
