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
	docker build -f ../../infrastructure/docker/execution-service.Dockerfile -t execution-service:local ../../
