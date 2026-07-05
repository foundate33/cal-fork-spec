package com.calfork.model

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue

enum class WeekDay(private val key: String) {
    MONDAY("monday"),
    TUESDAY("tuesday"),
    WEDNESDAY("wednesday"),
    THURSDAY("thursday"),
    FRIDAY("friday"),
    SATURDAY("saturday"),
    SUNDAY("sunday"),
    ;

    @JsonValue
    fun toJson(): String = key

    companion object {
        @JsonCreator
        fun fromJson(value: String): WeekDay = entries.first { it.key == value }
    }
}
