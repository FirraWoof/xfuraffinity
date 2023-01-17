package submission

import (
	"fmt"
)

func (s *Submission) GenerateEmbed() string {
	videoMeta := ""
	if s.ImgType == "gif" {
		// TG considers GIFs to be videos, but using `content="video/gif"` doesn't work, while mp4 does somehow
		videoMeta = fmt.Sprintf(`
		<meta property="og:video" content="%[1]s">
		<meta property="og:video:url" content="%[1]s">
		<meta property="og:video:secure_url" content="%[1]s">
		<meta property="og:video:type" content="video/mp4">
		`, s.ImgUrl)
	}

	return fmt.Sprintf(`
	<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
	<html lang="en" class="no-js" xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />

    <meta property="og:type" content="website" />
    <meta property="og:title" content="%[1]s" />
    <meta name="twitter:title" content="%[1]s" />

    <meta property="og:description" content="%[2]s" />
    <meta name="twitter:description" content="%[2]s" />

    <meta property="og:image" content="%[3]s" />
    <meta property="og:image:secure_url" content="%[3]s" />
    <meta name="twitter:image" content="%[3]s" />
    <meta property="og:image:type" content="image/%[4]s" />

	%[5]s

    <meta property="og:url" content="%[6]s" />
    <meta name="twitter:url" content=%[6]s/>
    <meta name="twitter:card" content="summary_large_image" />

	</head>
	</html>
	`, s.Title, s.Description, s.ImgUrl, s.ImgType, videoMeta, s.Path.SubmissionUrl)
}

func GenerateRedirectPage(target string) string {
	return fmt.Sprintf(`
	<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
	<html lang="en" class="no-js" xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<meta http-equiv="refresh" content="0; url=%s" />
	</head>
	</html>
	`, target)
}

const ServerErrorEmbed = `
	<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
	<html lang="en" class="no-js" xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<meta property="og:image" content="https://www.furaffinity.net/themes/beta/img/banners/fa_logo.png?v2">
    <meta property="og:title" content="Error Generating Embed" />
    <meta property="og:description" content="The error should be resolved within 24h, if it persists, contact xfa@firra.ca" />

		<meta name="twitter:image" content="https://www.furaffinity.net/themes/beta/img/banners/fa_logo.png?v2">
    <meta name="twitter:title" content="Error Generating Embed" />
    <meta name="twitter:description" content="The error should be resolved within 24h, if it persists, contact xfa@firra.ca" />
	</head>
	</html>
`

const BadPathEmbed = `
	<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
	<html lang="en" class="no-js" xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<meta property="og:image" content="https://www.furaffinity.net/themes/beta/img/banners/fa_logo.png?v2">
    <meta property="og:title" content="Provided Link Error" />
    <meta property="og:description" content="Only submission URLs will generate embeds" />

		<meta name="twitter:image" content="https://www.furaffinity.net/themes/beta/img/banners/fa_logo.png?v2">
    <meta name="twitter:title" content="Provided Link Error" />
    <meta name="twitter:description" content="Only submission URLs will generate embeds" />
	</head>
	</html>
`
