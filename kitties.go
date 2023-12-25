package main

import (
	"flag"
	"log"
	"net/http"
	"github.com/gorilla/websocket"
	"crypto/tls"
)

var addr = flag.String("l", ":8443", "https service address") // Change port to 8443 for HTTPS

var REVISION = 9

func main() {
	flag.Parse()

	// Create a global list of lobbies
	lobbies := make(map[string]*Lobby)

	// Serve the client-side software
	fs := http.FileServer(http.Dir("public_html"))
	http.Handle("/", fs)

	// Handle incoming websocket connections
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handleConnections(w, r, lobbies)
	})

	// Create TLS configuration with TLS version 1.2
	tlsConfig := &tls.Config{
		MinVersion: tls.VersionTLS12,
	}

	// Start the server with TLS support
	server := &http.Server{
		Addr:      *addr,
		TLSConfig: tlsConfig,
	}

	log.Println("Now listening on", *addr)
	log.Fatal(server.ListenAndServeTLS("cert.pem", "key.pem")) // Replace cert.pem and key.pem with your SSL certificate and private key files
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all connections, adjust this according to your security needs
		return true
	},
}

// Upgrade incoming connections to websockets
func handleConnections(w http.ResponseWriter, r *http.Request, lobbies map[string]*Lobby) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}

	// Instantiate the new client object
	client := &Client{conn: conn, send: make(chan []byte, 256)}

	// Hand the client off to these goroutines which will handle all i/o
	go client.readPump(lobbies)
	go client.writePump()

	log.Println("WebSocket connection established.")
}
