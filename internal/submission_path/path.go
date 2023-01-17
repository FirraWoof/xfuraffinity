package submission_path

import (
	"fmt"
	"regexp"
)

var submissionPattern = regexp.MustCompile(`^(/view/(\d+)/?)`) // used as a constant

type Path struct {
	SubmissionUrl string
	FullPath      string
	SubmissionId  string
}

func ValidateSubmissionPath(path string) (Path, error) {
	s := submissionPattern.FindStringSubmatch(path)
	if len(s) == 3 {
		return Path{
			SubmissionUrl: fmt.Sprintf("https://furaffinity.net%s", s[1]),
			FullPath:      s[1],
			SubmissionId:  s[2],
		}, nil
	}

	return Path{}, fmt.Errorf("submission path `%s` is invalid", path)
}
