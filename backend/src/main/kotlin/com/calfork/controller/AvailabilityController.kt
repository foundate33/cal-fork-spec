package com.calfork.controller

import com.calfork.model.AvailabilityRuleCreate
import com.calfork.model.AvailabilityRuleModel
import com.calfork.model.AvailabilityRuleUpdate
import com.calfork.service.AvailabilityService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/availability")
class AvailabilityController(
    private val service: AvailabilityService,
) {
    @GetMapping
    fun list(
        @RequestHeader("x-user-id") userId: String,
    ): List<AvailabilityRuleModel> = service.list(userId)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestBody body: AvailabilityRuleCreate,
        @RequestHeader("x-user-id") userId: String,
    ): AvailabilityRuleModel = service.create(body, userId)

    @PatchMapping("/{ruleId}")
    fun update(
        @PathVariable ruleId: String,
        @RequestBody body: AvailabilityRuleUpdate,
        @RequestHeader("x-user-id") userId: String,
    ): AvailabilityRuleModel = service.update(ruleId, body, userId)

    @DeleteMapping("/{ruleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(
        @PathVariable ruleId: String,
        @RequestHeader("x-user-id") userId: String,
    ) = service.delete(ruleId, userId)
}
