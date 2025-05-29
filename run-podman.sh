#!/bin/bash

# gRPC Workshop - Pure Podman Commands (No Compose)
set -e

echo "🚀 Starting gRPC Workshop with native Podman commands..."

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up..."
    podman stop grpc-service envoy-proxy frontend 2>/dev/null || true
    podman rm grpc-service envoy-proxy frontend 2>/dev/null || true
}

# Set trap for cleanup on exit
trap cleanup EXIT

# Create network
echo "🌐 Creating network..."
podman network exists grpc-network || podman network create grpc-network

# # Generate proto files
# echo "⚙️  Generating proto files..."
# if [ -d "front" ] && [ -f "front/package.json" ]; then
#     cd front
#     npm install
#     npm run generate-proto
#     cd ..
# fi

# if [ -d "back-hi" ] && [ -f "back-hi/pom.xml" ]; then
#     cd back-hi
#     ./mvnw clean package -DskipTests
#     cd ..
# fi

# Build Spring Boot gRPC service
echo "🏗️  Building Spring Boot gRPC service..."
#podman build -t sayhi-grpc-service ./back-hi

# # Build Angular frontend
echo "🏗️  Building Angular frontend..."
#podman build -t sayhi-frontend ./front

# Start Spring Boot gRPC service
echo "🚀 Starting gRPC service..."
podman run -d \
    --name grpc-service \
    --network grpc-network \
    -p 8080:8080 \
    sayhi-grpc-service

# Wait for gRPC service to start
echo "⏳ Waiting for gRPC service..."
sleep 5

# Start Envoy proxy
echo "🚀 Starting Envoy proxy..."
podman run -d \
    --name envoy-proxy \
    --network grpc-network \
    -p 8081:8081 \
    -p 9901:9901 \
    -e ENVOY_UID=0 \
    -v ./envoy.yaml:/etc/envoy/envoy.yaml:ro \
    docker.io/envoyproxy/envoy:v1.28-latest \
    /usr/local/bin/envoy -c /etc/envoy/envoy.yaml -l info

# Wait for Envoy to start
echo "⏳ Waiting for Envoy proxy..."
sleep 10

# Start Angular frontend
echo "🚀 Starting Angular frontend..."
podman run -d \
    --name frontend \
    --network grpc-network \
    -p 4200:80 \
    sayhi-frontend

echo "✅ All services started!"
echo ""
echo "📊 Service URLs:"
echo "  🔧 Spring Boot gRPC: grpc://localhost:8080"
echo "  🌐 Envoy gRPC-Web: http://localhost:8081"
echo "  📊 Envoy Admin: http://localhost:9901"
echo "  🖥️  Angular App: http://localhost:4200"
echo ""
echo "🔍 To view logs:"
echo "  podman logs -f grpc-service"
echo "  podman logs -f envoy-proxy"
echo "  podman logs -f frontend"
echo ""
echo "🛑 To stop all services:"
echo "  podman stop grpc-service envoy-proxy frontend"
echo "  podman rm grpc-service envoy-proxy frontend"
echo ""

# Keep script running and show logs
read -p "🔍 Show logs? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📝 Showing all logs (Ctrl+C to exit)..."
    podman logs -f grpc-service &
    podman logs -f envoy-proxy &
    podman logs -f frontend &
    wait
fi