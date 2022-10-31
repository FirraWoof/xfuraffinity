package xfuraffinity

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

var httpClient = http.DefaultClient

const fiveMB = 1024 * 1024 * 5

func init() {
	jar, _ := cookiejar.New(nil)
	faUrl, _ := url.Parse("https://www.furaffinity.net")
	faSession := os.Getenv("FURAFFINITY_SESSION")

	err := LoadCookiesFromJson(faUrl, jar, faSession)
	if err != nil {
		panic(err)
	}
	httpClient.Jar = jar
}

func HandleRequest(w http.ResponseWriter, r *http.Request) {
	var err error
	var response string

	if r.URL.Path == "" || r.URL.Path == "/" {
		response = handleRootRequest()
	}
	if strings.HasPrefix(r.URL.Path, "/view") {
		response, err = handleSubmissionRequest(r)
	}

	var writeError error
	if err != nil {
		log.Print(err)
		_, writeError = w.Write([]byte(serverErrorEmbed))
	} else {
		_, writeError = w.Write([]byte(response))
	}

	if writeError != nil {
		log.Printf("Could not write the response: %v", writeError)
	}
}

func handleRootRequest() string {
	return generateRedirectPage("https://firrawoof.github.io/xfuraffinity/")
}

func handleSubmissionRequest(r *http.Request) (string, error) {
	var response string

	path, err := ValidateSubmissionPath(r.URL.Path)
	if err != nil {
		log.Printf("user provided an invalid path: %v", err)
		return badPathEmbed, nil
	}

	if UserAgentIsBot(r.UserAgent()) {
		log.Print("user agent appears to be a bot: generating embed")
		response, err = handleBotRequest(path)
	} else {
		log.Print("user agent appears to be a human: redirecting")
		response, err = handleHumanRequest(path)
	}

	if err != nil {
		return "", err
	}

	return response, nil
}

func handleHumanRequest(path SubmissionPath) (string, error) {
	return generateRedirectPage("https://furaffinity.net" + path.FullPath), nil
}

func handleBotRequest(path SubmissionPath) (embed string, err error) {
	postUrl := "https://furaffinity.net" + path.FullPath
	resp, err := httpClient.Get(postUrl)
	if err != nil {
		return "", fmt.Errorf("fetch submission %s: %w", path, err)
	}
	defer func(Body io.ReadCloser) {
		err = Body.Close()
	}(resp.Body)
	if err != nil {
		return "", fmt.Errorf("fetch submission %s: %w", path, err)
	}

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

	embedImageUrl := submissionData.ImgUrl

	resp, err = httpClient.Head(submissionData.ImgUrl)
	if resp.ContentLength >= fiveMB {
		embedImageUrl = submissionData.ThumbUrl
	}

	return generateEmbed(submissionData.Title, submissionData.Description, postUrl, embedImageUrl), nil
}
