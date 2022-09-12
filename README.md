# xfuraffinity

Like fxtwitter, but for furaffinity. Fix embeds on chat platforms, and display mature content by default.

## Dev Tests

### Authenticating

The development cloud function is protected by authentication. To run tests on the dev version, authenticate
through the usual Google Cloud means (<https://cloud.google.com/functions/docs/securing/authenticating#authenticating_developer_testing>).

Once authenticated, the `Authorization` header can be set with a bearer token like so

```sh
curl -H "Authorization: Bearer $my_auth_token" https://endpoint/view/123456
```

## GitHub Pages

To generate CSS for the site, use the following command from the `gh-pages` directory.

```sh
npx tailwindcss -i ./src/input.css -o ./dist/output.css
```

You can add the `--watch` option while developing to more easily see the changes live.

Also, whenever developing locally, you may want to add this snippet of code to the `index.html`
to automatically reload the page in order to preview changes. Note that using this requires an
actual web server (one can easily be setup with `python -m http.server`).

```html
<script type="text/javascript" src="http://livejs.com/live.js"></script>
```
