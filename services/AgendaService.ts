import { AgendaRepository } from '~/infrastructure/repositories/AgendaRepository';
import type { AppointmentDetailResponse } from '~/infrastructure/repositories/AgendaRepository';
import type { Agenda, AgendaFilters, AgendaGroupBy, AgendaView } from '~/types/agenda';

export class AgendaService {
  private repository = new AgendaRepository();

  getAgenda(view: AgendaView, date: string, filters?: AgendaFilters, groupBy?: AgendaGroupBy | null): Promise<Agenda> {
    return this.repository.getAgenda(view, date, filters, groupBy ?? null);
  }

  changeStatus(appointmentId: string, statusId: string): Promise<void> {
    return this.repository.changeStatus(appointmentId, statusId);
  }

  create(payload: Record<string, unknown>): Promise<void> {
    return this.repository.create(payload);
  }

  update(appointmentId: string, payload: Record<string, unknown>): Promise<void> {
    return this.repository.update(appointmentId, payload);
  }

  getAppointment(appointmentId: string): Promise<AppointmentDetailResponse> {
    return this.repository.getAppointment(appointmentId);
  }

  updateAppointment(appointmentId: string, payload: Record<string, unknown>): Promise<AppointmentDetailResponse> {
    return this.repository.updateWithFields(appointmentId, payload);
  }

  remove(appointmentId: string): Promise<void> {
    return this.repository.remove(appointmentId);
  }
}
