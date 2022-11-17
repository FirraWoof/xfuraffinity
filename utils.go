package xfuraffinity

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/firrawoof/xfuraffinity/requesting_entities"
	"net/http"
	"net/url"
	"regexp"
	"strings"

	"golang.org/x/net/html"
)

var submissionPattern = regexp.MustCompile(`^(/view/(\d+)/?)`) // used as a constant

type SubmissionPath struct {
	FullPath     string
	SubmissionId string
}

func ValidateSubmissionPath(path string) (SubmissionPath, error) {
	s := submissionPattern.FindStringSubmatch(path)
	if len(s) == 3 {
		return SubmissionPath{
			FullPath:     s[1],
			SubmissionId: s[2],
		}, nil
	}

	return SubmissionPath{}, fmt.Errorf("submission path `%s` is invalid", path)
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

// DetermineRequestingEntity determines whether the request user-agent belongs to a human.
// Bot user-agents must not start with `Mozilla/`, except for the Discord bot, which uses a browser-like user-agent.
// Use this for user agents https://developers.whatismybrowser.com/useragents/explore/
func DetermineRequestingEntity(userAgent string) requesting_entities.Entity {
	if strings.Contains(userAgent, "TelegramBot") {
		return requesting_entities.Telegram
	}

	if strings.Contains(userAgent, "Discordbot") {
		return requesting_entities.Discord
	}

	if strings.HasPrefix(userAgent, "Mozilla/") {
		return requesting_entities.Human
	}

	return requesting_entities.Other
}

func GetNodeAttr(node *html.Node, attr string) (string, error) {
	for _, currentAttr := range node.Attr {
		if currentAttr.Key == attr {
			return currentAttr.Val, nil
		}
	}

	return "", fmt.Errorf("could not find attribute: %s", attr)
}
