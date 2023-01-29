use crate::furaffinity::{
    html_wrapper::HtmlString, submission_info::SubmissionInfo, submission_media::ContentType,
};
use anyhow::Result;

pub fn generate_embed(submission: SubmissionInfo) -> Result<HtmlString> {
    let content_type = match submission.submission_image_url.guess_content_type()? {
        ContentType::ImageJpeg => "image/jpg",
        ContentType::ImagePng => "image/png",
        ContentType::ImageGif => "video/mp4", // Discord doesn't mind this, and without it, Telegram doesn't render GIFs
        ContentType::VideoMp4 => "video/mp4",
    };

    let title = submission.title;
    let description = submission.description;
    let submission_media_url: &str = submission.submission_image_url.as_ref();
    let video_metadata = String::new();
    let submission_url = submission.url;

    let embed = format!(
        r#"
          <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
          <html lang="en" class="no-js" xmlns="http://www.w3.org/1999/xhtml">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />

            <meta property="og:type" content="website" />
            <meta property="og:title" content="{title}" />
            <meta name="twitter:title" content="{title}" />

            <meta property="og:description" content="{description}" />
            <meta name="twitter:description" content="{description}" />

            <meta property="og:image" content="{submission_media_url}" />
            <meta property="og:image:secure_url" content="{submission_media_url}" />
            <meta name="twitter:image" content="{submission_media_url}" />

            <meta property="og:image:type" content="{content_type}" />

            {video_metadata}

            <meta property="og:url" content="{submission_url}" />
            <meta name="twitter:url" content="{submission_url}" />
            <meta name="twitter:card" content="summary_large_image" />
          </head>
          </html>
        "#
    );

    Ok(HtmlString(embed))
}
