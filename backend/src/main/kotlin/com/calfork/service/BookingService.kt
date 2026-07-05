package com.calfork.service

import com.calfork.dto.BookingPageDto
import com.calfork.exception.ConflictException
import com.calfork.exception.NotFoundException
import com.calfork.model.BookerInfo
import com.calfork.model.BookingCreate
import com.calfork.model.BookingModel
import com.calfork.model.BookingResponse
import com.calfork.repository.BookingRepository
import com.calfork.repository.EventTypeRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.UUID

@Service
class BookingService(
    private val eventTypeRepository: EventTypeRepository,
    private val bookingRepository: BookingRepository,
    private val slotService: SlotService,
) {
    fun getBookingPage(slug: String): BookingPageDto {
        val eventType =
            eventTypeRepository.findBySlug(slug)
                ?: throw NotFoundException("Event type not found: $slug")
        val now = LocalDateTime.now()
        val slots = slotService.getSlots(eventType, now.toLocalDate())
        return BookingPageDto(eventType = eventType, slots = slots)
    }

    @Transactional
    fun createBooking(
        slug: String,
        request: BookingCreate,
    ): BookingResponse {
        val eventType =
            eventTypeRepository.findBySlug(slug)
                ?: throw NotFoundException("Event type not found: $slug")

        val date = request.startTime.toLocalDate()
        val existingBookings = bookingRepository.findByAuthorIdAndDate(eventType.authorId, date)

        val isOverlapping =
            existingBookings.any { booking ->
                request.startTime < booking.endTime && request.endTime > booking.startTime
            }
        if (isOverlapping) {
            throw ConflictException("This time slot is already booked")
        }

        val now = LocalDateTime.now()
        val booking =
            BookingModel(
                id = UUID.randomUUID().toString(),
                eventTypeId = eventType.id,
                startTime = request.startTime,
                endTime = request.endTime,
                bookerName = request.booker.name,
                bookerEmail = request.booker.email,
                bookerNotes = request.booker.notes,
                zoomLink = eventType.zoomLink,
                createdAt = now,
            )
        bookingRepository.save(booking)

        return BookingResponse(
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
}
