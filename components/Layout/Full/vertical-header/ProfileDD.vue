<script setup lang="ts">
import { UserIcon, MailIcon, ListCheckIcon } from 'vue-tabler-icons';
import UserAvatar from '@/components/shared/UserAvatar.vue';

// `user` é o mesmo useState('user') que useProfile atualiza via
// useAuth().updateUser() — por isso a foto muda aqui sem reload.
const { user, logout } = useAuth();
const { t } = useI18n();

const handleLogout = () => {
  logout();
};
</script>

<template>
    <!-- ---------------------------------------------- -->
    <!-- notifications DD -->
    <!-- ---------------------------------------------- -->
    <v-menu :close-on-content-click="false">
        <template v-slot:activator="{ props }">
            <v-btn class="" variant="text" v-bind="props" icon>
                <UserAvatar :src="user?.avatar_url" :name="user?.name" :size="35" />
            </v-btn>
        </template>
        <v-sheet rounded="xl" width="240" elevation="10" class="mt-2">
            <div v-if="user" class="px-5 pt-4 pb-2">
                <div class="text-body-1 font-weight-medium text-truncate">{{ user.name }}</div>
                <div class="text-caption text-medium-emphasis text-truncate">{{ user.email }}</div>
            </div>
            <v-divider v-if="user" />
            <v-list class="py-0" lines="one" density="compact">
                <v-list-item value="item1" color="primary" to="/profile">
                    <template v-slot:prepend>
                        <UserIcon stroke-width="1.5" size="20"/>
                    </template>
                    <v-list-item-title class="pl-4 text-body-1">{{ t('profileMenu.myProfile') }}</v-list-item-title>
                </v-list-item>
                <v-list-item value="item2" color="primary" to="/notifications">
                    <template v-slot:prepend>
                        <MailIcon stroke-width="1.5" size="20"/>
                    </template>
                    <v-list-item-title class="pl-4 text-body-1">{{ t('profileMenu.notifications') }}</v-list-item-title>
                </v-list-item>
            </v-list>
            <div class="pt-4 pb-4 px-5 text-center">
                <v-btn @click="handleLogout" color="primary" variant="outlined" class="rounded-pill" block>{{ t('profileMenu.logout') }}</v-btn>
            </div>
        </v-sheet>
    </v-menu>
</template>
