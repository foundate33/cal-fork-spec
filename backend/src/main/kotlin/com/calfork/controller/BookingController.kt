package com.calfork.controller

import com.calfork.dto.BookingPageDto
import com.calfork.model.BookingCreate
import com.calfork.model.BookingResponse
import com.calfork.service.BookingService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@RestController
@RequestMapping("/book/{slug}")
class BookingController(
    private val service: BookingService,
) {
    @GetMapping
    fun page(
        @PathVariable slug: String,
        @RequestParam date: LocalDate? = null,
    ): BookingPageDto = service.getBookingPage(slug, date)

    @PostMapping("/book")
    @ResponseStatus(HttpStatus.CREATED)
    fun book(
        @PathVariable slug: String,
        @RequestBody body: BookingCreate,
    ): BookingResponse = service.createBooking(slug, body)
}
