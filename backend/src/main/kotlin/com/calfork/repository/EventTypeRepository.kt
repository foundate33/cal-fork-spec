package com.calfork.repository

import com.calfork.model.EventTypeModel
import com.calfork.model.EventTypeUpdate
import org.springframework.jdbc.core.RowMapper
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository
import java.sql.ResultSet
import java.time.LocalDateTime

@Repository
class EventTypeRepository(
    private val jdbc: NamedParameterJdbcTemplate,
) {
    fun findByAuthorId(authorId: String): List<EventTypeModel> =
        jdbc.query(
            "SELECT * FROM event_types WHERE author_id = :authorId ORDER BY created_at DESC",
            MapSqlParameterSource("authorId", authorId),
            ROW_MAPPER,
        )

    fun findById(id: String): EventTypeModel? =
        jdbc.query(
            "SELECT * FROM event_types WHERE id = :id",
            MapSqlParameterSource("id", id),
            ROW_MAPPER,
        ).firstOrNull()

    fun findBySlug(slug: String): EventTypeModel? =
        jdbc.query(
            "SELECT * FROM event_types WHERE slug = :slug",
            MapSqlParameterSource("slug", slug),
            ROW_MAPPER,
        ).firstOrNull()

    fun slugExists(slug: String): Boolean =
        (
            jdbc.queryForObject(
                "SELECT COUNT(*) FROM event_types WHERE slug = :slug",
                MapSqlParameterSource("slug", slug),
                Int::class.java,
            ) ?: 0
        ) > 0

    fun slugExistsExcluding(
        slug: String,
        excludeId: String,
    ): Boolean =
        (
            jdbc.queryForObject(
                "SELECT COUNT(*) FROM event_types WHERE slug = :slug AND id != :excludeId",
                MapSqlParameterSource(mapOf("slug" to slug, "excludeId" to excludeId)),
                Int::class.java,
            ) ?: 0
        ) > 0

    fun save(model: EventTypeModel) {
        jdbc.update(
            """INSERT INTO event_types
               (id, title, description, duration_minutes, zoom_link, slug,
                author_id, booking_link, availability_rule_id, created_at, updated_at)
               VALUES (:id, :title, :description, :durationMinutes, :zoomLink, :slug,
                       :authorId, :bookingLink, :availabilityRuleId, :createdAt, :updatedAt)""",
            MapSqlParameterSource(
                mapOf(
                    "id" to model.id,
                    "title" to model.title,
                    "description" to model.description,
                    "durationMinutes" to model.durationMinutes,
                    "zoomLink" to model.zoomLink,
                    "slug" to model.slug,
                    "authorId" to model.authorId,
                    "bookingLink" to model.bookingLink,
                    "availabilityRuleId" to model.availabilityRuleId,
                    "createdAt" to model.createdAt,
                    "updatedAt" to model.updatedAt,
                ),
            ),
        )
    }

    fun update(
        id: String,
        update: EventTypeUpdate,
    ) {
        val fields = mutableListOf<String>()
        val params = mutableMapOf<String, Any?>("id" to id)

        update.title?.let {
            fields.add("title = :title")
            params["title"] = it
        }
        update.description?.let {
            fields.add("description = :description")
            params["description"] = it
        }
        update.durationMinutes?.let {
            fields.add("duration_minutes = :durationMinutes")
            params["durationMinutes"] = it
        }
        update.zoomLink?.let {
            fields.add("zoom_link = :zoomLink")
            params["zoomLink"] = it
        }

        if (fields.isNotEmpty()) {
            fields.add("updated_at = :updatedAt")
            params["updatedAt"] = LocalDateTime.now()
            jdbc.update(
                "UPDATE event_types SET ${fields.joinToString(", ")} WHERE id = :id",
                MapSqlParameterSource(params),
            )
        }
    }

    fun delete(id: String) {
        jdbc.update("DELETE FROM event_types WHERE id = :id", MapSqlParameterSource("id", id))
    }

    companion object {
        private val ROW_MAPPER =
            RowMapper { rs: ResultSet, _ ->
                EventTypeModel(
                    id = rs.getString("id"),
                    title = rs.getString("title"),
                    description = rs.getString("description"),
                    durationMinutes = rs.getInt("duration_minutes"),
                    zoomLink = rs.getString("zoom_link"),
                    slug = rs.getString("slug"),
                    authorId = rs.getString("author_id"),
                    bookingLink = rs.getString("booking_link"),
                    availabilityRuleId = rs.getString("availability_rule_id"),
                    createdAt = LocalDateTime.parse(rs.getString("created_at")),
                    updatedAt = LocalDateTime.parse(rs.getString("updated_at")),
                )
            }
    }
}
