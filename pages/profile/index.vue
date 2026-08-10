<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import UserAvatar from '@/components/shared/UserAvatar.vue';

definePageMeta({ middleware: 'auth' });

const { t, locale } = useI18n();
const { user } = useAuth();
const notification = useNotification();
const {
  profile, loading, savingProfile, savingPassword, uploadingAvatar, error,
  loadProfile, updateProfile, changePassword, validateAvatar, uploadAvatar, removeAvatar,
} = useProfile();
const {
  entries, currentPlan, loading: loadingHistory, loaded: historyLoaded,
  error: historyError, pagination, loadHistory, formatAmount, statusColor,
  statusLabel, triggerLabel,
} = useSubscriptionHistory();

// Prefere o perfil recém-buscado ao admin em cache: sessões antigas no
// localStorage podem ser anteriores ao próprio campo is_tenant_owner.
const isOwner = computed(() => profile.value?.is_tenant_owner ?? user.value?.is_tenant_owner ?? false);

const activeTab = ref('account');
const tabs = computed(() => {
  const base = [
    { key: 'account', label: t('pages.profile.tabAccount'), icon: 'mdi-account-outline' },
    { key: 'security', label: t('pages.profile.tabSecurity'), icon: 'mdi-shield-lock-outline' },
  ];
  if (isOwner.value) {
    base.push({ key: 'subscription', label: t('pages.profile.tabSubscription'), icon: 'mdi-receipt-text-outline' });
  }
  return base;
});

// Se a aba selecionada deixar de existir (isOwner vira false depois do
// loadProfile), voltar para uma válida — senão a página fica em branco.
watch(tabs, (list) => {
  if (!list.some(tab => tab.key === activeTab.value)) activeTab.value = 'account';
});

// Carregar o histórico só quando a aba é aberta: não-owners nunca tocam no
// endpoint, e quem só vem mudar a senha também não.
watch(activeTab, (tab) => {
  if (tab === 'subscription' && !historyLoaded.value) loadHistory(1);
});

// ── Conta ───────────────────────────────────────────────────────────────
const editName = ref('');

const handleUpdateName = async () => {
  await updateProfile({ name: editName.value });
};

// ── Avatar ──────────────────────────────────────────────────────────────
const avatarInputRef = ref<HTMLInputElement | null>(null);
const pendingFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const removeAvatarDialog = ref(false);

const clearPreview = () => {
  // Sem o revoke, cada pré-visualização deixa um blob preso em memória.
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = null;
  pendingFile.value = null;
};

const onAvatarSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  // Limpar já: sem isto, escolher O MESMO ficheiro outra vez não dispara @change.
  input.value = '';
  if (!file) return;

  const invalid = validateAvatar(file);
  if (invalid) {
    notification.error(invalid);
    return;
  }

  clearPreview();
  pendingFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
};

const confirmAvatar = async () => {
  if (!pendingFile.value) return;
  const ok = await uploadAvatar(pendingFile.value);
  if (ok) clearPreview();
};

const handleRemoveAvatar = async () => {
  removeAvatarDialog.value = false;
  await removeAvatar();
};

onBeforeUnmount(clearPreview);

const displayedAvatar = computed(() => previewUrl.value ?? profile.value?.avatar_url ?? null);

// ── Segurança ───────────────────────────────────────────────────────────
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showCurrent = ref(false);
const showNew = ref(false);
const passwordError = ref('');

const notificationEmail = ref('');
const notificationEmailError = ref('');

const handleChangePassword = async () => {
  passwordError.value = '';
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = t('pages.profile.passwordsDontMatch');
    return;
  }
  if (newPassword.value.length < 8) {
    passwordError.value = t('pages.profile.passwordTooShort');
    return;
  }
  const ok = await changePassword(currentPassword.value, newPassword.value, confirmPassword.value);
  if (ok) {
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  }
};

const handleSaveNotificationEmail = async () => {
  notificationEmailError.value = '';
  const value = notificationEmail.value.trim();
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    notificationEmailError.value = t('pages.profile.notificationEmailInvalid');
    return;
  }
  // String vazia vira null: é assim que se limpa o endereço.
  await updateProfile({ notification_email: value === '' ? null : value });
};

// ── Comum ───────────────────────────────────────────────────────────────
onMounted(async () => {
  await loadProfile();
  if (profile.value) {
    editName.value = profile.value.name;
    notificationEmail.value = profile.value.notification_email ?? '';
  }
});

