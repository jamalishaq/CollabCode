package main

import (
	"log"
	"net/http"

	"github.com/collabcode/collaboration-service/internal/config"
	"github.com/collabcode/collaboration-service/internal/handler"
	"github.com/collabcode/collaboration-service/internal/middleware"
	"github.com/collabcode/collaboration-service/internal/repository"
	"github.com/collabcode/collaboration-service/internal/service"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	repo, err := repository.NewRedisRepository(cfg.RedisURL, cfg.PresenceTTL)
	if err != nil {
		log.Fatalf("create repository: %v", err)
	}

	svc := service.NewService(repo)
	h := handler.NewHandler(svc, cfg.JWTSecret)

	mux := http.NewServeMux()
	h.RegisterRoutes(mux)

	handlerChain := middleware.Recovery(middleware.Logging(mux))
	addr := ":" + cfg.Port
	log.Printf("collaboration-service listening on %s", addr)
	if err := http.ListenAndServe(addr, handlerChain); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
