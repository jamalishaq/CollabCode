package main

import (
	"log"
	"net/http"

	"github.com/collabcode/execution-service/internal/config"
	"github.com/collabcode/execution-service/internal/handler"
	"github.com/collabcode/execution-service/internal/middleware"
	"github.com/collabcode/execution-service/internal/repository"
	"github.com/collabcode/execution-service/internal/service"
)

func main() {
	cfg := config.Load()

	repo, err := repository.NewSandboxRepository()
	if err != nil {
		log.Fatalf("failed to initialize docker repository: %v", err)
	}

	sandboxService := service.NewSandboxService(repo, cfg.ExecutionTimeout)
	publisherService := service.NewPublisherService(cfg.QStashURL, cfg.QStashToken)
	executionService := service.NewExecutionService(sandboxService, publisherService)
	h := handler.NewHandler(executionService, cfg.MaxConcurrentExecutions)

	mux := http.NewServeMux()
	h.RegisterRoutes(mux, middleware.Auth(cfg.JWTSecret))

	root := middleware.Recovery(middleware.Logging(mux))
	log.Printf("execution-service listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, root); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
