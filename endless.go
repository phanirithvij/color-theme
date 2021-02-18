// +build !windows

package main

import (
	"strconv"
	"time"

	"github.com/fvbock/endless"
	"github.com/gin-gonic/gin"
)

func serve(router *gin.Engine, port int) {
	endless.DefaultReadTimeOut = time.Second * 15
	endless.DefaultWriteTimeOut = time.Second * 15
	endless.ListenAndServe(":"+strconv.Itoa(port), router)
}
