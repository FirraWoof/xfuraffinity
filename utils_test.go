package fxfuraffinity_test

import (
	"testing"

	"github.com/firrawoof/fxfuraffinity"
)

func Test_GivenAValidPath_WhenValidatingSubmissionPath_ThenTrueIsReturned(t *testing.T) {
	var validPaths = []string{"/view/41508184", "/view/41508184/", "/view/1", "/view/1/"}

	for _, tt := range validPaths {
		actual := fxfuraffinity.SubmissionPathIsValid(tt)
		if actual != true {
			t.Errorf("SubmissionPathIsValid(%s): expected %v, actual %v", tt, true, actual)
		}
	}
}

func Test_GivenAnInvalidPath_WhenValidatingSubmissionPath_ThenFalseIsReturned(t *testing.T) {
	var invalidPaths = []string{"/../watch/me", "/view/", "/view/123/../../watch/me", "\x00/watch/me"}

	for _, tt := range invalidPaths {
		actual := fxfuraffinity.SubmissionPathIsValid(tt)
		if actual != false {
			t.Errorf("SubmissionPathIsValid(%s): expected %v, actual %v", tt, false, actual)
		}
	}
}
