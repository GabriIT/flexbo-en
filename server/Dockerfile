# Base image
FROM golang:1.22.5-alpine AS builder

# Set working directory
WORKDIR /app

# Install necessary packages
RUN apk add --no-cache git

# Copy go.mod and go.sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the application code
COPY . .

# Build the Go application
RUN go build -o main /app/cmd/main.go

# Stage 2: Production image
FROM alpine:latest

# Set working directory
WORKDIR /app

# Copy the compiled Go binary from the builder stage
COPY --from=builder /app/main .

# Expose the port used by the Gin server
EXPOSE 8080

# Run the application
CMD ["./main"]
