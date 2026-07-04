import type { EventType, EventTypeCreate, EventTypeUpdate } from './types';
import type { Slot } from './types';
import type { AvailabilityRule, AvailabilityRuleCreate, AvailabilityRuleUpdate } from './types';
import type { BookingPage, BookingCreate, Booking } from './types';
import type { CalendarEntry } from './types';
import { api } from './http';

export { api } from './http';

export const eventTypesApi = {
  list: () => api.get<EventType[]>('/event-types'),
  get: (id: string) => api.get<EventType>(`/event-types/${id}`),
  create: (body: EventTypeCreate) => api.post<EventType>('/event-types', body),
  update: (id: string, body: EventTypeUpdate) =>
    api.patch<EventType>(`/event-types/${id}`, body),
  delete: (id: string) => api.delete<void>(`/event-types/${id}`),
};

export const slotsApi = {
  list: (eventTypeId: string, date: string) =>
    api.get<Slot[]>(`/event-types/${eventTypeId}/slots?date=${date}`),
};

export const availabilityApi = {
  list: () =>
    api.get<AvailabilityRule[]>('/availability'),
  create: (body: AvailabilityRuleCreate) =>
    api.post<AvailabilityRule>('/availability', body),
  update: (ruleId: string, body: AvailabilityRuleUpdate) =>
    api.patch<AvailabilityRule>(`/availability/${ruleId}`, body),
  delete: (ruleId: string) =>
    api.delete<void>(`/availability/${ruleId}`),
};

export const calendarApi = {
  view: (startDate: string, endDate: string) =>
    api.get<CalendarEntry[]>(
      `/calendar?startDate=${startDate}&endDate=${endDate}`,
    ),
};

export const bookingApi = {
  page: (slug: string) => api.get<BookingPage>(`/book/${slug}`),
  book: (slug: string, body: BookingCreate) =>
    api.post<Booking>(`/book/${slug}/book`, body),
};