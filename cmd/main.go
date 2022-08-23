package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"strings"

	"github.com/firrawoof/fxfuraffinity"
)

func main() {
	w := httptest.NewRecorder()

	req, err := http.NewRequest("GET", "https://example.com/view/41508184/", strings.NewReader(""))
	if err != nil {
		panic("could not create request")
	}

	fxfuraffinity.HandleRequest(w, req)
	if b, err := ioutil.ReadAll(w.Body); err == nil {
		fmt.Println(string(b))
	}
}
