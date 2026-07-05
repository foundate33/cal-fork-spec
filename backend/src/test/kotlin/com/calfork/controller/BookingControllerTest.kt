package com.calfork.controller

import com.calfork.AbstractIntegrationTest
import com.calfork.dto.BookingPageDto
import com.calfork.model.AvailabilityRuleModel
import com.calfork.model.BookerInfo
import com.calfork.model.BookingCreate
import com.calfork.model.BookingResponse
import com.calfork.model.EventTypeModel
import com.calfork.model.WeekDay
import com.calfork.repository.AvailabilityRuleRepository
import com.calfork.repository.EventTypeRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpEntity
import org.springframework.http.HttpStatus
import java.time.LocalDateTime

class BookingControllerTest : AbstractIntegrationTest() {
    @Autowired
    private lateinit var eventTypeRepository: EventTypeRepository

    @Autowired
    private lateinit var availabilityRuleRepository: AvailabilityRuleRepository

    @Test
    fun shouldReturnBookingPageWithSlots() {
        val now = LocalDateTime.now()

        availabilityRuleRepository.save(
            AvailabilityRuleModel(
                id = "rule-1",
                authorId = "test-author",
                daysOfWeek = WeekDay.entries,
                startTime = "09:00",
                endTime = "18:00",
                timezone = "Europe/Moscow",
            ),
        )

        eventTypeRepository.save(
            EventTypeModel(
                id = "et-1",
                title = "Test Event",
                description = "A test event",
                durationMinutes = 30,
                zoomLink = "https://zoom.us/j/123",
                slug = "test-event",
                authorId = "test-author",
                bookingLink = "/book/test-event",
                availabilityRuleId = "rule-1",
                createdAt = now,
                updatedAt = now,
            ),
        )

        val response =
            rest.getForEntity(
                "/book/test-event?date=2026-07-06",
                BookingPageDto::class.java,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)

        val body = response.body!!
        assertThat(body.eventType.slug).isEqualTo("test-event")
        assertThat(body.eventType.durationMinutes).isEqualTo(30)

        assertThat(body.slots).hasSize(18)
        for (slot in body.slots) {
            assertThat(slot.endTime).isEqualTo(slot.startTime.plusMinutes(30))
        }
        assertThat(body.slots.first().startTime.toLocalTime().toString()).isEqualTo("09:00")
        assertThat(body.slots.last().endTime.toLocalTime().toString()).isEqualTo("18:00")
    }

    @Test
    fun shouldCreateBooking() {
        val now = LocalDateTime.now()

        availabilityRuleRepository.save(
            AvailabilityRuleModel(
                id = "rule-1",
                authorId = "book-create",
                daysOfWeek = WeekDay.entries,
                startTime = "09:00",
                endTime = "18:00",
                timezone = "Europe/Moscow",
            ),
        )
        eventTypeRepository.save(
            EventTypeModel(
                id = "et-1",
                title = "Bookable Event",
                description = null,
                durationMinutes = 30,
                zoomLink = "https://zoom.us/j/bookable",
                slug = "bookable-event",
                authorId = "book-create",
                bookingLink = "/book/bookable-event",
                availabilityRuleId = "rule-1",
                createdAt = now,
                updatedAt = now,
            ),
        )

        val body =
            BookingCreate(
                startTime = LocalDateTime.of(2026, 7, 6, 14, 0),
                endTime = LocalDateTime.of(2026, 7, 6, 14, 30),
                booker =
                    BookerInfo(
                        name = "John Doe",
                        email = "john@example.com",
                        notes = "Looking forward to it",
                    ),
            )

        val response =
            rest.postForEntity(
                "/book/bookable-event/book",
                HttpEntity(body),
                BookingResponse::class.java,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
        val booking = response.body!!
        assertThat(booking.id).isNotEmpty()
        assertThat(booking.eventType.slug).isEqualTo("bookable-event")
        assertThat(booking.startTime).isEqualTo(LocalDateTime.of(2026, 7, 6, 14, 0))
        assertThat(booking.endTime).isEqualTo(LocalDateTime.of(2026, 7, 6, 14, 30))
        assertThat(booking.booker.name).isEqualTo("John Doe")
        assertThat(booking.booker.email).isEqualTo("john@example.com")
        assertThat(booking.booker.notes).isEqualTo("Looking forward to it")
        assertThat(booking.zoomLink).isEqualTo("https://zoom.us/j/bookable")
        assertThat(booking.createdAt).isNotNull()
    }
}
