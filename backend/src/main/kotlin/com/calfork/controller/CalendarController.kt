package com.calfork.controller

import com.calfork.dto.CalendarEntryDto
import com.calfork.service.CalendarService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@RestController
@RequestMapping("/calendar")
class CalendarController(
    private val service: CalendarService,
) {
    @GetMapping
    fun view(
        @RequestParam startDate: LocalDate,
        @RequestParam endDate: LocalDate,
        @RequestHeader("x-user-id") userId: String,
    ): List<CalendarEntryDto> = service.getCalendar(userId, startDate, endDate)
}
