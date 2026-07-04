package com.calfork

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class CalForkApplication

fun main(vararg args: String) {
    runApplication<CalForkApplication>(*args)
}
