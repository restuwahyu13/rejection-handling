package main

import (
	"log"
	"net/http"
)

func unhandledRejection(w http.ResponseWriter) {
	if w != nil {
		if err := recover(); err != nil {
			log.Printf("unhandledRejection Panic: %s", err)
			w.Write([]byte("Application busy, pleas try again later!"))
		}
	}
}

func handler(server *http.ServeMux) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer unhandledRejection(w)
		server.ServeHTTP(w, r)
	})
}

func externalThirdparty() {
	panic("Application Crash")
}

func main() {
	server := http.NewServeMux()

	server.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Ping!"))
	})

	server.HandleFunc("/rejection", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			externalThirdparty()
		}
		w.Write([]byte("Ping!"))
	})

	http.ListenAndServe(":3000", handler(server))
}
