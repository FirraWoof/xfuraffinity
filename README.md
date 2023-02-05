# xfuraffinity

Like fxtwitter, but for furaffinity. Fix embeds on chat platforms, and display mature content by default.

## GIFs in Telegram

Telegram seems to have a funny way of handling GIFs in embeds. It would seem that `og:video` properties need to be
included, but not only that, the `og:video:type` also needs to be `video/mp4` (as opposed to, say, `video/gif`, which
doesn't necessarily make sense, but hey, it _is_ a gif).

Hopefully this can be useful to others trying to embed GIFs in Telegram!

Another option is to convert GIFs to MP4s, which is very easy with `ffmpeg`, but not always possible.
