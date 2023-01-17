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

## GIFs in Telegram

Telegram seems to have a funny way of handling GIFs in embeds. It would seem that `og:video` properties need to be
included, but not only that, the `og:video:type` also needs to be `video/mp4` (as opposed to, say, `video/gif`, which
doesn't necessarily make sense, but hey, it _is_ a gif).

Hopefully this can be useful to others trying to embed GIFs in Telegram!

Another option is to convert GIFs to MP4s, which is very easy with `ffmpeg`, but not always possible.
