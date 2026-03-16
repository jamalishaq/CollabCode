dev:
	air

build:
	go build ./...

run:
	go run ./cmd/server

test:
	go test ./...

lint:
	go vet ./...

docker-build:
	docker build -f ../../infrastructure/docker/collaboration-service.Dockerfile -t collaboration-service:local ../../
