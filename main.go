package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"sync"
)

type Todo struct {
	ID   int    `json:"id"`
	Task string `json:"task"`
	Done bool   `json:"done"`
}

var (
	todos  []Todo
	nextID = 1
	mu     sync.Mutex
)

func main() {

	port := os.Getenv("PORT")

	if port == "" {
    // Default to port 3000 if not set
    port = "8081"
  }

	http.HandleFunc("/todos", todosHandler)
	log.Printf("Starting server on port %s...", port)

  err := http.ListenAndServe(":"+port, nil)
  if err != nil {
    log.Fatalf("Error starting server: %v", err)
  }
}

func todosHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method == http.MethodGet {
		mu.Lock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(todos)
		mu.Unlock()
		return
	}
	if r.Method == http.MethodPost {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, `{"error":"Failed to read request body"}`, http.StatusBadRequest)
			return
		}
		var data struct {
			Task string `json:"task"`
		}
		if err := json.Unmarshal(body, &data); err != nil || data.Task == "" {
			http.Error(w, `{"error":"Invalid task"}`, http.StatusBadRequest)
			return
		}
		mu.Lock()
		todo := Todo{
			ID:   nextID,
			Task: data.Task,
			Done: false,
		}
		todos = append(todos, todo)
		nextID++
		mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(todo)
		return
	}
	http.Error(w, `{"error":"Not found"}`, http.StatusNotFound)
}