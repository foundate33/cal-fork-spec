package com.calfork.dto

import com.calfork.model.BookingResponse
import com.calfork.model.EventTypeModel
import java.time.LocalDate
import java.time.LocalDateTime

data class SlotDto(
    val startTime: LocalDateTime,
    val endTime: LocalDateTime,
)

data class BookingPageDto(
    val eventType: EventTypeModel,
    val slots: List<SlotDto>,
)

data class CalendarEntryDto(
    val date: LocalDate,
    val bookings: List<BookingResponse>,
)

data class ErrorDto(
    val code: Int,
    val message: String,
)
