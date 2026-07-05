package com.calfork.controller

import com.calfork.AbstractIntegrationTest
import com.calfork.dto.CalendarEntryDto
import com.calfork.model.AvailabilityRuleModel
import com.calfork.model.BookingModel
import com.calfork.model.EventTypeModel
import com.calfork.model.WeekDay
import com.calfork.repository.AvailabilityRuleRepository
import com.calfork.repository.BookingRepository
import com.calfork.repository.EventTypeRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import java.time.LocalDate
import java.time.LocalDateTime

class CalendarControllerTest : AbstractIntegrationTest() {
    @Autowired
    private lateinit var eventTypeRepository: EventTypeRepository

    @Autowired
    private lateinit var availabilityRuleRepository: AvailabilityRuleRepository

    @Autowired
    private lateinit var bookingRepository: BookingRepository

    @Test
    fun shouldReturnCalendarWithBookings() {
        val now = LocalDateTime.now()

        availabilityRuleRepository.save(
            AvailabilityRuleModel(
                id = "rule-1",
                authorId = "cal-test",
                daysOfWeek = WeekDay.entries,
                startTime = "09:00",
                endTime = "18:00",
                timezone = "Europe/Moscow",
            ),
        )
        eventTypeRepository.save(
            EventTypeModel(
                id = "et-1",
                title = "Calendar Event",
                description = null,
                durationMinutes = 30,
                zoomLink = "https://zoom.us/j/cal",
                slug = "calendar-event",
                authorId = "cal-test",
                bookingLink = "/book/calendar-event",
                availabilityRuleId = "rule-1",
                createdAt = now,
                updatedAt = now,
            ),
        )
        bookingRepository.save(
            BookingModel(
                id = "booking-1",
                eventTypeId = "et-1",
                startTime = LocalDateTime.of(2026, 7, 6, 10, 0),
                endTime = LocalDateTime.of(2026, 7, 6, 10, 30),
                bookerName = "Alice",
                bookerEmail = "alice@example.com",
                bookerNotes = "Test booking",
                zoomLink = "https://zoom.us/j/cal",
                createdAt = now,
            ),
        )

        val response =
            rest.exchange(
                "/calendar?startDate=2026-07-06&endDate=2026-07-06",
                HttpMethod.GET,
                HttpEntity(null, HttpHeaders().apply { set("x-user-id", "cal-test") }),
                object : ParameterizedTypeReference<List<CalendarEntryDto>>() {},
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val entries = response.body!!
        assertThat(entries).hasSize(1)
        val entry = entries.first()
        assertThat(entry.date).isEqualTo(LocalDate.of(2026, 7, 6))
        assertThat(entry.bookings).hasSize(1)
        val booking = entry.bookings.first()
        assertThat(booking.id).isEqualTo("booking-1")
        assertThat(booking.booker.name).isEqualTo("Alice")
        assertThat(booking.eventType.id).isEqualTo("et-1")
    }
}
