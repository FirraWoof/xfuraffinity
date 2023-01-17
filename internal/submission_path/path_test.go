package submission_path

import "testing"

func Test_GivenAnInvalidPath_WhenValidatingSubmissionPath_ThenFalseIsReturned(t *testing.T) {
	var invalidPaths = []string{"../watch/me", "/../watch/me", "/view/", "/view/not-an-id", "\x00/watch/me"}

	for _, tt := range invalidPaths {
		actual, err := ValidateSubmissionPath(tt)
		if err == nil {
			t.Errorf("ValidateSubmissionPath(%s): expected error, actual %v", tt, actual)
		}
	}
}
