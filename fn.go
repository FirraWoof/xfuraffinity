package xfuraffinity

import (
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

	path, err := ValidateSubmissionPath(r.URL.Path)
	if err != nil {
		log.Printf("user provided an invalid path: %v", err)
		w.Write([]byte(badPathEmbed))
	}

	if UserAgentIsBot(r.UserAgent()) {
		log.Print("user agent appears to be a bot: generating embed")
		response, err = handleBotRequest(path)
	} else {
		log.Print("user agent appears to be a human: redirecting")
		response, err = handleHumanRequest(path)
	}

	if err != nil {
		log.Print(err)
		w.Write([]byte(serverErrorEmbed))
	} else {
		w.Write([]byte(response))
	}
}

func handleHumanRequest(path SubmissionPath) (string, error) {
	return generateRedirectPage("https://furaffinity.net" + path.FullPath), nil
}

func handleBotRequest(path SubmissionPath) (string, error) {
	postUrl := "https://furaffinity.net" + path.FullPath
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

	submissionData, err := ExtractSubmissionInfo(path, doc)
	if err != nil {
		return "", fmt.Errorf("failed to extract submission info: %v", err)
	}

	return generateEmbed(submissionData.Title, submissionData.Description, postUrl, submissionData.ImgUrl), nil
}
