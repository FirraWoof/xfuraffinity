package xfuraffinity

import (
	"fmt"
	"github.com/firrawoof/xfuraffinity/internal"
	"github.com/firrawoof/xfuraffinity/internal/requesting_entities"
	"github.com/firrawoof/xfuraffinity/internal/submission"
	"github.com/firrawoof/xfuraffinity/internal/submission_path"
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

	err := internal.LoadCookiesFromJson(faUrl, jar, faSession)
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
		_, writeError = w.Write([]byte(submission.ServerErrorEmbed))
	} else {
		_, writeError = w.Write([]byte(response))
	}

	if writeError != nil {
		log.Printf("Could not write the response: %v", writeError)
	}
}

func handleRootRequest() string {
	return submission.GenerateRedirectPage("https://firrawoof.github.io/xfuraffinity/")
}

func handleSubmissionRequest(r *http.Request) (string, error) {
	var response string

	path, err := submission_path.ValidateSubmissionPath(r.URL.Path)
	if err != nil {
		log.Printf("user provided an invalid path: %v", err)
		return submission.BadPathEmbed, nil
	}

	requestingEntity := requesting_entities.DetermineRequestingEntity(r.UserAgent())
	if requestingEntity != requesting_entities.Human {
		log.Print("user agent appears to be a bot: generating embed")
		response, err = handleBotRequest(path, requestingEntity)
	} else {
		log.Print("user agent appears to be a human: redirecting")
		response, err = handleHumanRequest(path)
	}

	if err != nil {
		return "", err
	}

	return response, nil
}

func handleHumanRequest(path submission_path.Path) (string, error) {
	return submission.GenerateRedirectPage("https://furaffinity.net" + path.FullPath), nil
}

func handleBotRequest(path submission_path.Path, entity requesting_entities.Entity) (embed string, err error) {
	resp, err := httpClient.Get(path.SubmissionUrl)
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

	submissionData, err := submission.ExtractSubmissionInfo(path, doc)
	if err != nil {
		return "", fmt.Errorf("failed to extract submission info: %v", err)
	}

	resp, err = httpClient.Head(submissionData.ImgUrl)
	// AFAIK only TG refuses to render embeds with media over a certain size
	if submissionData.ImgType != "gif" && resp.ContentLength >= fiveMB && entity == requesting_entities.Telegram {
		submissionData.ImgUrl = submissionData.ThumbUrl
	}

	return submissionData.GenerateEmbed(), nil
}
