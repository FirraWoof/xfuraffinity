use crate::furaffinity::{
    content_type::ContentType, image_url::ImageUrl, submission_info::SubmissionInfo,
};
use anyhow::{Context, Result};

use super::{
    html_string::HtmlString,
    open_graph_builder::{OpenGraphBuilder, TwitterCardType},
};

const FIVE_MB: usize = 1024 * 1024 * 5;

pub fn generate_telegram_opengraph_embed(submission: &SubmissionInfo) -> Result<HtmlString> {
    let mut builder = OpenGraphBuilder::new();
    builder
        .with_default_metadata()
        .with_twitter_card(TwitterCardType::SummaryLargeImage)
        .with_title(&submission.title)
        .with_description(&submission.description)
        .with_website_url(&submission.url);

    let media_url =
        choose_embed_url(submission).with_context(|| "Could not generate telegram embed")?;
    let content_type = media_url
        .guess_content_type()
        .with_context(|| "Could not generate telegram embed")?;

    let builder = match content_type {
        ContentType::ImageJpeg => builder.with_image(media_url, "image/jpg"),
        ContentType::ImagePng => builder.with_image(media_url, "image/png"),
        ContentType::ImageGif => builder.with_video(media_url, "video/mp4"), // For some reason Telegram needs video/mp4 to render GIFs
        ContentType::VideoMp4 => builder.with_video(media_url, "video/mp4"),
    };

    Ok(builder.build())
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
