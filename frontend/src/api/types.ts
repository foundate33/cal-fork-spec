export interface EventType {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  zoomLink: string;
  slug: string;
  authorId: string;
  bookingLink: string;
  availabilityRuleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventTypeCreate {
  title: string;
  description?: string;
  durationMinutes: number;
  zoomLink: string;
  slug?: string;
  availabilityRuleId: string;
}

export interface EventTypeUpdate {
  title?: string;
  description?: string;
  durationMinutes?: number;
  zoomLink?: string;
}

export interface Slot {
  startTime: string;
  endTime: string;
}

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface AvailabilityRule {
  id: string;
  authorId: string;
  daysOfWeek: WeekDay[];
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface AvailabilityRuleCreate {
  daysOfWeek: WeekDay[];
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface AvailabilityRuleUpdate {
  daysOfWeek?: WeekDay[];
  startTime?: string;
  endTime?: string;
  timezone?: string;
}

export interface BookerInfo {
  name: string;
  email: string;
  notes?: string;
}

export interface Booking {
  id: string;
  eventType: EventType;
  startTime: string;
  endTime: string;
  booker: BookerInfo;
  zoomLink: string;
  createdAt: string;
}

export interface BookingCreate {
  startTime: string;
  endTime: string;
  booker: BookerInfo;
}

export interface BookingPage {
  eventType: EventType;
  slots: Slot[];
}

export interface CalendarEntry {
  date: string;
  bookings: Booking[];
}