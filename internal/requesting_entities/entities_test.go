package requesting_entities

import (
	"github.com/firrawoof/xfuraffinity/internal/submission_path"
	"testing"
)

func Test_GivenAValidPath_WhenValidatingSubmissionPath_ThenThePathIsRetured(t *testing.T) {
	var validPaths = []struct {
		path          string
		extractedPath string
		id            string
	}{
		{path: "/view/41508184", extractedPath: "/view/41508184", id: "41508184"},   // standard submission
		{path: "/view/41508184/", extractedPath: "/view/41508184/", id: "41508184"}, // standard submission
		{path: "/view/1", extractedPath: "/view/1", id: "1"},                        // short id
		{path: "/view/1/", extractedPath: "/view/1/", id: "1"},                      // short id
		{path: "/view/123/../../watch/me", extractedPath: "/view/123/", id: "123"},  // trailing randomness
		{path: "/view/123||", extractedPath: "/view/123", id: "123"},                // discord spoiler format
		{path: "/view/123/||", extractedPath: "/view/123/", id: "123"},              // discord spoiler format
	}

	for _, tt := range validPaths {
		actual, err := submission_path.ValidateSubmissionPath(tt.path)
		if err != nil {
			t.Errorf("ValidateSubmissionPath(%s): error %v", tt.path, err)
		}

		if actual.FullPath != tt.extractedPath {
			t.Errorf("ValidateSubmissionPath(%s): expected path %s, actual %s", tt.path, tt.extractedPath, actual.FullPath)
		}

		if actual.SubmissionId != tt.id {
			t.Errorf("ValidateSubmissionPath(%s): expected id %s, actual %s", tt.path, tt.id, actual.SubmissionId)
		}
	}
}
