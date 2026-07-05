package com.calfork.service

import com.calfork.dto.CalendarEntryDto
import com.calfork.model.BookerInfo
import com.calfork.model.BookingResponse
import com.calfork.repository.BookingRepository
import com.calfork.repository.EventTypeRepository
import org.springframework.stereotype.Service
import java.time.LocalDate

@Service
class CalendarService(
    private val eventTypeRepository: EventTypeRepository,
    private val bookingRepository: BookingRepository,
) {
    fun getCalendar(
        authorId: String,
        startDate: LocalDate,
        endDate: LocalDate,
    ): List<CalendarEntryDto> {
        println("trigger release")
        val eventTypes = eventTypeRepository.findByAuthorId(authorId).associateBy { it.id }
        if (eventTypes.isEmpty()) return emptyList()

        val bookings = bookingRepository.findByEventTypeIdsAndDateRange(eventTypes.keys, startDate, endDate)

        val bookingResponses =
            bookings.map { booking ->
                val eventType =
                    eventTypes[booking.eventTypeId]
                        ?: throw IllegalStateException("Booking ${booking.id} references missing event type ${booking.eventTypeId}")
                BookingResponse(
                    id = booking.id,
                    eventType = eventType,
                    startTime = booking.startTime,
                    endTime = booking.endTime,
                    booker =
                        BookerInfo(
                            name = booking.bookerName,
                            email = booking.bookerEmail,
                            notes = booking.bookerNotes,
                        ),
                    zoomLink = booking.zoomLink,
                    createdAt = booking.createdAt,
                )
            }

        return bookingResponses
            .groupBy { it.startTime.toLocalDate() }
            .map { (date, bookings) -> CalendarEntryDto(date = date, bookings = bookings) }
            .sortedBy { it.date }
    }
}
