package com.calfork.controller

import com.calfork.model.EventTypeCreate
import com.calfork.model.EventTypeModel
import com.calfork.model.EventTypeUpdate
import com.calfork.service.EventTypeService
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
@RequestMapping("/event-types")
class EventTypeController(
    private val service: EventTypeService,
) {
    @GetMapping
    fun list(
        @RequestHeader("x-user-id") userId: String,
    ): List<EventTypeModel> = service.list(userId)

    @GetMapping("/{id}")
    fun get(
        @PathVariable id: String,
        @RequestHeader("x-user-id") userId: String,
    ): EventTypeModel = service.get(id, userId)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestBody body: EventTypeCreate,
        @RequestHeader("x-user-id") userId: String,
    ): EventTypeModel = service.create(body, userId)

    @PatchMapping("/{id}")
    fun update(
        @PathVariable id: String,
        @RequestBody body: EventTypeUpdate,
        @RequestHeader("x-user-id") userId: String,
    ): EventTypeModel = service.update(id, body, userId)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(
        @PathVariable id: String,
        @RequestHeader("x-user-id") userId: String,
    ) = service.delete(id, userId)
}
