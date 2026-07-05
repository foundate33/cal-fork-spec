package com.calfork.model

data class AvailabilityRuleModel(
    val id: String,
    val authorId: String,
    val daysOfWeek: List<WeekDay>,
    val startTime: String,
    val endTime: String,
    val timezone: String,
)

data class AvailabilityRuleCreate(
    val daysOfWeek: List<WeekDay>,
    val startTime: String,
    val endTime: String,
    val timezone: String,
)

data class AvailabilityRuleUpdate(
    val daysOfWeek: List<WeekDay>?,
    val startTime: String?,
    val endTime: String?,
    val timezone: String?,
)
