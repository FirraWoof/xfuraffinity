package fxfuraffinity

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strings"

	"golang.org/x/net/html"
)

var submissionPattern = regexp.MustCompile(`^/view/\d+/?$`) // used as a constant

func SubmissionPathIsValid(path string) bool {
	return submissionPattern.Match([]byte(path))
}

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

// UserAgentIsBot determines whether or not the request user-agent belongs to a human.
// Bot user-agents must not start with `Mozilla/`, except for the Discord bot, which uses a browser-like user-agent.
func UserAgentIsBot(userAgent string) bool {
	return !strings.HasPrefix(userAgent, "Mozilla/") || strings.Contains(userAgent, "Discordbot")
}

func GetNodeAttr(node *html.Node, attr string) (string, error) {
	for _, currentAttr := range node.Attr {
		if currentAttr.Key == attr {
			return currentAttr.Val, nil
		}
	}

	return "", fmt.Errorf("could not find attribute: %s", attr)
}
