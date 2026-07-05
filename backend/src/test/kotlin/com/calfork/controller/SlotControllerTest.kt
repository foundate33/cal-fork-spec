package com.calfork.controller

import com.calfork.AbstractIntegrationTest
import com.calfork.dto.SlotDto
import com.calfork.model.AvailabilityRuleModel
import com.calfork.model.EventTypeModel
import com.calfork.model.WeekDay
import com.calfork.repository.AvailabilityRuleRepository
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

class SlotControllerTest : AbstractIntegrationTest() {
    @Autowired
    private lateinit var eventTypeRepository: EventTypeRepository

    @Autowired
    private lateinit var availabilityRuleRepository: AvailabilityRuleRepository

    @Test
    fun shouldReturnSlotsForEventType() {
        val now = LocalDateTime.now()

        availabilityRuleRepository.save(
            AvailabilityRuleModel(
                id = "rule-1", authorId = "slot-test",
                daysOfWeek = WeekDay.entries,
                startTime = "09:00", endTime = "18:00",
                timezone = "Europe/Moscow",
            ),
        )
        eventTypeRepository.save(
            EventTypeModel(
                id = "et-1", title = "Slotted Event",
                description = null, durationMinutes = 30,
                zoomLink = "https://zoom.us/j/slots",
                slug = "slotted-event", authorId = "slot-test",
                bookingLink = "/book/slotted-event",
                availabilityRuleId = "rule-1",
                createdAt = now, updatedAt = now,
            ),
        )

        val date = LocalDate.of(2026, 7, 6)

        val response = rest.exchange(
            "/event-types/{eventTypeId}/slots?date={date}",
            HttpMethod.GET,
            HttpEntity(null, HttpHeaders().apply { set("x-user-id", "slot-test") }),
            object : ParameterizedTypeReference<List<SlotDto>>() {},
            "et-1", date.toString(),
        )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val slots = response.body!!
        assertThat(slots).isNotEmpty()
        for (slot in slots) {
            assertThat(slot.startTime).isBefore(slot.endTime)
        }
        assertThat(slots.first().startTime.toLocalTime().toString()).isEqualTo("09:00")
        assertThat(slots.last().endTime.toLocalTime().toString()).isEqualTo("18:00")
    }
}