package com.calfork.controller

import com.calfork.dto.SlotDto
import com.calfork.exception.NotFoundException
import com.calfork.repository.EventTypeRepository
import com.calfork.service.SlotService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@RestController
@RequestMapping("/event-types/{eventTypeId}/slots")
class SlotController(
    private val slotService: SlotService,
    private val eventTypeRepository: EventTypeRepository,
) {
    @GetMapping
    fun list(
        @PathVariable eventTypeId: String,
        @RequestParam date: LocalDate,
        @RequestHeader("x-user-id") userId: String,
    ): List<SlotDto> {
        val eventType =
            eventTypeRepository.findById(eventTypeId)
                ?: throw NotFoundException("Event type not found")
        if (eventType.authorId != userId) throw NotFoundException("Event type not found")
        return slotService.getSlots(eventType, date)
    }
}
