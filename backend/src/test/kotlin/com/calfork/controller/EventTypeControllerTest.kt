package com.calfork.controller

import com.calfork.AbstractIntegrationTest
import com.calfork.model.AvailabilityRuleModel
import com.calfork.model.EventTypeCreate
import com.calfork.model.EventTypeModel
import com.calfork.model.EventTypeUpdate
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
import java.time.LocalDateTime

class EventTypeControllerTest : AbstractIntegrationTest() {
    @Autowired
    private lateinit var eventTypeRepository: EventTypeRepository

    @Autowired
    private lateinit var availabilityRuleRepository: AvailabilityRuleRepository

    private fun authHeader(userId: String) = HttpHeaders().apply { set("x-user-id", userId) }

    @Test
    fun shouldCreateEventType() {
        availabilityRuleRepository.save(
            AvailabilityRuleModel(
                id = "rule-1",
                authorId = "et-create",
                daysOfWeek = WeekDay.entries,
                startTime = "09:00",
                endTime = "18:00",
                timezone = "Europe/Moscow",
            ),
        )

        val body =
            EventTypeCreate(
                title = "30 min chat",
                description = "A quick catch-up",
                durationMinutes = 30,
                zoomLink = "https://zoom.us/j/123",
                availabilityRuleId = "rule-1",
            )

        val response =
            rest.postForEntity(
                "/event-types",
                HttpEntity(body, authHeader("et-create")),
                EventTypeModel::class.java,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
        val eventType = response.body!!
        assertThat(eventType.id).isNotEmpty()
        assertThat(eventType.title).isEqualTo("30 min chat")
        assertThat(eventType.description).isEqualTo("A quick catch-up")
        assertThat(eventType.durationMinutes).isEqualTo(30)
        assertThat(eventType.zoomLink).isEqualTo("https://zoom.us/j/123")
        assertThat(eventType.slug).isNotEmpty()
        assertThat(eventType.authorId).isEqualTo("et-create")
        assertThat(eventType.bookingLink).isEqualTo("/book/${eventType.slug}")
        assertThat(eventType.availabilityRuleId).isEqualTo("rule-1")
        assertThat(eventType.createdAt).isNotNull()
        assertThat(eventType.updatedAt).isNotNull()
    }

    @Test
    fun shouldGetEventTypeById() {
        val now = LocalDateTime.now()
        availabilityRuleRepository.save(
            AvailabilityRuleModel(
                id = "rule-1",
                authorId = "et-get",
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
                durationMinutes = 45,
                zoomLink = "https://zoom.us/j/456",
                slug = "test-event",
                authorId = "et-get",
                bookingLink = "/book/test-event",
                availabilityRuleId = "rule-1",
                createdAt = now,
                updatedAt = now,
            ),
        )

        val response =
            rest.exchange(
                "/event-types/{id}",
                HttpMethod.GET,
                HttpEntity(null, authHeader("et-get")),
                EventTypeModel::class.java,
                "et-1",
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val eventType = response.body!!
        assertThat(eventType.id).isEqualTo("et-1")
        assertThat(eventType.title).isEqualTo("Test Event")
        assertThat(eventType.durationMinutes).isEqualTo(45)
    }

    @Test
    fun shouldListEventTypes() {
        val now = LocalDateTime.now()
        availabilityRuleRepository.save(
            AvailabilityRuleModel(
                id = "rule-1",
                authorId = "et-list",
                daysOfWeek = WeekDay.entries,
                startTime = "09:00",
                endTime = "18:00",
                timezone = "Europe/Moscow",
            ),
        )
        eventTypeRepository.save(
            EventTypeModel(
                id = "et-1",
                title = "Event A",
                description = null,
                durationMinutes = 30,
                zoomLink = "https://zoom.us/j/a",
                slug = "event-a",
                authorId = "et-list",
                bookingLink = "/book/event-a",
                availabilityRuleId = "rule-1",
                createdAt = now,
                updatedAt = now,
            ),
        )
        eventTypeRepository.save(
            EventTypeModel(
                id = "et-2",
                title = "Event B",
                description = null,
                durationMinutes = 60,
                zoomLink = "https://zoom.us/j/b",
                slug = "event-b",
                authorId = "et-list",
                bookingLink = "/book/event-b",
                availabilityRuleId = "rule-1",
                createdAt = now,
                updatedAt = now,
            ),
        )

        val response =
            rest.exchange(
                "/event-types",
                HttpMethod.GET,
                HttpEntity(null, authHeader("et-list")),
                object : ParameterizedTypeReference<List<EventTypeModel>>() {},
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body).hasSize(2)
    }

    @Test
    fun shouldUpdateEventType() {
        val now = LocalDateTime.now()
        availabilityRuleRepository.save(
            AvailabilityRuleModel(
                id = "rule-1",
                authorId = "et-update",
                daysOfWeek = WeekDay.entries,
                startTime = "09:00",
                endTime = "18:00",
                timezone = "Europe/Moscow",
            ),
        )
        eventTypeRepository.save(
            EventTypeModel(
                id = "et-1",
                title = "Original Title",
                description = "Original description",
                durationMinutes = 30,
                zoomLink = "https://zoom.us/j/789",
                slug = "original-title",
                authorId = "et-update",
                bookingLink = "/book/original-title",
                availabilityRuleId = "rule-1",
                createdAt = now,
                updatedAt = now,
            ),
        )

        val response =
            rest.exchange(
                "/event-types/{id}",
                HttpMethod.PATCH,
                HttpEntity(
                    EventTypeUpdate(title = "Updated Title", description = null, durationMinutes = 60, zoomLink = null),
                    authHeader("et-update"),
                ),
                EventTypeModel::class.java,
                "et-1",
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val updated = response.body!!
        assertThat(updated.title).isEqualTo("Updated Title")
        assertThat(updated.durationMinutes).isEqualTo(60)
        assertThat(updated.description).isEqualTo("Original description")
    }

    @Test
    fun shouldDeleteEventType() {
        val now = LocalDateTime.now()
        availabilityRuleRepository.save(
            AvailabilityRuleModel(
                id = "rule-1",
                authorId = "et-delete",
                daysOfWeek = WeekDay.entries,
                startTime = "09:00",
                endTime = "18:00",
                timezone = "Europe/Moscow",
            ),
        )
        eventTypeRepository.save(
            EventTypeModel(
                id = "et-1",
                title = "To Delete",
                description = null,
                durationMinutes = 30,
                zoomLink = "https://zoom.us/j/0",
                slug = "to-delete",
                authorId = "et-delete",
                bookingLink = "/book/to-delete",
                availabilityRuleId = "rule-1",
                createdAt = now,
                updatedAt = now,
            ),
        )

        val deleteResponse =
            rest.exchange(
                "/event-types/{id}",
                HttpMethod.DELETE,
                HttpEntity(null, authHeader("et-delete")),
                Void::class.java,
                "et-1",
            )
        assertThat(deleteResponse.statusCode).isEqualTo(HttpStatus.NO_CONTENT)

        val getResponse =
            rest.exchange(
                "/event-types/{id}",
                HttpMethod.GET,
                HttpEntity(null, authHeader("et-delete")),
                String::class.java,
                "et-1",
            )
        assertThat(getResponse.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
    }
}
