package com.calfork.controller

import com.calfork.AbstractIntegrationTest
import com.calfork.model.AvailabilityRuleCreate
import com.calfork.model.AvailabilityRuleModel
import com.calfork.model.AvailabilityRuleUpdate
import com.calfork.model.WeekDay
import com.calfork.repository.AvailabilityRuleRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus

class AvailabilityControllerTest : AbstractIntegrationTest() {
    @Autowired
    private lateinit var availabilityRuleRepository: AvailabilityRuleRepository

    private fun authHeader(userId: String) =
        HttpHeaders().apply { set("x-user-id", userId) }

    @Test
    fun shouldCreateAvailabilityRule() {
        val body = AvailabilityRuleCreate(
            daysOfWeek = listOf(WeekDay.MONDAY, WeekDay.WEDNESDAY, WeekDay.FRIDAY),
            startTime = "10:00",
            endTime = "16:00",
            timezone = "America/New_York",
        )

        val response = rest.postForEntity(
            "/availability",
            HttpEntity(body, authHeader("av-create")),
            AvailabilityRuleModel::class.java,
        )

        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
        val rule = response.body!!
        assertThat(rule.id).isNotEmpty()
        assertThat(rule.authorId).isEqualTo("av-create")
        assertThat(rule.daysOfWeek).containsExactly(WeekDay.MONDAY, WeekDay.WEDNESDAY, WeekDay.FRIDAY)
        assertThat(rule.startTime).isEqualTo("10:00")
        assertThat(rule.endTime).isEqualTo("16:00")
        assertThat(rule.timezone).isEqualTo("America/New_York")
    }

    @Test
    fun shouldListAvailabilityRules() {
        availabilityRuleRepository.save(
            AvailabilityRuleModel(
                id = "rule-1", authorId = "av-list",
                daysOfWeek = WeekDay.entries,
                startTime = "09:00", endTime = "18:00",
                timezone = "Europe/Moscow",
            ),
        )

        val response = rest.exchange(
            "/availability", HttpMethod.GET,
            HttpEntity(null, authHeader("av-list")),
            object : ParameterizedTypeReference<List<AvailabilityRuleModel>>() {},
        )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body).isNotEmpty
    }

    @Test
    fun shouldUpdateAvailabilityRule() {
        availabilityRuleRepository.save(
            AvailabilityRuleModel(
                id = "rule-1", authorId = "av-update",
                daysOfWeek = WeekDay.entries,
                startTime = "09:00", endTime = "18:00",
                timezone = "Europe/Moscow",
            ),
        )

        val body = AvailabilityRuleUpdate(
            daysOfWeek = null,
            startTime = "10:00",
            endTime = "17:00",
            timezone = null,
        )

        val response = rest.exchange(
            "/availability/{ruleId}", HttpMethod.PATCH,
            HttpEntity(body, authHeader("av-update")),
            AvailabilityRuleModel::class.java, "rule-1",
        )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val updated = response.body!!
        assertThat(updated.startTime).isEqualTo("10:00")
        assertThat(updated.endTime).isEqualTo("17:00")
    }

    @Test
    fun shouldDeleteAvailabilityRule() {
        availabilityRuleRepository.save(
            AvailabilityRuleModel(
                id = "rule-1", authorId = "av-delete",
                daysOfWeek = listOf(WeekDay.MONDAY),
                startTime = "09:00", endTime = "17:00",
                timezone = "Europe/Moscow",
            ),
        )

        val response = rest.exchange(
            "/availability/{ruleId}", HttpMethod.DELETE,
            HttpEntity(null, authHeader("av-delete")),
            Void::class.java, "rule-1",
        )

        assertThat(response.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
    }
}