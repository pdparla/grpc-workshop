package com.grpc.sayhi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SayHiApplication {

	public static void main(String[] args) {
		SpringApplication.run(SayHiApplication.class, args);
	}

}
