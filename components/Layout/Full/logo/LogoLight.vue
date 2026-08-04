<script setup lang="ts">
import { RouterLink } from 'vue-router';
import logolight from '/images/logos/logo-light.svg';

const { tenantTheme } = useTenantTheme();
</script>
<template>
    <div class="logo">
        <NuxtLink to="/">
            <img v-if="tenantTheme?.logo_url" :src="tenantTheme.logo_url" :alt="tenantTheme.name" class="tenant-logo" />
            <img v-else :src="logolight" alt="home" />
        </NuxtLink>
    </div>
</template>

<style scoped>
.tenant-logo {
    max-height: 40px;
    max-width: 180px;
    object-fit: contain;
}
</style>
