import type { AdminProfile, UpdateAdminProfileRequest } from '~/types/api';
import { ProfileService } from '~/services/ProfileService';

// Espelham a validação do backend (UploadAdminAvatarRequest): max:2048 KB e
// mimes jpeg,jpg,png,webp. Validar no cliente é só UX — quem manda é o servidor.
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const useProfile = () => {
  // Instanciado DENTRO do composable: o construtor chega a getApiConfig() →
  // useRuntimeConfig(), que precisa de contexto Nuxt vivo (indisponível no
  // momento em que o módulo é importado).
  const profileService = new ProfileService();

  const profile = ref<AdminProfile | null>(null);
  const loading = ref(false);
  const savingProfile = ref(false);
  const savingPassword = ref(false);
  const uploadingAvatar = ref(false);
  const error = ref('');

  const { updateUser } = useAuth();
  const notification = useNotification();
  const { t } = useI18n();

  /** Sincroniza o admin em sessão (topbar, localStorage) com o perfil fresco. */
  const syncAuthUser = (data: AdminProfile) => {
    updateUser({
      name: data.name,
      avatar_url: data.avatar_url,
      notification_email: data.notification_email,
      is_tenant_owner: data.is_tenant_owner,
      is_super_admin: data.is_super_admin,
    });
  };

  const loadProfile = async () => {
    loading.value = true;
    error.value = '';
    const result = await profileService.getProfile();
    if (result.success && result.data) {
      profile.value = result.data;
      // Repara também sessões antigas cujo localStorage não tem avatar_url nem,
      // em alguns casos, is_tenant_owner.
      syncAuthUser(result.data);
    } else {
      error.value = result.error ?? t('pages.profile.loadFailed');
    }
    loading.value = false;
  };

  const updateProfile = async (data: UpdateAdminProfileRequest): Promise<boolean> => {
    savingProfile.value = true;
    const result = await profileService.updateProfile(data);
    savingProfile.value = false;

    if (result.success && result.data) {
      profile.value = result.data;
      syncAuthUser(result.data);
      notification.success(t('pages.profile.profileUpdated'));
      return true;
    }

    notification.error(result.error ?? t('pages.profile.profileUpdateFailed'));
    return false;
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmation: string,
  ): Promise<boolean> => {
    savingPassword.value = true;
    const result = await profileService.changePassword({
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: confirmation,
    });
    savingPassword.value = false;

    if (result.success) {
      notification.success(t('pages.profile.passwordUpdated'));
      return true;
    }

    notification.error(result.error ?? t('pages.profile.passwordUpdateFailed'));
    return false;
  };

  /** @returns mensagem de erro traduzida, ou null se o ficheiro serve. */
  const validateAvatar = (file: File): string | null => {
    if (!AVATAR_MIME_TYPES.includes(file.type)) return t('pages.profile.avatarInvalidType');
    if (file.size > AVATAR_MAX_BYTES) return t('pages.profile.avatarTooLarge');
    return null;
  };

  const applyAvatarResult = (data: AdminProfile) => {
    // Cache-bust: o caminho pode repetir-se e o browser continuaria a mostrar os
    // bytes antigos no <img>.
    const busted = data.avatar_url
      ? `${data.avatar_url}${data.avatar_url.includes('?') ? '&' : '?'}v=${Date.now()}`
      : null;

    profile.value = { ...data, avatar_url: busted };
    syncAuthUser(profile.value);
  };

  const uploadAvatar = async (file: File): Promise<boolean> => {
    const invalid = validateAvatar(file);
    if (invalid) {
      notification.error(invalid);
      return false;
    }

    uploadingAvatar.value = true;
    const result = await profileService.uploadAvatar(file);
    uploadingAvatar.value = false;

    if (result.success && result.data) {
      applyAvatarResult(result.data);
      notification.success(t('pages.profile.avatarUpdated'));
      return true;
    }

    notification.error(result.error ?? t('pages.profile.avatarUploadFailed'));
    return false;
  };

  const removeAvatar = async (): Promise<boolean> => {
    uploadingAvatar.value = true;
    const result = await profileService.removeAvatar();
    uploadingAvatar.value = false;

    if (result.success && result.data) {
      applyAvatarResult(result.data);
      notification.success(t('pages.profile.avatarRemoved'));
      return true;
    }

    notification.error(result.error ?? t('pages.profile.avatarUploadFailed'));
    return false;
  };

  return {
    profile,
    loading,
    savingProfile,
    savingPassword,
    uploadingAvatar,
    error,
    loadProfile,
    updateProfile,
    changePassword,
    validateAvatar,
    uploadAvatar,
    removeAvatar,
  };
};
