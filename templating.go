package fxfuraffinity

import (
	"fmt"
	"net/url"
)

func generateEmbed(title string, desc string, postUrl *url.URL, imageUrl string) string {
	return fmt.Sprintf(`
	<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
	<html lang="en" class="no-js" xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />

    <meta property="og:type" content="website" />
    <meta property="og:title" content="%[1]s" />
    <meta property="og:description" content="%[2]s" />
    <meta property="og:url" content="%[4]s" />
    <meta property="og:image" content="%[3]s" />
    <meta property="og:image:secure_url" content="%[3]s" />
    <meta property="og:image:type" content="image/jpeg" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:domain" content="%[5]s" />
    <meta name="twitter:title" content="%[1]s" />
    <meta name="twitter:description" content="%[2]s" />
    <meta name="twitter:url" content=%[4]s/>
    <meta name="twitter:image" content="%[3]s" />

	</head>
	</html>
	`, title, desc, imageUrl, postUrl, postUrl.Hostname())
}

func generateRedirectPage(target *url.URL) string {
	return fmt.Sprintf(`
	<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
	<html lang="en" class="no-js" xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<meta http-equiv="refresh" content="0; url=%s" />
	</head>
	</html>
	`, target)
}

const serverErrorEmbed = `
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

const badPathEmbed = `
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
