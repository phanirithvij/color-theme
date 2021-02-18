// Package serve serves the server
package main

import (
	"compress/gzip"
	"embed"
	"encoding/hex"
	"fmt"
	"io/fs"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path"
	"strconv"
	"time"

	"github.com/NYTimes/gziphandler"
	"github.com/didip/tollbooth/v6"
	"github.com/didip/tollbooth/v6/limiter"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-contrib/sessions/redis"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// LimitHandler gin rate limiter
func LimitHandler(lmt *limiter.Limiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		httpError := tollbooth.LimitByRequest(lmt, c.Writer, c.Request)
		if httpError != nil {
			c.Data(httpError.StatusCode, lmt.GetMessageContentType(), []byte(httpError.Message))
			c.Abort()
		} else {
			c.Next()
		}
	}
}

const (
	clientBaseURL  = "/app"
	clientAssetDir = "client/build"
)

//go:embed client/build LICENSE
var clientAssets embed.FS

func main() {
	fmt.Println(fs.Glob(clientAssets, "*"))
	fs.WalkDir(clientAssets, ".", func(path string, d fs.DirEntry, err error) error {
		// inf, _ := d.Info()
		// , d.Name(), inf.Name(), err
		fmt.Println(path)
		return err
	})
	Serve(5000, true)
}

// Serve A function which serves the server
func Serve(port int, debug bool) {
	if debug {
		log.SetFlags(log.Ltime | log.Lshortfile)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}
	// TODO db = gorm.db
	// Migrate the schema

	router := gin.Default()
	setupSessionStore(router)

	// https://stackoverflow.com/a/55854101/8608146
	// https://github.com/gin-gonic/gin/issues/293#issuecomment-103659145
	// https://create-react-app.dev/docs/adding-custom-environment-variables/

	// https://github.com/gorilla/mux#serving-single-page-applications

	clientSPA := &spaHandler{
		staticPath: clientAssetDir,
		indexPath:  clientAssetDir + "/index.html",
	}

	gh, err := gziphandler.NewGzipLevelHandler(gzip.BestCompression)
	if err != nil {
		log.Fatal(err)
	}

	clientGzHandler := gh(clientSPA)
	clientCacheH := http.StripPrefix(clientBaseURL, cache(clientGzHandler, clientAssetDir))
	router.GET(clientBaseURL, gin.WrapH(clientCacheH))
	router.GET(clientBaseURL+"/*w", gin.WrapH(clientCacheH))

	promH := promhttp.Handler()
	lmt := tollbooth.NewLimiter(3, nil)
	rateF := LimitHandler(lmt)
	router.GET("/metrics", rateF, gin.WrapH(promH))

	serve(router, port)
}

type spaHandler struct {
	staticPath string
	indexPath  string
}

func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// get the absolute path to prevent directory traversal
	// TODO check if path has .. i.e relative routes and ban IP
	// https://github.com/mrichman/godnsbl
	// https://github.com/jpillora/ipfilter
	// github.com/didip/tollbooth/v6

	// prepend the path with the path to the static directory
	path := path.Join(h.staticPath, r.URL.Path)

	// redirect /app/ to /app i.e. remove trailing slash
	// this is safe becuase spa apps have no post requests in this route
	if r.URL.Path == "/" {
		w.WriteHeader(http.StatusMovedPermanently)
		w.Header().Set("Location", clientBaseURL)
		return
	}

	// check whether a file exists at the given path
	_, err := clientAssets.Open(path)
	if err != nil || r.URL.Path == "" {
		// file does not exist or / so serve index.html
		log.Println(err)
		file, err := clientAssets.Open(h.indexPath)
		if err != nil {
			http.Error(w, "file "+r.URL.Path+" does not exist", http.StatusNotFound)
			log.Println(err)
			return
		}
		// lw := lhWriter{w}
		lw := w
		// r.URL.Path += "/index.html"
		cont, err := ioutil.ReadAll(file)
		if err != nil {
			lw.WriteHeader(http.StatusNotFound)
			lw.Write([]byte("File not found"))
			log.Println(err)
			return
		}
		lw.Header().Set("Content-Type", "text/html")
		lw.Write(cont)
		log.Println(err)
		return
	}

	// otherwise, use http.FileServer to serve the static dir
	r.URL.Path = path
	http.FileServer(http.FS(clientAssets)).ServeHTTP(w, r)
}

