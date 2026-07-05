package com.calfork.repository

import com.calfork.model.BookingModel
import org.springframework.jdbc.core.RowMapper
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository
import java.sql.ResultSet
import java.time.LocalDate
import java.time.LocalTime

@Repository
class BookingRepository(
    private val jdbc: NamedParameterJdbcTemplate,
) {
    fun findByEventTypeIdAndDate(
        eventTypeId: String,
        date: LocalDate,
    ): List<BookingModel> {
        val startOfDay = date.atStartOfDay()
        val endOfDay = date.atTime(LocalTime.MAX)
        return jdbc.query(
            """SELECT * FROM bookings
               WHERE event_type_id = :eventTypeId
               AND start_time >= :startOfDay
               AND start_time <= :endOfDay
               ORDER BY start_time""",
            MapSqlParameterSource(
                mapOf(
                    "eventTypeId" to eventTypeId,
                    "startOfDay" to startOfDay,
                    "endOfDay" to endOfDay,
                ),
            ),
            ROW_MAPPER,
        )
    }

    fun findByEventTypeIdsAndDateRange(
        eventTypeIds: Set<String>,
        startDate: LocalDate,
        endDate: LocalDate,
    ): List<BookingModel> {
        if (eventTypeIds.isEmpty()) return emptyList()
        val startOfDay = startDate.atStartOfDay()
        val endOfNextDay = endDate.plusDays(1).atStartOfDay()
        return jdbc.query(
            """SELECT * FROM bookings
               WHERE event_type_id IN (:eventTypeIds)
               AND start_time >= :startDate
               AND start_time < :endDate
               ORDER BY start_time""",
            MapSqlParameterSource(
                mapOf(
                    "eventTypeIds" to eventTypeIds,
                    "startDate" to startOfDay,
                    "endDate" to endOfNextDay,
                ),
            ),
            ROW_MAPPER,
        )
    }

    fun deleteByEventTypeId(eventTypeId: String) {
        jdbc.update(
            "DELETE FROM bookings WHERE event_type_id = :eventTypeId",
            MapSqlParameterSource("eventTypeId", eventTypeId),
        )
    }

    fun save(model: BookingModel) {
        jdbc.update(
            """INSERT INTO bookings (id, event_type_id, start_time, end_time, booker_name, booker_email, booker_notes, zoom_link, created_at)
               VALUES (:id, :eventTypeId, :startTime, :endTime, :bookerName, :bookerEmail, :bookerNotes, :zoomLink, :createdAt)""",
            MapSqlParameterSource(
                mapOf(
                    "id" to model.id,
                    "eventTypeId" to model.eventTypeId,
                    "startTime" to model.startTime,
                    "endTime" to model.endTime,
                    "bookerName" to model.bookerName,
                    "bookerEmail" to model.bookerEmail,
                    "bookerNotes" to model.bookerNotes,
                    "zoomLink" to model.zoomLink,
                    "createdAt" to model.createdAt,
                ),
            ),
        )
    }

    companion object {
        private val ROW_MAPPER =
            RowMapper { rs: ResultSet, _ ->
                BookingModel(
                    id = rs.getString("id"),
                    eventTypeId = rs.getString("event_type_id"),
                    startTime = rs.getTimestamp("start_time").toLocalDateTime(),
                    endTime = rs.getTimestamp("end_time").toLocalDateTime(),
                    bookerName = rs.getString("booker_name"),
                    bookerEmail = rs.getString("booker_email"),
                    bookerNotes = rs.getString("booker_notes"),
                    zoomLink = rs.getString("zoom_link"),
                    createdAt = rs.getTimestamp("created_at").toLocalDateTime(),
                )
            }
    }
}
