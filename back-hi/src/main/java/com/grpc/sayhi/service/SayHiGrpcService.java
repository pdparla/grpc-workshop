package com.grpc.sayhi.service;

import com.grpc.sayhi.*;
import io.grpc.stub.StreamObserver;
import org.springframework.grpc.server.service.GrpcService;
import org.springframework.stereotype.Service;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@GrpcService
@Service
public class SayHiGrpcService extends SayHiServiceGrpc.SayHiServiceImplBase {

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(10);

    /**
     * 1. UNARY RPC: Simple request-response
     * Client sends "hi" → Server responds "hi"
     */
    @Override
    public void sayHi(HiRequest request, StreamObserver<HiResponse> responseObserver) {
        System.out.println("🔄 UNARY: Received '" + request.getMessage() + "' from " + request.getSender());

        HiResponse response = HiResponse.newBuilder()
                .setMessage("hi")
                .setSender("server")
                .build();

        System.out.println("🔄 UNARY: Responding 'hi' to " + request.getSender());

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    /**
     * 2. CLIENT STREAMING RPC: Multiple requests → Single response
     * Client sends multiple "hi" messages → Server counts and responds
     */
    @Override
    public StreamObserver<HiRequest> clientStreamHi(StreamObserver<HiCountResponse> responseObserver) {
        System.out.println("📥 CLIENT STREAMING: Starting to receive hi messages...");

        return new StreamObserver<HiRequest>() {
            private final AtomicInteger count = new AtomicInteger(0);
            private String clientName = "";

            @Override
            public void onNext(HiRequest request) {
                clientName = request.getSender();
                int currentCount = count.incrementAndGet();
                System.out.println("📥 CLIENT STREAMING: Received #" + currentCount + " '" +
                        request.getMessage() + "' from " + request.getSender());
            }

            @Override
            public void onError(Throwable throwable) {
                System.err.println("❌ CLIENT STREAMING: Error - " + throwable.getMessage());
            }

            @Override
            public void onCompleted() {
                int finalCount = count.get();
                System.out.println("📥 CLIENT STREAMING: Completed! Received " + finalCount + " messages");

                HiCountResponse response = HiCountResponse.newBuilder()
                        .setReceivedCount(finalCount)
                        .setMessage("Server received " + finalCount + " hi messages from " + clientName)
                        .build();

                responseObserver.onNext(response);
                responseObserver.onCompleted();
            }
        };
    }

    /**
     * 3. SERVER STREAMING RPC: Single request → Multiple responses
     * Client requests N messages → Server sends N "hi" messages
     */
    @Override
    public void serverStreamHi(HiCountRequest request, StreamObserver<HiResponse> responseObserver) {
        int count = Math.min(Math.max(request.getCount(), 1), 5); // Limit 1-5
        System.out.println("📤 SERVER STREAMING: Sending " + count + " hi messages to " + request.getSender());

        for (int i = 1; i <= count; i++) {
            HiResponse response = HiResponse.newBuilder()
                    .setMessage("hi #" + i)
                    .setSender("server")
                    .build();

            System.out.println("📤 SERVER STREAMING: Sending #" + i + " 'hi' to " + request.getSender());
            responseObserver.onNext(response);

            // Add small delay to make streaming visible
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        System.out.println("📤 SERVER STREAMING: Completed sending " + count + " messages");
        responseObserver.onCompleted();
    }

    /**
     * 4. BIDIRECTIONAL STREAMING RPC: Multiple requests ↔ Multiple responses
     * For 2 seconds, every "hi" received triggers a "hi" response
     */
    @Override
    public StreamObserver<HiRequest> bidirectionalHi(StreamObserver<HiResponse> responseObserver) {
        System.out.println("🔄 BIDIRECTIONAL: Starting 2-second hi exchange...");

        return new StreamObserver<HiRequest>() {
            private final AtomicInteger messageCount = new AtomicInteger(0);
            private volatile boolean isActive = true;
            private String clientName = "";

            {
                // Auto-close after 2 seconds
                scheduler.schedule(() -> {
                    if (isActive) {
                        System.out.println("🔄 BIDIRECTIONAL: 2 seconds elapsed, closing stream");
                        isActive = false;
                        responseObserver.onCompleted();
                    }
                }, 2, TimeUnit.SECONDS);
            }

            @Override
            public void onNext(HiRequest request) {
                if (!isActive) return;

                clientName = request.getSender();
                int msgNum = messageCount.incrementAndGet();
                System.out.println("🔄 BIDIRECTIONAL: Received #" + msgNum + " '" +
                        request.getMessage() + "' from " + clientName);

                // Respond immediately with "hi"
                HiResponse response = HiResponse.newBuilder()
                        .setMessage("hi back #" + msgNum)
                        .setSender("server")
                        .build();

                System.out.println("🔄 BIDIRECTIONAL: Responding #" + msgNum + " 'hi back' to " + clientName);
                responseObserver.onNext(response);
            }

            @Override
            public void onError(Throwable throwable) {
                System.err.println("❌ BIDIRECTIONAL: Error - " + throwable.getMessage());
                isActive = false;
            }

            @Override
            public void onCompleted() {
                System.out.println("🔄 BIDIRECTIONAL: Client completed, processed " + messageCount.get() + " messages");
                if (isActive) {
                    isActive = false;
                    responseObserver.onCompleted();
                }
            }
        };
    }
}
