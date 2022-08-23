package fxfuraffinity

import (
	"regexp"
)

var submissionPattern = regexp.MustCompile(`^/view/\d+/?$`) // used as a constant

func SubmissionPathIsValid(path string) bool {
	return submissionPattern.Match([]byte(path))
}
