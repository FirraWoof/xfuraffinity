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
