import { ApiClient } from '~/infrastructure/http/ApiClient';
import { getApiConfig } from '~/config/api';
import type {
  Setting,
  SettingsResponse,
  SettingResponse,
  PublicSettings,
  PublicSettingsResponse,
} from '~/types/api';

export class SettingsService {
  private client: ApiClient;
  private publicBaseURL: string;

  constructor() {
    this.client = new ApiClient();
    this.publicBaseURL = getApiConfig().publicBaseURL;
  }

  async getPublicSettings(): Promise<PublicSettings> {
    const response = await $fetch<PublicSettingsResponse>(
      `${this.publicBaseURL}/settings/public`,
      { timeout: 5000 }
    );
    return response.data;
  }

  async getSettings(group?: string): Promise<Setting[]> {
    const query = group ? `?group=${group}` : '';
    const response = await this.client.get<SettingsResponse>(`/settings${query}`);
    return response.data;
  }

  async getSetting(key: string): Promise<Setting> {
    const response = await this.client.get<SettingResponse>(`/settings/${key}`);
    return response.data;
  }

  async updateSetting(key: string, value: Setting['value']): Promise<Setting> {
    const response = await this.client.put<SettingResponse>(`/settings/${key}`, { value });
    return response.data;
  }

  async updateManySettings(
    settings: Array<{ key: string; value: Setting['value'] }>
  ): Promise<Setting[]> {
    const response = await this.client.put<SettingsResponse>(`/settings`, { settings });
    return response.data;
  }
}
