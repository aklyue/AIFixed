FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod go.mod
COPY go.sum go.sum
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /app/bin/server ./cmd/server/main.go

FROM alpine:3.19

WORKDIR /code

RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /app/bin/server /code/server

RUN mkdir -p /code/tmp

EXPOSE 8080

CMD ["/code/server"]