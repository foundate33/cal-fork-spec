package com.calfork.controller

import com.calfork.dto.BookingPageDto
import com.calfork.model.AvailabilityRuleModel
import com.calfork.model.EventTypeModel
import com.calfork.model.WeekDay
import com.calfork.repository.AvailabilityRuleRepository
import com.calfork.repository.EventTypeRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.http.HttpStatus
import org.springframework.test.context.ActiveProfiles
import java.time.LocalDateTime

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class BookingControllerTest {
    @Autowired
    private lateinit var rest: TestRestTemplate

    @Autowired
    private lateinit var eventTypeRepository: EventTypeRepository

    @Autowired
    private lateinit var availabilityRuleRepository: AvailabilityRuleRepository

    @Test
    fun shouldReturnBookingPageWithSlots() {
        val authorId = "test-author"
        val now = LocalDateTime.now()

        availabilityRuleRepository.save(
            AvailabilityRuleModel(
                id = "rule-1",
                authorId = authorId,
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
                authorId = authorId,
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
}
