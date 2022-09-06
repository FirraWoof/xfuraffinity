package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"

	"github.com/firrawoof/xfuraffinity"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("./xfuraffinity https://www.xfuraffinity.net/view/123456")
	}

	w := httptest.NewRecorder()

	req, err := http.NewRequest("GET", os.Args[1], strings.NewReader(""))
	if err != nil {
		panic("could not create request")
	}

	xfuraffinity.HandleRequest(w, req)
	if b, err := ioutil.ReadAll(w.Body); err == nil {
		fmt.Println(string(b))
	}
}
