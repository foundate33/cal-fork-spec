package com.calfork.service

import com.calfork.dto.SlotDto
import com.calfork.model.EventTypeModel
import com.calfork.model.WeekDay
import com.calfork.repository.AvailabilityRuleRepository
import com.calfork.repository.BookingRepository
import org.springframework.stereotype.Service
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

@Service
class SlotService(
    private val availabilityRuleRepository: AvailabilityRuleRepository,
    private val bookingRepository: BookingRepository,
) {
    fun getSlots(
        eventType: EventTypeModel,
        date: LocalDate,
    ): List<SlotDto> {
        val dayOfWeek = mapDayOfWeek(date.dayOfWeek)

        val rule = availabilityRuleRepository.findById(eventType.availabilityRuleId) ?: return emptyList()
        if (dayOfWeek !in rule.daysOfWeek) return emptyList()

        val existingBookings = bookingRepository.findByEventTypeIdAndDate(eventType.id, date)
        val now = LocalDateTime.now()
        val isToday = date == now.toLocalDate()

        return generateSlotsForRule(rule, eventType.durationMinutes, date, existingBookings, isToday, now)
            .sortedBy { it.startTime }
    }

    private fun generateSlotsForRule(
        rule: com.calfork.model.AvailabilityRuleModel,
        durationMinutes: Int,
        date: LocalDate,
        existingBookings: List<com.calfork.model.BookingModel>,
        isToday: Boolean,
        now: LocalDateTime,
    ): List<SlotDto> {
        val startParts = rule.startTime.split(":")
        val endParts = rule.endTime.split(":")

        var slotStart = LocalDateTime.of(date, LocalTime.of(startParts[0].toInt(), startParts[1].toInt()))
        val slotEndLimit = LocalDateTime.of(date, LocalTime.of(endParts[0].toInt(), endParts[1].toInt()))

        val slots = mutableListOf<SlotDto>()

        while (slotStart.plusMinutes(durationMinutes.toLong()) <= slotEndLimit) {
            val slotEnd = slotStart.plusMinutes(durationMinutes.toLong())

            val isOverlapping =
                existingBookings.any { booking ->
                    slotStart < booking.endTime && slotEnd > booking.startTime
                }
            val isPast = isToday && slotEnd <= now

            if (!isOverlapping && !isPast) {
                slots.add(SlotDto(startTime = slotStart, endTime = slotEnd))
            }

            slotStart = slotEnd
        }

        return slots
    }

    private fun mapDayOfWeek(day: DayOfWeek): WeekDay =
        when (day) {
            DayOfWeek.MONDAY -> WeekDay.MONDAY
            DayOfWeek.TUESDAY -> WeekDay.TUESDAY
            DayOfWeek.WEDNESDAY -> WeekDay.WEDNESDAY
            DayOfWeek.THURSDAY -> WeekDay.THURSDAY
            DayOfWeek.FRIDAY -> WeekDay.FRIDAY
            DayOfWeek.SATURDAY -> WeekDay.SATURDAY
            DayOfWeek.SUNDAY -> WeekDay.SUNDAY
        }
}
