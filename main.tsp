import "@typespec/http";
import "@typespec/rest";

using Http;
using TypeSpec.Rest;

@service(#{ title: "Cal Fork" })
namespace CalFork;

// ---- Auth ----
model AuthorizedRequest {
  @header "x-user-id": string;
}

// ---- Shared models ----

model BookerInfo {
  /** Имя бронирующего */
  name: string;

  /** Email бронирующего */
  email: string;

  /** Комментарий к бронированию */
  notes?: string;
}

// ---- EventType ----

/** Параметры для создания типа события */
model EventTypeCreate {
  /** Название встречи */
  title: string;

  /** Описание типа встречи */
  description?: string;

  /** Длительность в минутах */
  durationMinutes: int32;

  /** Ссылка на Zoom-конференцию */
  zoomLink: string;

  /** ID правила доступности, к которому привязан этот тип события (опционально — подставится дефолтное) */
  availabilityRuleId?: string;
}

/** Параметры для обновления типа события */
model EventTypeUpdate {
  title?: string;
  description?: string;
  durationMinutes?: int32;
  zoomLink?: string;
}

/** Тип события (шаблон встречи) */
model EventType {
  id: string;
  title: string;
  description?: string;
  durationMinutes: int32;
  zoomLink: string;
  slug: string;
  authorId: string;
  bookingLink: string;
  availabilityRuleId: string;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

// ---- Slot ----

/** Временной слот, доступный для бронирования (вычисляется из AvailabilityRule + EventType) */
@example(#{
  startTime: utcDateTime.fromISO("2026-07-06T09:00:00Z"),
  endTime: utcDateTime.fromISO("2026-07-06T09:30:00Z"),
})
model Slot {
  startTime: utcDateTime;
  endTime: utcDateTime;
}

// ---- Availability ----

/** День недели */
enum WeekDay {
  monday,
  tuesday,
  wednesday,
  thursday,
  friday,
  saturday,
  sunday,
}

/** Правило доступности — повторяющийся временной интервал */
model AvailabilityRule {
  /** ID правила */
  id: string;

  /** ID автора */
  authorId: string;

  /** Дни недели */
  daysOfWeek: WeekDay[];

  /** Время начала (HH:mm) */
  startTime: string;

  /** Время окончания (HH:mm) */
  endTime: string;

  /** Часовой пояс (IANA, например Europe/Moscow) */
  timezone: string;
}

/** Параметры создания правила доступности */
model AvailabilityRuleCreate {
  daysOfWeek: WeekDay[];
  startTime: string;
  endTime: string;
  timezone: string;
}

/** Параметры обновления правила доступности */
model AvailabilityRuleUpdate {
  daysOfWeek?: WeekDay[];
  startTime?: string;
  endTime?: string;
  timezone?: string;
}

// ---- Booking ----

/** Запрос на бронирование */
model BookingCreate {
  startTime: utcDateTime;
  endTime: utcDateTime;
  booker: BookerInfo;
}

/** Подтверждённое бронирование */
model Booking {
  id: string;
  eventType: EventType;
  startTime: utcDateTime;
  endTime: utcDateTime;
  booker: BookerInfo;
  zoomLink: string;
  createdAt: utcDateTime;
}

// ---- Calendar ----

/** Запись в календаре автора */
model CalendarEntry {
  date: plainDate;
  bookings: Booking[];
}

// ---- Booking page (public) ----

/** Публичная страница бронирования */
model BookingPage {
  eventType: EventType;
  slots: Slot[];
}

// ---- Error ----

@error
model Error {
  code: int32;
  message: string;
}

// ---- Event Types (Author) ----

@route("/event-types")
@tag("Event Types")
interface EventTypes {
  /** Создать новый тип события */
  @post create(
    ...AuthorizedRequest,
    @body body: EventTypeCreate,
  ): EventType | Error;

  /** Получить список типов событий автора */
  @get list(
    ...AuthorizedRequest,
  ): EventType[] | Error;

  /** Получить тип события по ID */
  @get get(
    ...AuthorizedRequest,
    @path id: string,
  ): EventType | Error;

  /** Обновить тип события */
  @patch update(
    ...AuthorizedRequest,
    @path id: string,
    @body body: EventTypeUpdate,
  ): EventType | Error;

  /** Удалить тип события */
  @delete delete(
    ...AuthorizedRequest,
    @path id: string,
  ): void | Error;
}

// ---- Slots (Author — computed) ----

@route("/event-types/{eventTypeId}/slots")
@tag("Slots")
interface Slots {
  /** Получить доступные слоты для типа события на указанную дату */
  @get list(
    ...AuthorizedRequest,
    @path eventTypeId: string,
    @query date: plainDate,
  ): Slot[] | Error;
}

// ---- Availability (Author) ----

@route("/availability")
@tag("Availability")
interface Availability {
  /** Добавить правило доступности */
  @post create(
    ...AuthorizedRequest,
    @body body: AvailabilityRuleCreate,
  ): AvailabilityRule | Error;

  /** Получить все правила доступности автора */
  @get list(
    ...AuthorizedRequest,
  ): AvailabilityRule[] | Error;

  /** Обновить правило доступности */
  @patch update(
    ...AuthorizedRequest,
    @path ruleId: string,
    @body body: AvailabilityRuleUpdate,
  ): AvailabilityRule | Error;

  /** Удалить правило доступности */
  @delete delete(
    ...AuthorizedRequest,
    @path ruleId: string,
  ): void | Error;
}

// ---- Calendar (Author) ----

@route("/calendar")
@tag("Calendar")
interface Calendar {
  /** Получить календарь автора с забронированными встречами */
  @get view(
    ...AuthorizedRequest,
    @query startDate: plainDate,
    @query endDate: plainDate,
  ): CalendarEntry[] | Error;
}

// ---- Booking (Booker — public) ----

@route("/book/{slug}")
@tag("Booking")
interface BookingRouter {
  /** Получить публичную страницу бронирования (тип события + доступные слоты) */
  @get
  @opExample(#{
    parameters: #{ slug: "my-event" },
    returnType: #{
      eventType: #{
        id: "et-1",
        title: "30 min chat",
        description: "A quick catch-up",
        durationMinutes: 30,
        zoomLink: "https://zoom.us/j/123",
        slug: "my-event",
        authorId: "user-1",
        bookingLink: "/book/my-event",
        availabilityRuleId: "rule-1",
        createdAt: utcDateTime.fromISO("2026-07-01T00:00:00Z"),
        updatedAt: utcDateTime.fromISO("2026-07-01T00:00:00Z"),
      },
      slots: #[
        #{ startTime: utcDateTime.fromISO("2026-07-06T09:00:00Z"), endTime: utcDateTime.fromISO("2026-07-06T09:30:00Z") },
        #{ startTime: utcDateTime.fromISO("2026-07-06T09:30:00Z"), endTime: utcDateTime.fromISO("2026-07-06T10:00:00Z") },
        #{ startTime: utcDateTime.fromISO("2026-07-06T10:00:00Z"), endTime: utcDateTime.fromISO("2026-07-06T10:30:00Z") },
      ],
    },
  })
  page(
    @path slug: string,
  ): BookingPage | Error;

  /** Забронировать слот */
  @route("book")
  @post book(
    @path slug: string,
    @body body: BookingCreate,
  ): Booking | Error;
}