package com.calfork.model

import java.time.LocalDateTime

data class BookingModel(
    val id: String,
    val eventTypeId: String,
    val startTime: LocalDateTime,
    val endTime: LocalDateTime,
    val bookerName: String,
    val bookerEmail: String,
    val bookerNotes: String?,
    val zoomLink: String,
    val createdAt: LocalDateTime,
)

data class BookerInfo(
    val name: String,
    val email: String,
    val notes: String?,
)

data class BookingCreate(
    val startTime: LocalDateTime,
    val endTime: LocalDateTime,
    val booker: BookerInfo,
)

data class BookingResponse(
    val id: String,
    val eventType: EventTypeModel,
    val startTime: LocalDateTime,
    val endTime: LocalDateTime,
    val booker: BookerInfo,
    val zoomLink: String,
    val createdAt: LocalDateTime,
)
