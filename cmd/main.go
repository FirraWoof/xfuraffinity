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

	req, err := http.NewRequest("GET", "https://fxfuraffinity-nznulg2x4a-ue.a.run.app/view/47817919/", strings.NewReader(""))
	if err != nil {
		panic("could not create request")
	}

	fxfuraffinity.GenerateEmbed(w, req)
	if b, err := ioutil.ReadAll(w.Body); err == nil {
		fmt.Println(string(b))
	}
}
