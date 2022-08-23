package fxfuraffinity

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"

	"github.com/PuerkitoBio/goquery"
)

var httpClient = http.DefaultClient

func init() {
	jar, _ := cookiejar.New(nil)
	faUrl, _ := url.Parse("https://www.furaffinity.net")
	faSession := os.Getenv("FURAFFINITY_SESSION")

	LoadCookiesFromJson(faUrl, jar, faSession)
	httpClient.Jar = jar
}

func HandleRequest(w http.ResponseWriter, r *http.Request) {
	var err error
	var response string

	if UserAgentIsBot(r.UserAgent()) {
		log.Print("user agent appears to be a bot: generating embed")

		if !SubmissionPathIsValid(r.URL.Path) {
			log.Printf("user provided an invalid path: %s", r.URL.Path)
			w.Write([]byte(badPathEmbed))
			return
		}

		response, err = handleBotRequest(r)
	} else {
		log.Print("user agent appears to be a human: redirecting")

		if !SubmissionPathIsValid(r.URL.Path) {
			log.Printf("user provided an invalid path: %s", r.URL.Path)
			w.Write([]byte(generateRedirectPage("https://furaffinity.net")))
			return
		}

		response, err = handleHumanRequest(r)
	}

	if err != nil {
		log.Print(err)
		w.Write([]byte(serverErrorEmbed))
	} else {
		w.Write([]byte(response))
	}
}

func handleHumanRequest(r *http.Request) (string, error) {
	return generateRedirectPage("https://furaffinity.net" + r.URL.Path), nil // path was validated
}

func handleBotRequest(r *http.Request) (string, error) {
	path := r.URL.Path
	postUrl := "https://furaffinity.net" + path // path was validated
	resp, err := httpClient.Get(postUrl)
	if err != nil {
		return "", fmt.Errorf("fetch submission %s: %w", path, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("fetch submission %s: status %s", path, resp.Status)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to parse html from %s: %v", path, err)
	}

	submissionSel := doc.Find("#submissionImg")
	if submissionSel.Length() != 1 {
		return "", errors.New("did not find exactly one submission image")
	}

	titleSel := doc.Find("meta[property*='og:title']")
	if titleSel.Length() != 1 {
		return "", errors.New("did not find exactly one submission title")
	}

	descSel := doc.Find("meta[property*='og:description']")
	if descSel.Length() != 1 {
		return "", errors.New("did not find exactly one submission description")
	}

	submissionImgLinkWithoutProto, err := GetNodeAttr(submissionSel.Nodes[0], "data-fullview-src")
	if err != nil {
		return "", fmt.Errorf("failed to get submission image link for %s: %v", path, err)
	}
	submissionImgLink := "https:" + submissionImgLinkWithoutProto

	title, err := GetNodeAttr(titleSel.Nodes[0], "content")
	if err != nil {
		return "", fmt.Errorf("failed to get submission title for %s: %v", path, err)
	}

	desc, err := GetNodeAttr(descSel.Nodes[0], "content")
	if err != nil {
		return "", fmt.Errorf("failed to get submission title for %s: %v", path, err)
	}

	return generateEmbed(title, desc, postUrl, submissionImgLink), nil
}
