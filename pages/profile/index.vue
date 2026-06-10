<script setup lang="ts">
import { ref, onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';

definePageMeta({ middleware: 'auth' });

const { profile, loading, saving, error, loadProfile, updateProfile, changePassword } = useProfile();

const editName = ref('');
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showCurrent = ref(false);
const showNew = ref(false);
const passwordError = ref('');

onMounted(async () => {
  await loadProfile();
  if (profile.value) editName.value = profile.value.name;
});

const handleUpdateProfile = async () => {
  await updateProfile(editName.value);
};

const handleChangePassword = async () => {
  passwordError.value = '';
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Passwords do not match.';
    return;
  }
  if (newPassword.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters.';
    return;
  }
  const ok = await changePassword(currentPassword.value, newPassword.value, confirmPassword.value);
  if (ok) {
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  }
};

const formatDate = (val: string | null) => {
  if (!val) return 'Never';
  return new Date(val).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};
</script>

<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">My Profile</h1>
        <p class="text-body-1 text-medium-emphasis">Manage your account information and password</p>
      </v-col>
    </v-row>

    <v-row v-if="loading">
      <v-col cols="12">
        <UiChildCard>
          <div class="d-flex justify-center py-12">
            <v-progress-circular indeterminate color="primary" size="64" />
          </div>
        </UiChildCard>
      </v-col>
    </v-row>

    <template v-else-if="profile">
      <v-row>
        <!-- Profile info -->
        <v-col cols="12" md="6">
          <UiChildCard title="Account Information">
            <div class="mb-4">
              <div class="text-caption text-medium-emphasis mb-1">Email</div>
              <div class="text-body-1 font-weight-medium">{{ profile.email }}</div>
            </div>
            <div class="mb-4">
              <div class="text-caption text-medium-emphasis mb-1">Role</div>
              <v-chip color="error" variant="tonal" size="small" v-if="profile.is_super_admin">
                Super Admin
              </v-chip>
              <v-chip color="primary" variant="tonal" size="small" v-else>Admin</v-chip>
            </div>
            <div class="mb-4">
              <div class="text-caption text-medium-emphasis mb-1">Last Login</div>
              <div class="text-body-2">{{ formatDate(profile.last_login_at) }}</div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis mb-1">Member Since</div>
              <div class="text-body-2">{{ formatDate(profile.created_at) }}</div>
            </div>

            <v-divider class="my-5" />

            <h3 class="text-subtitle-1 font-weight-bold mb-4">Edit Name</h3>
            <v-text-field
              v-model="editName"
              label="Full Name"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-account-outline"
              class="mb-3"
            />
            <v-btn
              color="primary"
              :loading="saving"
              :disabled="saving || !editName || editName === profile.name"
              prepend-icon="mdi-content-save-outline"
              @click="handleUpdateProfile"
            >
              Save Changes
            </v-btn>
          </UiChildCard>
        </v-col>

        <!-- Change password -->
        <v-col cols="12" md="6">
          <UiChildCard title="Change Password">
            <v-alert v-if="passwordError" type="error" variant="tonal" density="compact" class="mb-4">
              {{ passwordError }}
            </v-alert>

            <v-text-field
              v-model="currentPassword"
              label="Current Password"
              :type="showCurrent ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="showCurrent ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showCurrent = !showCurrent"
              class="mb-3"
            />

            <v-text-field
              v-model="newPassword"
              label="New Password"
              :type="showNew ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-lock-reset"
              :append-inner-icon="showNew ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showNew = !showNew"
              hint="Minimum 8 characters"
              persistent-hint
              class="mb-3"
            />

            <v-text-field
              v-model="confirmPassword"
              label="Confirm New Password"
              :type="showNew ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-lock-check-outline"
              class="mb-5"
            />

            <v-btn
              color="primary"
              :loading="saving"
              :disabled="saving || !currentPassword || !newPassword || !confirmPassword"
              prepend-icon="mdi-lock-reset"
              @click="handleChangePassword"
            >
              Update Password
            </v-btn>
          </UiChildCard>
        </v-col>
      </v-row>
    </template>
  </div>
</template>
