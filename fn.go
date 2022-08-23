package fxfuraffinity

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"

	"github.com/PuerkitoBio/goquery"
)

const baseEndpoint = "https://furaffinity.net"
const defaultAnswer = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="en" class="no-js" xmlns="http://www.w3.org/1999/xhtml">

<head>
    <meta charset="utf-8" />
    <!-- og -->
		<meta property="og:type" content="website">
		<meta property="og:title" content="Mature Content">
		<meta property="og:description" content="This image is hidden because it contains mature content">
		<meta property="og:image" content="https://www.furaffinity.net/themes/beta/img/banners/fa_logo.png?v2" />
    
    <!-- twitter -->
		<meta name="twitter:image" content="https://www.furaffinity.net/themes/beta/img/banners/fa_logo.png?v2" />
</head>
`

func GenerateEmbed(w http.ResponseWriter, r *http.Request) {
	err := generateFaEmbed(w, r.URL.Path)

	if err != nil {
		w.Write([]byte(defaultAnswer))
	}
}

// TODO: Redirect only users (use the useragent to detect)
// - TG UA     : `TelegramBot (like TwitterBot)`
// - Discord UA: `Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)`
// TODO: TG not rendering? doc.Find("html head").AppendHtml(fmt.Sprintf("<meta http-equiv=\"refresh\" content=\"0; url=%s\" />", targetPost))
func generateFaEmbed(w http.ResponseWriter, path string) error {
	jar, err := cookiejar.New(nil)
	if err != nil {
		return errors.New("could not use cookie jar")
	}

	FaURL, err := url.Parse("https://www.furaffinity.net")
	if err != nil {
		return errors.New("could not parse FA url")
	}

	FaSession := os.Getenv("FURAFFINITY_SESSION")

	var env map[string]interface{}
	err = json.Unmarshal([]byte(FaSession), &env)
	if err != nil {
		return errors.New("could not parse env vars")
	}

	var cookies []*http.Cookie
	for key, value := range env {
		cookies = append(cookies, &http.Cookie{Name: key, Value: value.(string)})
	}
	jar.SetCookies(FaURL, cookies)

	client := &http.Client{
		Jar: jar,
	}

	targetPost := baseEndpoint + path

	if !SubmissionPathIsValid(path) {
		return errors.New("attempted to load embed that was not a submission")
	}

	resp, err := client.Get(targetPost)
	if err != nil {
		return fmt.Errorf("fetch submission %s: %w", path, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("fetch submission %s: status %s", path, resp.Status)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to parse html from %s: %v", path, err)
	}

	submissionSel := doc.Find("#submissionImg")
	if submissionSel.Length() != 1 {
		return errors.New("did not find exactly one submission image")
	}

	submissionImgNode := submissionSel.Nodes[0]
	var submissionImgLink string
	for _, attr := range submissionImgNode.Attr {
		if attr.Key == "data-fullview-src" {
			submissionImgLink = fmt.Sprintf("https:%s", attr.Val)
		}
	}

	doc.Find("meta[property*='og:image']").Remove()
	doc.Find("meta[name*='twitter:image']").Remove()
	doc.Find("meta[name*='twitter:label2']").Remove()
	doc.Find("meta[name*='twitter:data2']").Remove()

	doc.Find("html head").AppendHtml(fmt.Sprintf("<meta property=\"og:image\" content=\"%s\" />", submissionImgLink))
	doc.Find("html head").AppendHtml(fmt.Sprintf("<meta property=\"og:image:secure_url\" content=\"%s\" />", submissionImgLink))
	doc.Find("html head").AppendHtml("<meta property=\"og:image:type\" content=\"image/jpeg\" />")
	doc.Find("html head").AppendHtml(fmt.Sprintf("<meta name=\"twitter:image\" content=\"%s\" />", submissionImgLink))

	doc.Find("body").Remove()
	doc.Find("script").Remove()
	doc.Find("link").Remove()

	goquery.Render(w, doc.Selection)

	return nil
}
