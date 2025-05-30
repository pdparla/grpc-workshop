package com.grpc.sayhi.service;

import com.grpc.sayhi.*;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.stub.StreamObserver;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.List;
import java.util.ArrayList;

@Service
public class SayHiGrpcServiceClient {

    private ManagedChannel channel;
    private SayHiServiceGrpc.SayHiServiceStub asyncStub;
    private final static String senderName = "David client";

    @PostConstruct
    public void init() {
        // Connect to the gRPC server running on the same application
        channel = ManagedChannelBuilder.forAddress("localhost", 8080)
                .usePlaintext()
                .build();
        asyncStub = SayHiServiceGrpc.newStub(channel);
    }

    @PreDestroy
    public void cleanup() {
        if (channel != null) {
            channel.shutdown();
            try {
                if (!channel.awaitTermination(5, TimeUnit.SECONDS)) {
                    channel.shutdownNow();
                }
            } catch (InterruptedException e) {
                channel.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    /**
     * CLIENT STREAMING RPC: Send multiple "hi" messages and get count response
     */
    @Scheduled(fixedRate = 60000)
    public ClientStreamResult testClientStreaming() {
        int messageCount = new Random().nextInt(5) + 1; // Random count between 1 and 5
        System.out.println("🔌 STREAMING CLIENT: Starting client streaming test with " + messageCount + " messages");

        CountDownLatch latch = new CountDownLatch(1);
        ClientStreamResult result = new ClientStreamResult();

        StreamObserver<HiCountResponse> responseObserver = new StreamObserver<HiCountResponse>() {
            @Override
            public void onNext(HiCountResponse response) {
                System.out.println("🔌 STREAMING CLIENT: Received response - " + response.getMessage());
                result.setSuccess(true);
                result.setReceivedCount(response.getReceivedCount());
                result.setMessage(response.getMessage());
            }

            @Override
            public void onError(Throwable t) {
                System.err.println("❌ STREAMING CLIENT: Error in client streaming - " + t.getMessage());
                result.setSuccess(false);
                result.setErrorMessage(t.getMessage());
                latch.countDown();
            }

            @Override
            public void onCompleted() {
                System.out.println("🔌 STREAMING CLIENT: Client streaming completed");
                latch.countDown();
            }
        };

        StreamObserver<HiRequest> requestObserver = asyncStub.clientStreamHi(responseObserver);

        try {
            // Send multiple messages
            for (int i = 1; i <= messageCount; i++) {
                HiRequest request = HiRequest.newBuilder()
                        .setMessage("hi from client #" + i)
                        .setSender(senderName)
                        .build();

                System.out.println("🔌 CLIENT: Sending message #" + i);
                requestObserver.onNext(request);

                // Small delay between messages to simulate real-world scenario
                Thread.sleep(200);
            }

            // Complete the stream
            requestObserver.onCompleted();

            // Wait for response
            if (!latch.await(10, TimeUnit.SECONDS)) {
                result.setSuccess(false);
                result.setErrorMessage("Timeout waiting for response");
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            result.setSuccess(false);
            result.setErrorMessage("Interrupted: " + e.getMessage());
        } catch (Exception e) {
            result.setSuccess(false);
            result.setErrorMessage("Error: " + e.getMessage());
        }

        return result;
    }

    /**
     * BIDIRECTIONAL STREAMING RPC: Exchange messages for a specified duration
     */
    @Scheduled(fixedRate = 60000)
    public BidirectionalStreamResult testBidirectionalStreaming() {
        int durationSeconds = 2; // Duration for the bidirectional streaming test
        System.out.println("🔌 BIDIRECTIONAL CLIENT: Starting bidirectional streaming test for " + durationSeconds + " seconds");

        CountDownLatch latch = new CountDownLatch(1);
        BidirectionalStreamResult result = new BidirectionalStreamResult();
        AtomicInteger messagesSent = new AtomicInteger(0);

        StreamObserver<HiResponse> responseObserver = new StreamObserver<HiResponse>() {
            @Override
            public void onNext(HiResponse response) {
                System.out.println("🔌 BIDIRECTIONAL CLIENT: Received - '" + response.getMessage() + "' from " + response.getSender());
                result.addReceivedMessage(response.getMessage(), response.getSender());
            }

            @Override
            public void onError(Throwable t) {
                System.err.println("❌ BIDIRECTIONAL CLIENT: Error in bidirectional streaming - " + t.getMessage());
                result.setSuccess(false);
                result.setErrorMessage(t.getMessage());
                latch.countDown();
            }

            @Override
            public void onCompleted() {
                System.out.println("🔌 BIDIRECTIONAL CLIENT: Bidirectional streaming completed");
                result.setSuccess(true);
                latch.countDown();
            }
        };

        StreamObserver<HiRequest> requestObserver = asyncStub.bidirectionalHi(responseObserver);

        try {
            // Send messages for the specified duration
            long startTime = System.currentTimeMillis();
            long endTime = startTime + (durationSeconds * 1000L);

            while (System.currentTimeMillis() < endTime) {
                int msgNum = messagesSent.incrementAndGet();
                HiRequest request = HiRequest.newBuilder()
                        .setMessage("hi from client #" + msgNum)
                        .setSender(senderName)
                        .build();

                System.out.println("🔌 BIDIRECTIONAL CLIENT: Sending message #" + msgNum);
                requestObserver.onNext(request);
                result.addSentMessage("hi from client #" + msgNum, senderName);

                // Wait between messages
                Thread.sleep(800);
            }

            // Complete the stream
            requestObserver.onCompleted();

            // Wait for completion
            if (!latch.await(10, TimeUnit.SECONDS)) {
                result.setSuccess(false);
                result.setErrorMessage("Timeout waiting for completion");
            }

            result.setMessagesSent(messagesSent.get());

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            result.setSuccess(false);
            result.setErrorMessage("Interrupted: " + e.getMessage());
        } catch (Exception e) {
            result.setSuccess(false);
            result.setErrorMessage("Error: " + e.getMessage());
        }

        return result;
    }

    // Result classes for better structured responses
    public static class ClientStreamResult {
        private boolean success;
        private int receivedCount;
        private String message;
        private String errorMessage;

        // Getters and setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public int getReceivedCount() { return receivedCount; }
        public void setReceivedCount(int receivedCount) { this.receivedCount = receivedCount; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
        public void printResult() {
            System.out.println("🔌 CLIENT: Client Stream Result - Success: " + success +
                    ", Received Count: " + receivedCount +
                    ", Message: '" + message + "'" +
                    ", Error: " + errorMessage);
        }
    }

    public static class BidirectionalStreamResult {
        private boolean success;
        private final List<HiRequest> sentMessages = new ArrayList<>();
        private final List<HiResponse> receivedMessages = new ArrayList<>();
        private int messagesSent;
        private String errorMessage;

        public void addSentMessage(String message, String sender) {
            sentMessages.add(HiRequest.newBuilder().setMessage(message).setSender(sender).build());
        }

        public void addReceivedMessage(String message, String sender) {
            receivedMessages.add(HiResponse.newBuilder().setMessage(message).setSender(sender).build());
        }

        public void setSuccess(boolean success) { this.success = success; }
        public void setMessagesSent(int messagesSent) { this.messagesSent = messagesSent; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
        public void printResult() {
            System.out.println("🔌 CLIENT: Bidirectional Stream Result - Success: " + success +
                    ", Messages Sent: " + messagesSent +
                    ", Received Messages: " + receivedMessages.size() +
                    ", Error: " + errorMessage);
            System.out.println("🔌 CLIENT: Sent Messages: " + sentMessages);
            System.out.println("🔌 CLIENT: Received Messages: " + receivedMessages);
        }
    }


}