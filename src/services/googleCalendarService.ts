import { getAccessToken } from './googleAuthService';
import { CompanyAppointment } from '../types';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  status?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  updated?: string;
}

const getTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    return 'America/Sao_Paulo';
  }
};

/**
 * List events from user's primary Google Calendar
 */
export const listGoogleCalendarEvents = async (
  timeMin?: string,
  timeMax?: string,
  maxResults = 100
): Promise<{ items: GoogleCalendarEvent[]; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Google Workspace. Faça login para acessar o Google Agenda.');
  }

  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(maxResults)
  });

  if (timeMin) params.append('timeMin', timeMin);
  if (timeMax) params.append('timeMax', timeMax);

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Falha ao carregar eventos da Google Agenda (Status ${res.status})`);
  }

  const data = await res.json();
  return { items: data.items || [] };
};

/**
 * Create a new event on user's primary Google Calendar
 */
export const createGoogleCalendarEvent = async (
  appointment: CompanyAppointment
): Promise<GoogleCalendarEvent> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Google Workspace. Conecte sua conta do Google para sincronizar.');
  }

  const timeZone = getTimeZone();
  const startDateTime = `${appointment.startDate}T${appointment.startTime || '08:00'}:00`;
  const endDateTime = `${appointment.endDate || appointment.startDate}T${appointment.endTime || '09:00'}:00`;

  const detailsList: string[] = [];
  if (appointment.type) {
    const typeLabel = 
      appointment.type === 'visita_tecnica' ? 'Visita Técnica' :
      appointment.type === 'servico' ? 'Serviço Técnico Especializado' :
      appointment.type === 'entrega' ? 'Entrega & Instalação' : 'Compromisso da Empresa';
    detailsList.push(`📋 Tipo: ${typeLabel}`);
  }
  if (appointment.clientName) detailsList.push(`👤 Cliente: ${appointment.clientName}`);
  if (appointment.serviceOrderCode) detailsList.push(`🔢 Ordem de Serviço: ${appointment.serviceOrderCode}`);
  if (appointment.employeeName) detailsList.push(`🔧 Técnico / Responsável: ${appointment.employeeName}`);
  if (appointment.status) detailsList.push(`📊 Status no Sistema: ${appointment.status.toUpperCase()}`);
  if (appointment.description) detailsList.push(`\n📝 Observações:\n${appointment.description}`);

  const eventPayload = {
    summary: appointment.title,
    description: detailsList.join('\n'),
    location: appointment.location || '',
    start: {
      dateTime: new Date(startDateTime).toISOString(),
      timeZone
    },
    end: {
      dateTime: new Date(endDateTime).toISOString(),
      timeZone
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'popup', minutes: 120 }
      ]
    }
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventPayload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Erro ao criar evento no Google Calendar (${res.status})`);
  }

  return await res.json();
};

/**
 * Update an existing Google Calendar event
 */
export const updateGoogleCalendarEvent = async (
  eventId: string,
  appointment: Partial<CompanyAppointment>
): Promise<GoogleCalendarEvent> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Google Workspace.');
  }

  const timeZone = getTimeZone();
  const startDateTime = appointment.startDate && appointment.startTime 
    ? new Date(`${appointment.startDate}T${appointment.startTime}:00`).toISOString() 
    : undefined;

  const endDateTime = (appointment.endDate || appointment.startDate) && (appointment.endTime || appointment.startTime)
    ? new Date(`${appointment.endDate || appointment.startDate}T${appointment.endTime || appointment.startTime}:00`).toISOString()
    : undefined;

  const patchPayload: Record<string, any> = {};
  if (appointment.title) patchPayload.summary = appointment.title;
  if (appointment.location !== undefined) patchPayload.location = appointment.location;
  if (appointment.description) patchPayload.description = appointment.description;
  if (startDateTime) patchPayload.start = { dateTime: startDateTime, timeZone };
  if (endDateTime) patchPayload.end = { dateTime: endDateTime, timeZone };

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(patchPayload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Erro ao atualizar evento no Google Calendar (${res.status})`);
  }

  return await res.json();
};

/**
 * Delete event from Google Calendar (MUST require prior user confirmation)
 */
export const deleteGoogleCalendarEvent = async (eventId: string): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Google Workspace.');
  }

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Erro ao excluir evento no Google Calendar (${res.status})`);
  }

  return true;
};
