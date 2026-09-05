import { ApiClient } from '../http/ApiClient';
import type {
  Agenda, AgendaFilters, AgendaGroupBy, AgendaResponse, AgendaView, AppointmentCard,
} from '~/types/agenda';
import type { CustomFieldDescriptor, CustomFieldValue } from '~/types/custom-fields';

/** A single appointment read, with its field context alongside. */
export interface AppointmentDetailResponse {
  success: boolean;
  data: Record<string, unknown>;
  custom_fields: CustomFieldDescriptor[];
  custom: CustomFieldValue[];
  /** Columns the server dropped because this admin may not write them. */
  ignored_fields?: string[];
}

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

  /**
   * One appointment, with the custom-field context.
   *
   * This endpoint did not exist until 2026-09-05: routes/api.php registered
   * create/update/delete against this controller and no way to read a single
   * record, so an edit form had nothing to open with.
   */
  async getAppointment(appointmentId: string): Promise<AppointmentDetailResponse> {
    return this.apiClient.get<AppointmentDetailResponse>(`/appointments/${appointmentId}`);
  }

  async update(appointmentId: string, payload: Record<string, unknown>): Promise<void> {
    await this.apiClient.patch(`/appointments/${appointmentId}`, payload);
  }

  /** Like update(), but hands back what the server said about custom fields. */
  async updateWithFields(appointmentId: string, payload: Record<string, unknown>): Promise<AppointmentDetailResponse> {
    return this.apiClient.patch<AppointmentDetailResponse>(`/appointments/${appointmentId}`, payload);
  }

  async remove(appointmentId: string): Promise<void> {
    await this.apiClient.delete(`/appointments/${appointmentId}`);
  }
}
