package internal

import (
	"encoding/json"
	"errors"
	"fmt"
	"golang.org/x/net/html"
	"net/http"
	"net/url"
)

func LoadCookiesFromJson(url *url.URL, jar http.CookieJar, cookieJson string) error {
	var env map[string]interface{}
	err := json.Unmarshal([]byte(cookieJson), &env)
	if err != nil {
		return errors.New("could not parse cookies json")
	}

	var cookies []*http.Cookie
	for key, value := range env {
		cookies = append(cookies, &http.Cookie{Name: key, Value: value.(string)})
	}

	jar.SetCookies(url, cookies)

	return nil
}

func GetNodeAttr(node *html.Node, attr string) (string, error) {
	for _, currentAttr := range node.Attr {
		if currentAttr.Key == attr {
			return currentAttr.Val, nil
		}
	}

	return "", fmt.Errorf("could not find attribute: %s", attr)
}
