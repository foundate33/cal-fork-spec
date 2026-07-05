package com.calfork.exception

import com.calfork.dto.ErrorDto
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MissingRequestHeaderException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler

class NotFoundException(message: String) : RuntimeException(message)

class ConflictException(message: String) : RuntimeException(message)

@ControllerAdvice
class GlobalExceptionHandler {
    @ExceptionHandler(NotFoundException::class)
    fun handleNotFound(e: NotFoundException): ResponseEntity<ErrorDto> =
        ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ErrorDto(code = 404, message = e.message ?: "Not found"))

    @ExceptionHandler(ConflictException::class)
    fun handleConflict(e: ConflictException): ResponseEntity<ErrorDto> =
        ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ErrorDto(code = 409, message = e.message ?: "Conflict"))

    @ExceptionHandler(MissingRequestHeaderException::class)
    fun handleMissingHeader(e: MissingRequestHeaderException): ResponseEntity<ErrorDto> =
        ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ErrorDto(code = 400, message = "Missing required header: ${e.headerName}"))

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleBadRequest(e: IllegalArgumentException): ResponseEntity<ErrorDto> =
        ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ErrorDto(code = 400, message = e.message ?: "Bad request"))

    @ExceptionHandler(Exception::class)
    fun handleGeneric(e: Exception): ResponseEntity<ErrorDto> =
        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorDto(code = 500, message = "Internal server error"))
}
