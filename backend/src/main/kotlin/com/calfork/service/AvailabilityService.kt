package com.calfork.service

import com.calfork.exception.NotFoundException
import com.calfork.model.AvailabilityRuleCreate
import com.calfork.model.AvailabilityRuleModel
import com.calfork.model.AvailabilityRuleUpdate
import com.calfork.repository.AvailabilityRuleRepository
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class AvailabilityService(
    private val repository: AvailabilityRuleRepository,
) {
    fun list(authorId: String): List<AvailabilityRuleModel> = repository.findByAuthorId(authorId)

    fun create(
        request: AvailabilityRuleCreate,
        authorId: String,
    ): AvailabilityRuleModel {
        val model =
            AvailabilityRuleModel(
                id = UUID.randomUUID().toString(),
                authorId = authorId,
                daysOfWeek = request.daysOfWeek,
                startTime = request.startTime,
                endTime = request.endTime,
                timezone = request.timezone,
            )
        repository.save(model)
        return model
    }

    fun update(
        ruleId: String,
        request: AvailabilityRuleUpdate,
        authorId: String,
    ): AvailabilityRuleModel {
        val existing =
            repository.findById(ruleId)
                ?: throw NotFoundException("Availability rule not found")
        if (existing.authorId != authorId) throw NotFoundException("Availability rule not found")
        repository.update(ruleId, request)
        return repository.findById(ruleId)!!
    }

    fun delete(
        ruleId: String,
        authorId: String,
    ) {
        val existing =
            repository.findById(ruleId)
                ?: throw NotFoundException("Availability rule not found")
        if (existing.authorId != authorId) throw NotFoundException("Availability rule not found")
        repository.delete(ruleId)
    }
}
