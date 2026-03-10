package main

import (
	"log"
	"net/http"

	"github.com/collabcode/execution-service/internal/config"
	"github.com/collabcode/execution-service/internal/handler"
	"github.com/collabcode/execution-service/internal/repository"
	"github.com/collabcode/execution-service/internal/service"
)

// main wires dependencies and starts the HTTP server.
func main() {
	cfg := config.Load()
	repo := repository.NewRepository(cfg)
	svc := service.NewService(repo)
	h := handler.NewHandler(svc)

	mux := http.NewServeMux()
	h.RegisterRoutes(mux)

	if err := http.ListenAndServe(":"+cfg.Port, mux); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
