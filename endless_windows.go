package main

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// On windows endless library will not build so we use normal http server
func serve(router *gin.Engine, port int) {
	log.Println("Serving on Port", port)
	if err := http.ListenAndServe(":"+strconv.Itoa(port), router); err != nil {
		if errors.Is(http.ErrServerClosed, err) {
			return
		}
		log.Panicln(fmt.Errorf("unable to listen: %s", err))
	}
}
