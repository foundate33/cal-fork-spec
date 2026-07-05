package com.calfork.model

import java.time.LocalDateTime

data class EventTypeModel(
    val id: String,
    val title: String,
    val description: String?,
    val durationMinutes: Int,
    val zoomLink: String,
    val slug: String,
    val authorId: String,
    val bookingLink: String,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
)

data class EventTypeCreate(
    val title: String,
    val description: String?,
    val durationMinutes: Int,
    val zoomLink: String,
    val slug: String?,
)

data class EventTypeUpdate(
    val title: String?,
    val description: String?,
    val durationMinutes: Int?,
    val zoomLink: String?,
)
