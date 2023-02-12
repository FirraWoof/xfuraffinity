use crate::furaffinity::{content_type::ContentType, submission_info::SubmissionInfo};
use anyhow::{Context, Result};

use super::{
    html_string::HtmlString,
    open_graph_builder::{OpenGraphBuilder, TwitterCardType},
};

pub fn generate_generic_opengraph_embed(submission: &SubmissionInfo) -> Result<HtmlString> {
    let mut builder = OpenGraphBuilder::new();
    builder
        .with_default_metadata()
        .with_twitter_card(TwitterCardType::SummaryLargeImage)
        .with_title(&submission.title)
        .with_description(&submission.description)
        .with_website_url(&submission.url);

    let media_url = &submission.submission_image_url;
    let content_type = media_url
        .guess_content_type()
        .with_context(|| "Could not generate generic open graph embed")?;

    let builder = match content_type {
        ContentType::ImageJpeg => builder.with_image(media_url, "image/jpeg"),
        ContentType::ImagePng => builder.with_image(media_url, "image/png"),
        ContentType::ImageGif => builder.with_image(media_url, "image/gif"),
        ContentType::VideoMp4 => builder.with_video(media_url, "video/mp4"),
    };

    Ok(builder.build())
}
