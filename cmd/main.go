package main

import (
	"fmt"
	"github.com/firrawoof/xfuraffinity"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("./xfuraffinity https://www.xfuraffinity.net/view/123456")
		fmt.Println("./xfuraffinity serve")
	}

	if os.Args[1] == "serve" {
		server()
	}

	cli(os.Args[1])
}

func server() {
	fmt.Println("Listening on :8080")
	http.HandleFunc("/", xfuraffinity.HandleRequest)
	_ = http.ListenAndServe(":8080", nil)
}

func cli(submission string) {
	w := httptest.NewRecorder()

	req, err := http.NewRequest("GET", submission, strings.NewReader(""))
	if err != nil {
		panic("could not create request")
	}

	xfuraffinity.HandleRequest(w, req)
	if b, err := ioutil.ReadAll(w.Body); err == nil {
		fmt.Println(string(b))
	}
}
