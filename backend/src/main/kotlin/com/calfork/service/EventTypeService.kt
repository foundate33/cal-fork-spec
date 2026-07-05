package com.calfork.service

import com.calfork.exception.ConflictException
import com.calfork.exception.NotFoundException
import com.calfork.model.EventTypeCreate
import com.calfork.model.EventTypeModel
import com.calfork.model.EventTypeUpdate
import com.calfork.repository.AvailabilityRuleRepository
import com.calfork.repository.BookingRepository
import com.calfork.repository.EventTypeRepository
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.util.UUID

@Service
class EventTypeService(
    private val repository: EventTypeRepository,
    private val bookingRepository: BookingRepository,
    private val availabilityRuleRepository: AvailabilityRuleRepository,
    private val availabilityService: AvailabilityService,
) {
    fun list(authorId: String): List<EventTypeModel> = repository.findByAuthorId(authorId)

    fun get(
        id: String,
        authorId: String,
    ): EventTypeModel {
        val eventType =
            repository.findById(id)
                ?: throw NotFoundException("Event type not found")
        if (eventType.authorId != authorId) throw NotFoundException("Event type not found")
        return eventType
    }

    fun create(
        request: EventTypeCreate,
        authorId: String,
    ): EventTypeModel {
        val ruleId = request.availabilityRuleId ?: availabilityService.getOrCreateDefault(authorId).id
        val rule =
            availabilityRuleRepository.findById(ruleId)
                ?: throw NotFoundException("Availability rule not found")
        if (rule.authorId != authorId) throw NotFoundException("Availability rule not found")

        val slug = generateSlug(request.title)
        if (repository.slugExists(slug)) {
            throw ConflictException("Slug already exists: $slug")
        }
        val now = LocalDateTime.now()
        val model =
            EventTypeModel(
                id = UUID.randomUUID().toString(),
                title = request.title,
                description = request.description,
                durationMinutes = request.durationMinutes,
                zoomLink = request.zoomLink,
                slug = slug,
                authorId = authorId,
                bookingLink = "/book/$slug",
                availabilityRuleId = ruleId,
                createdAt = now,
                updatedAt = now,
            )
        repository.save(model)
        return model
    }

    fun update(
        id: String,
        request: EventTypeUpdate,
        authorId: String,
    ): EventTypeModel {
        val existing =
            repository.findById(id)
                ?: throw NotFoundException("Event type not found")
        if (existing.authorId != authorId) throw NotFoundException("Event type not found")
        repository.update(id, request)
        return repository.findById(id)!!
    }

    fun delete(
        id: String,
        authorId: String,
    ) {
        val existing =
            repository.findById(id)
                ?: throw NotFoundException("Event type not found")
        if (existing.authorId != authorId) throw NotFoundException("Event type not found")
        bookingRepository.deleteByEventTypeId(id)
        repository.delete(id)
    }

    private fun generateSlug(title: String): String {
        var slug =
            title.lowercase()
                .replace(Regex("[^a-z0-9\\s-]"), "")
                .replace(Regex("[\\s-]+"), "-")
                .trim('-')
        if (slug.isBlank()) slug = "event"
        var candidate = slug
        var counter = 1
        while (repository.slugExists(candidate)) {
            candidate = "$slug-$counter"
            counter++
        }
        return candidate
    }
}
