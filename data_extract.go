package xfuraffinity

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/PuerkitoBio/goquery"
)

type Submission struct {
	Path         SubmissionPath
	ImgUrl       string
	ThumbUrl     string
	Title        string
	Description  string
	ViewCount    int64
	CommentCount int64
	FaveCount    int64
}

func ExtractSubmissionInfo(path SubmissionPath, doc *goquery.Document) (*Submission, error) {
	submissionSel := doc.Find("#submissionImg")
	if submissionSel.Length() != 1 {
		return nil, errors.New("did not find exactly one submission image")
	}

	titleSel := doc.Find("meta[property*='og:title']")
	if titleSel.Length() != 1 {
		return nil, errors.New("did not find exactly one submission title")
	}

	descSel := doc.Find("meta[property*='og:description']")
	if descSel.Length() != 1 {
		return nil, errors.New("did not find exactly one submission description")
	}

	submissionImgLinkWithoutProto, err := GetNodeAttr(submissionSel.Nodes[0], "src")
	if err != nil {
		return nil, fmt.Errorf("failed to get submission image link for %s: %v", path, err)
	}
	submissionImgLink := "https:" + submissionImgLinkWithoutProto

	submissionThumbLinkWithoutProto, err := GetNodeAttr(submissionSel.Nodes[0], "data-preview-src")
	if err != nil {
		return nil, fmt.Errorf("failed to get submission image thumbnail for %s: %v", path, err)
	}
	submissionThumbLink := "https:" + submissionThumbLinkWithoutProto

	title, err := GetNodeAttr(titleSel.Nodes[0], "content")
	if err != nil {
		return nil, fmt.Errorf("failed to get submission title for %s: %v", path, err)
	}

	viewCount := doc.Find("#columnpage").Find(".views").Find("span").First().Text()
	commentCount := doc.Find("#columnpage").Find(".comments").Find("span").First().Text()
	faveCount := doc.Find("#columnpage").Find(".favorites").Find("span").First().Text()

	var viewCountInt int64
	if parsed, err := strconv.ParseInt(viewCount, 10, 64); err == nil {
		if parsed >= 0 {
			viewCountInt = parsed
		}
	}

	var commentCountInt int64
	if parsed, err := strconv.ParseInt(commentCount, 10, 64); err == nil {
		if parsed > 0 {
			commentCountInt = parsed
		}
	}

	var faveCountInt int64
	if parsed, err := strconv.ParseInt(faveCount, 10, 64); err == nil {
		if parsed > 0 {
			faveCountInt = parsed
		}
	}

	desc, err := GetNodeAttr(descSel.Nodes[0], "content")
	if err != nil {
		return nil, fmt.Errorf("failed to get submission title for %s: %v", path, err)
	}

	return &Submission{
		Path:         path,
		ImgUrl:       submissionImgLink,
		ThumbUrl:     submissionThumbLink,
		Title:        title,
		Description:  desc,
		ViewCount:    viewCountInt,
		CommentCount: commentCountInt,
		FaveCount:    faveCountInt,
	}, nil
}
