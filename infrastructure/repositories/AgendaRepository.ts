import { ApiClient } from '../http/ApiClient';
import type {
  Agenda, AgendaFilters, AgendaGroupBy, AgendaResponse, AgendaView,
} from '~/types/agenda';

export class AgendaRepository {
  private apiClient = new ApiClient();

  /**
   * One request returns the whole screen. Every navigation — another week, a
   * grouping, a filter — comes back through here rather than as a diff, which
   * is what keeps the panel from ever disagreeing with the server about what
   * is on screen.
   */
  async getAgenda(
    view: AgendaView,
    date: string,
    filters: AgendaFilters = {},
    groupBy: AgendaGroupBy | null = null,
  ): Promise<Agenda> {
    const params = new URLSearchParams({ view, date });

    if (groupBy) params.set('group_by', groupBy);
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, String(value));
    }

    const response = await this.apiClient.get<AgendaResponse>(`/agenda?${params.toString()}`);
    return response.data;
  }

  async changeStatus(appointmentId: string, statusId: string): Promise<void> {
    await this.apiClient.patch(`/appointments/${appointmentId}/status`, {
      appointment_status_id: statusId,
    });
  }

  async create(payload: Record<string, unknown>): Promise<void> {
    await this.apiClient.post('/appointments', payload);
  }

  async update(appointmentId: string, payload: Record<string, unknown>): Promise<void> {
    await this.apiClient.patch(`/appointments/${appointmentId}`, payload);
  }

  async remove(appointmentId: string): Promise<void> {
    await this.apiClient.delete(`/appointments/${appointmentId}`);
  }
}
