// Package serve serves the server
package main

import (
	"compress/gzip"
	"encoding/hex"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/NYTimes/gziphandler"
	"github.com/didip/tollbooth/v6"
	"github.com/didip/tollbooth/v6/limiter"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-contrib/sessions/redis"
	"github.com/gin-gonic/gin"
	"github.com/markbates/pkger"
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
	clientAssetDir = "/client/build"
)

func init() {
	// TODO remove pkger user go's embed
	pkger.Include("/client/build")
}

func main() {
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

	amdinSPA := &spaHandler{
		staticPath: clientAssetDir,
		indexPath:  clientAssetDir + "/index.html",
	}

	gh, err := gziphandler.NewGzipLevelHandler(gzip.BestCompression)
	if err != nil {
		log.Fatal(err)
	}

	adminGzHandler := gh(amdinSPA)
	adminCacheH := http.StripPrefix(clientBaseURL, cache(adminGzHandler, clientAssetDir))
	router.GET(clientBaseURL+"/*w", gin.WrapH(adminCacheH))

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
	path := filepath.Join(h.staticPath, r.URL.Path)

	// check whether a file exists at the given path
	_, err := pkger.Stat(path)
	if err != nil {
		// file does not exist, serve index.html
		// http.ServeFile(w, r, filepath.Join(h.staticPath, h.indexPath))
		file, err := pkger.Open(h.indexPath)
		if err != nil {
			http.Error(w, "file "+r.URL.Path+" does not exist", http.StatusNotFound)
			return
		}
		// lw := lhWriter{w}
		lw := w
		// r.URL.Path += "/index.html"
		cont, err := ioutil.ReadAll(file)
		if err != nil {
			lw.WriteHeader(http.StatusNotFound)
			lw.Write([]byte("File not found"))
			return
		}
		lw.Header().Set("Content-Type", "text/html")
		lw.Write(cont)
		return
	}

	// otherwise, use http.FileServer to serve the static dir
	http.FileServer(pkger.Dir(h.staticPath)).ServeHTTP(w, r)
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
		if r.URL.Path == clientBaseURL {
			fname = "index.html"
		}
		fi, err := pkger.Stat(filepath.Join(assetDir, fname))

		if err != nil {
			// spa route eg. /web/about
			// let spa handle it, no need to cache
			h.ServeHTTP(w, r)
			return
		}

		modTime := fi.ModTime()

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
	sessionNames := []string{"admin"}
	r.Use(sessions.SessionsMany(sessionNames, store))
	return store
}
