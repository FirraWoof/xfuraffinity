use crate::furaffinity::{
    content_type::ContentType, image_url::ImageUrl, submission_info::SubmissionInfo,
};
use anyhow::Result;

use super::html_string::HtmlString;

const FIVE_MB: usize = 1024 * 1024 * 5;
const EMPTY_STRING: &str = "";

pub fn generate_telegram_opengraph_embed(submission: &SubmissionInfo) -> Result<HtmlString> {
    let title = &submission.title;
    let description = &submission.description;
    let submission_url = &submission.url;
    let embed_image_url = choose_embed_url(submission)?;
    let embed_image_url_str: &str = embed_image_url.as_ref();

    let content_type = embed_image_url.guess_content_type()?;
    let content_type_str = match content_type {
        ContentType::ImageJpeg => "image/jpg",
        ContentType::ImagePng => "image/png",
        ContentType::ImageGif => "video/mp4", // For some reason Telegram needs this to render GIFs
        ContentType::VideoMp4 => "video/mp4",
    };

    let video_metadata = format!(
        r#"
            <meta property="og:video" content="{embed_image_url_str}">
            <meta property="og:video:url" content="{embed_image_url_str}">
            <meta property="og:video:secure_url" content="{embed_image_url_str}">
            <meta property="og:video:type" content="{content_type_str}">
        "#
    );

    let video_metadata = match content_type {
        ContentType::ImageJpeg => EMPTY_STRING,
        ContentType::ImagePng => EMPTY_STRING,
        ContentType::ImageGif => video_metadata.as_str(),
        ContentType::VideoMp4 => video_metadata.as_str(),
    };

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

            <meta property="og:image" content="{embed_image_url_str}" />
            <meta property="og:image:secure_url" content="{embed_image_url_str}" />
            <meta name="twitter:image" content="{embed_image_url_str}" />

            <meta property="og:image:type" content="{content_type_str}" />

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

fn choose_embed_url(submission: &SubmissionInfo) -> Result<&ImageUrl> {
    if submission.submission_size_bytes < FIVE_MB {
        return Ok(&submission.submission_image_url);
    }

    match submission.submission_image_url.guess_content_type()? {
        ContentType::ImageJpeg => Ok(&submission.thumbnail_image_url),
        ContentType::ImagePng => Ok(&submission.thumbnail_image_url),
        ContentType::ImageGif => Ok(&submission.submission_image_url),
        ContentType::VideoMp4 => Ok(&submission.submission_image_url),
    }
}
