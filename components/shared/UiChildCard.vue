<script setup lang="ts">
const props = defineProps({
    title: String
});
</script>

<template>
    <v-card elevation="10" class="bg-surface">
        <!-- Only when there IS a title. The template rendered the header
             unconditionally, which left every title-less card (the dashboard
             stat tiles) with an empty band and a divider across the top of
             nothing — invisible while cards were plain white, obvious once
             they gained an accent rule. -->
        <template v-if="title">
            <v-card-item class="py-4 px-6">
                <v-card-title class="text-h5">{{ title }}</v-card-title>
            </v-card-item>
            <v-divider />
        </template>
        <v-card-text>
            <slot />
        </v-card-text>
    </v-card>
</template>