var (
	// server start time
	serverStart    = time.Now()
	serverStartStr = serverStart.Format(http.TimeFormat)
	expireDur      = time.Minute * 10
	expire         = serverStart.Add(expireDur)
	expireStr      = expire.Format(http.TimeFormat)
)

// https://medium.com/@matryer/the-http-handler-wrapper-technique-in-golang-updated-bc7fbcffa702

// cache caching the public directory
func cache(h http.Handler, assetDir string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fname := r.URL.Path
		if r.URL.Path == "" || r.URL.Path == "/" {
			fname = "index.html"
		}
		fi, err := clientAssets.Open(path.Join(assetDir, fname))
		if err != nil {
			// spa route eg. /web/about
			// let spa handle it, no need to cache
			log.Println(err)
			h.ServeHTTP(w, r)
			return
		}

		inf, err := fi.Stat()
		if err != nil {
			// spa route eg. /web/about
			// let spa handle it, no need to cache
			log.Println(err)
			h.ServeHTTP(w, r)
			return
		}

		modTime := inf.ModTime()

		fhex := hex.EncodeToString([]byte(fname))
		fmodTH := hex.EncodeToString([]byte(strconv.FormatInt(modTime.Unix(), 10)))
		etagH := fhex + "." + fmodTH

		etag := r.Header.Get("If-None-Match")
		if etag != "" && etag == etagH {
			w.WriteHeader(http.StatusNotModified)
			w.Header().Set("Cache-Control", "public, max-age="+strconv.FormatInt(int64(expireDur.Seconds()), 10))
			w.Header().Set("Expires", expireStr)
			w.Header().Set("Etag", etagH)
			return
		}

		// https://stackoverflow.com/a/48876760/8608146

		w.Header().Set("Cache-Control", "public, max-age="+strconv.FormatInt(int64(expireDur.Seconds()), 10))
		w.Header().Set("Expires", expireStr)
		w.Header().Set("Etag", etagH)

		// forward
		h.ServeHTTP(w, r)
	})
}

type lhWriter struct {
	w http.ResponseWriter
}

func (w lhWriter) Write(b []byte) (int, error) {
	log.Println(string(b))
	return w.w.Write(b)
}

func (w lhWriter) WriteHeader(code int) {
	w.w.WriteHeader(code)
}

func (w lhWriter) Header() http.Header {
	return w.w.Header()
}

func setupSessionStore(r *gin.Engine) sessions.Store {
	secretKey := os.Getenv("SESSION_SECRET")
	if secretKey == "" {
		// https://randomkeygen.com/
		secretKey = "%[+D&ZPkJ5,ib3O1$&ZUwc_Ck?b3;?"
	}
	bsk := []byte(secretKey)
	// https://github.com/gin-contrib/sessions#redis
	// https://github.com/boj/redistore/blob/cd5dcc76aeff9ba06b0a924829fe24fd69cdd517/redistore.go#L155
	// size: maximum number of idle connections.
	store, err := redis.NewStore(10, "tcp", "localhost:6379", "", bsk)
	if err != nil {
		log.Println(err)
		log.Println("[WARNING] Redis not available so using cookie sessions")
		store = cookie.NewStore(bsk)
	}
	// https://github.com/gin-contrib/sessions#multiple-sessions
	sessionNames := []string{"client"}
	r.Use(sessions.SessionsMany(sessionNames, store))
	return store
}
