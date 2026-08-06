<script setup lang="ts">
import { ref } from 'vue';
const { t } = useI18n();
const checkbox = ref(false);
</script>
<template>
 
    <v-row class="d-flex  mb-3">

        <v-col cols="12">
            <v-label class="font-weight-medium mb-1">{{ t('auth.register.nameLabel') }}</v-label>
            <v-text-field variant="outlined" hide-details color="primary"></v-text-field>
        </v-col>
        <v-col cols="12">
            <v-label class="font-weight-medium mb-1">{{ t('auth.register.emailLabel') }}</v-label>
            <v-text-field variant="outlined" type="email" hide-details color="primary"></v-text-field>
        </v-col>
        <v-col cols="12">
            <v-label class="font-weight-medium mb-1">{{ t('auth.register.passwordLabel') }}</v-label>
            <v-text-field variant="outlined" type="password"  hide-details color="primary"></v-text-field>
        </v-col>
        <v-col cols="12" >
            <v-btn to="/" color="primary" rounded="pill" size="large" block   flat>{{ t('auth.register.signUp') }}</v-btn>
        </v-col>
    </v-row>
</template>