const formatDate = (val: string | null) => {
  if (!val) return t('pages.profile.never');
  return new Date(val).toLocaleDateString(locale.value, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};
</script>

<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">{{ t('pages.profile.title') }}</h1>
        <p class="text-body-1 text-medium-emphasis">{{ t('pages.profile.subtitle') }}</p>
      </v-col>
    </v-row>

    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab v-for="tab in tabs" :key="tab.key" :value="tab.key">
        <v-icon start>{{ tab.icon }}</v-icon>
        {{ tab.label }}
      </v-tab>
    </v-tabs>

    <div v-if="loading" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <!-- ── Conta ─────────────────────────────────────────────────────── -->
    <v-row v-else-if="activeTab === 'account'">
      <v-col cols="12" md="5">
        <UiChildCard :title="t('pages.profile.avatarTitle')">
          <div class="d-flex flex-column align-center ga-4 py-2">
            <UserAvatar :src="displayedAvatar" :name="profile?.name" :size="120" />

            <input
              ref="avatarInputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style="display: none"
              @change="onAvatarSelected"
            />

            <div class="d-flex flex-wrap justify-center ga-2">
              <v-btn variant="outlined" prepend-icon="mdi-camera-outline" @click="avatarInputRef?.click()">
                {{ t('pages.profile.changeAvatar') }}
              </v-btn>

              <template v-if="pendingFile">
                <v-btn color="primary" :loading="uploadingAvatar" @click="confirmAvatar">
                  {{ t('pages.profile.uploadAvatar') }}
                </v-btn>
                <v-btn variant="text" @click="clearPreview">{{ t('pages.profile.cancelSelection') }}</v-btn>
              </template>

              <v-btn
                v-else-if="profile?.avatar_url"
                variant="text"
                color="error"
                :loading="uploadingAvatar"
                @click="removeAvatarDialog = true"
              >
                {{ t('pages.profile.removeAvatar') }}
              </v-btn>
            </div>

            <div class="text-caption text-medium-emphasis text-center">{{ t('pages.profile.avatarHint') }}</div>
          </div>
        </UiChildCard>
      </v-col>

      <v-col cols="12" md="7">
        <UiChildCard :title="t('pages.profile.accountInfo')">
          <div class="mb-2">
            <div class="text-caption text-medium-emphasis">{{ t('common.labels.email') }}</div>
            <div class="text-body-1">{{ profile?.email }}</div>
          </div>
          <div class="mb-2">
            <div class="text-caption text-medium-emphasis">{{ t('common.labels.role') }}</div>
            <div class="d-flex ga-2">
              <v-chip :color="profile?.is_super_admin ? 'error' : 'primary'" size="small" variant="tonal">
                {{ profile?.is_super_admin ? t('pages.profile.superAdmin') : t('pages.profile.admin') }}
              </v-chip>
              <v-chip v-if="isOwner" color="success" size="small" variant="tonal">
                {{ t('pages.profile.tenantOwner') }}
              </v-chip>
            </div>
          </div>
          <div class="mb-2">
            <div class="text-caption text-medium-emphasis">{{ t('common.labels.lastLogin') }}</div>
            <div class="text-body-1">{{ formatDate(profile?.last_login_at ?? null) }}</div>
          </div>
          <div class="mb-4">
            <div class="text-caption text-medium-emphasis">{{ t('pages.profile.memberSince') }}</div>
            <div class="text-body-1">{{ formatDate(profile?.created_at ?? null) }}</div>
          </div>

          <v-divider class="mb-4" />

          <div class="text-subtitle-1 font-weight-medium mb-2">{{ t('pages.profile.editName') }}</div>
          <v-text-field
            v-model="editName"
            :label="t('pages.profile.fullName')"
            variant="outlined"
            density="comfortable"
            hide-details
            class="mb-3"
          />
          <v-btn
            color="primary"
            :loading="savingProfile"
            :disabled="!editName.trim() || editName === profile?.name"
            @click="handleUpdateName"
          >
            {{ t('common.actions.saveChanges') }}
          </v-btn>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- ── Segurança ─────────────────────────────────────────────────── -->
    <v-row v-else-if="activeTab === 'security'">
      <v-col cols="12" md="6">
        <UiChildCard :title="t('pages.profile.changePassword')">
          <v-alert v-if="passwordError" type="error" variant="tonal" density="compact" class="mb-3">
            {{ passwordError }}
          </v-alert>

          <v-text-field
            v-model="currentPassword"
            :label="t('pages.profile.currentPassword')"
            :type="showCurrent ? 'text' : 'password'"
            :append-inner-icon="showCurrent ? 'mdi-eye-off' : 'mdi-eye'"
            variant="outlined"
            density="comfortable"
            class="mb-2"
            hide-details
            @click:append-inner="showCurrent = !showCurrent"
          />
          <v-text-field
            v-model="newPassword"
            :label="t('pages.profile.newPassword')"
            :hint="t('pages.profile.newPasswordHint')"
            persistent-hint
            :type="showNew ? 'text' : 'password'"
            :append-inner-icon="showNew ? 'mdi-eye-off' : 'mdi-eye'"
            variant="outlined"
            density="comfortable"
            class="mb-2"
            @click:append-inner="showNew = !showNew"
          />
          <v-text-field
            v-model="confirmPassword"
            :label="t('pages.profile.confirmNewPassword')"
            :type="showNew ? 'text' : 'password'"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            hide-details
          />
          <v-btn
            color="primary"
            :loading="savingPassword"
            :disabled="!currentPassword || !newPassword || !confirmPassword"
            @click="handleChangePassword"
          >
            {{ t('pages.profile.updatePassword') }}
          </v-btn>
        </UiChildCard>
      </v-col>

      <v-col v-if="isOwner" cols="12" md="6">
        <UiChildCard :title="t('pages.profile.notificationEmailTitle')">
          <v-text-field
            v-model="notificationEmail"
            :label="t('pages.profile.notificationEmail')"
            :hint="t('pages.profile.notificationEmailHint')"
            :error-messages="notificationEmailError"
            persistent-hint
            type="email"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            prepend-inner-icon="mdi-email-alert-outline"
          />
          <v-btn color="primary" :loading="savingProfile" @click="handleSaveNotificationEmail">
            {{ t('common.actions.saveChanges') }}
          </v-btn>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- ── Subscrição (só tenant owner) ──────────────────────────────── -->
    <v-row v-else-if="activeTab === 'subscription' && isOwner">
      <v-col cols="12" md="4">
        <UiChildCard :title="t('pages.profile.currentPlan')">
          <div v-if="currentPlan">
            <div class="text-h5 font-weight-bold">{{ currentPlan.name }}</div>
            <div class="text-body-1 text-medium-emphasis">{{ formatAmount(currentPlan.price_cents) }}</div>
          </div>
          <div v-else class="text-body-2 text-medium-emphasis">{{ t('pages.profile.noPlan') }}</div>
        </UiChildCard>
      </v-col>

      <v-col cols="12" md="8">
        <UiChildCard :title="t('pages.profile.historyTitle')">
          <div v-if="loadingHistory" class="text-center pa-6">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <v-alert v-else-if="historyError" type="error" variant="tonal">{{ historyError }}</v-alert>

          <div v-else-if="entries.length === 0" class="text-center pa-6">
            <v-icon size="56" color="grey" class="mb-3">mdi-receipt-text-outline</v-icon>
            <div class="text-subtitle-1">{{ t('pages.profile.noHistory') }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ t('pages.profile.noHistoryHint') }}</div>
          </div>

          <template v-else>
            <div class="history-scroll">
              <v-table density="comfortable">
                <thead>
                  <tr>
                    <th>{{ t('common.labels.date') }}</th>
                    <th>{{ t('pages.profile.tablePlan') }}</th>
                    <th>{{ t('common.labels.amount') }}</th>
                    <th>{{ t('common.labels.status') }}</th>
                    <th>{{ t('pages.profile.tableOrigin') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="entry in entries" :key="entry.id">
                    <td class="text-no-wrap">{{ formatDate(entry.created_at) }}</td>
                    <!-- plan_name é null se o plano foi apagado; o slug guardado
                         no momento do pagamento ainda identifica a linha. -->
                    <td>{{ entry.plan_name ?? entry.plan_slug ?? '—' }}</td>
                    <td>{{ formatAmount(entry.amount_cents) }}</td>
                    <td>
                      <v-chip :color="statusColor(entry.status)" size="small" variant="tonal">
                        {{ statusLabel(entry.status) }}
                      </v-chip>
                    </td>
                    <td>{{ triggerLabel(entry.trigger) }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>

            <div v-if="pagination.last_page > 1" class="d-flex justify-center mt-4">
              <v-pagination
                :model-value="pagination.current_page"
                :length="pagination.last_page"
                :total-visible="5"
                density="comfortable"
                @update:model-value="loadHistory"
              />
            </div>
          </template>
        </UiChildCard>
      </v-col>
    </v-row>

    <v-dialog v-model="removeAvatarDialog" max-width="400">
      <v-card>
        <v-card-title>{{ t('pages.profile.removeAvatarDialogTitle') }}</v-card-title>
        <v-card-text>{{ t('pages.profile.removeAvatarDialogBody') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="removeAvatarDialog = false">{{ t('common.actions.cancel') }}</v-btn>
          <v-btn color="error" @click="handleRemoveAvatar">{{ t('common.actions.remove') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
/* Tabela larga não deve empurrar a página para o lado num ecrã estreito. */
.history-scroll {
  overflow-x: auto;
}
</style>
