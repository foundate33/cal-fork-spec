package com.calfork

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.context.ApplicationContext
import org.springframework.http.HttpStatus
import org.springframework.test.context.ActiveProfiles

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class CalForkApplicationTests {
    @Autowired
    private lateinit var context: ApplicationContext

    @Autowired
    private lateinit var rest: TestRestTemplate

    @Test
    fun contextLoads() {
        assertThat(context).isNotNull
    }

    @Test
    fun actuatorInfoReturns200() {
        val entity = rest.getForEntity("/actuator/info", String::class.java)
        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
    }
}
