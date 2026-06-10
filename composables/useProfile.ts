import { ApiClient } from '~/infrastructure/http/ApiClient';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_super_admin: boolean;
  last_login_at: string | null;
  created_at: string | null;
}

export const useProfile = () => {
  const profile = ref<ProfileData | null>(null);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref('');

  const notification = useNotification();
  const { user } = useAuth();
  const apiClient = new ApiClient();

  const loadProfile = async () => {
    loading.value = true;
    error.value = '';
    try {
      const res = await apiClient.get<{ success: boolean; data: ProfileData }>('/admin/me');
      if (res.success) profile.value = res.data;
    } catch (err: any) {
      error.value = err.message ?? 'Failed to load profile.';
    } finally {
      loading.value = false;
    }
  };

  const updateProfile = async (name: string) => {
    saving.value = true;
    try {
      const res = await apiClient.patch<{ success: boolean; data: ProfileData }>('/admin/me', { name });
      if (res.success) {
        profile.value = res.data;
        // Keep localStorage user in sync
        if (process.client) {
          const stored = localStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.name = name;
            localStorage.setItem('user', JSON.stringify(parsed));
          }
        }
        notification.success('Profile updated successfully.');
        return true;
      }
    } catch (err: any) {
      notification.error(err.message ?? 'Failed to update profile.');
    } finally {
      saving.value = false;
    }
    return false;
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    saving.value = true;
    try {
      await apiClient.patch('/admin/me/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      notification.success('Password changed successfully.');
      return true;
    } catch (err: any) {
      notification.error(err.message ?? 'Failed to change password.');
    } finally {
      saving.value = false;
    }
    return false;
  };

  return { profile, loading, saving, error, loadProfile, updateProfile, changePassword };
};
