package com.calfork.repository

import com.calfork.model.AvailabilityRuleModel
import com.calfork.model.AvailabilityRuleUpdate
import com.calfork.model.WeekDay
import org.springframework.jdbc.core.RowMapper
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository
import java.sql.ResultSet

@Repository
class AvailabilityRuleRepository(
    private val jdbc: NamedParameterJdbcTemplate,
) {
    fun findByAuthorId(authorId: String): List<AvailabilityRuleModel> =
        jdbc.query(
            "SELECT * FROM availability_rules WHERE author_id = :authorId ORDER BY start_time",
            MapSqlParameterSource("authorId", authorId),
            ROW_MAPPER,
        )

    fun findById(id: String): AvailabilityRuleModel? =
        jdbc.query(
            "SELECT * FROM availability_rules WHERE id = :id",
            MapSqlParameterSource("id", id),
            ROW_MAPPER,
        ).firstOrNull()

    fun save(model: AvailabilityRuleModel) {
        jdbc.update(
            """INSERT INTO availability_rules (id, author_id, days_of_week, start_time, end_time, timezone)
               VALUES (:id, :authorId, :daysOfWeek, :startTime, :endTime, :timezone)""",
            MapSqlParameterSource(
                mapOf(
                    "id" to model.id,
                    "authorId" to model.authorId,
                    "daysOfWeek" to model.daysOfWeek.joinToString(","),
                    "startTime" to model.startTime,
                    "endTime" to model.endTime,
                    "timezone" to model.timezone,
                ),
            ),
        )
    }

    fun update(
        id: String,
        update: AvailabilityRuleUpdate,
    ) {
        val fields = mutableListOf<String>()
        val params = mutableMapOf<String, Any?>("id" to id)

        update.daysOfWeek?.let {
            fields.add("days_of_week = :daysOfWeek")
            params["daysOfWeek"] = it.joinToString(",")
        }
        update.startTime?.let {
            fields.add("start_time = :startTime")
            params["startTime"] = it
        }
        update.endTime?.let {
            fields.add("end_time = :endTime")
            params["endTime"] = it
        }
        update.timezone?.let {
            fields.add("timezone = :timezone")
            params["timezone"] = it
        }

        if (fields.isNotEmpty()) {
            jdbc.update(
                "UPDATE availability_rules SET ${fields.joinToString(", ")} WHERE id = :id",
                MapSqlParameterSource(params),
            )
        }
    }

    fun delete(id: String) {
        jdbc.update("DELETE FROM availability_rules WHERE id = :id", MapSqlParameterSource("id", id))
    }

    companion object {
        private val ROW_MAPPER =
            RowMapper { rs: ResultSet, _ ->
                AvailabilityRuleModel(
                    id = rs.getString("id"),
                    authorId = rs.getString("author_id"),
                    daysOfWeek =
                        rs.getString("days_of_week")
                            .split(",")
                            .map { WeekDay.valueOf(it.trim()) },
                    startTime = rs.getString("start_time"),
                    endTime = rs.getString("end_time"),
                    timezone = rs.getString("timezone"),
                )
            }
    }
}
