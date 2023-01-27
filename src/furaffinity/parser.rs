use anyhow::{anyhow, Result};
use scraper::Html;
use std::convert::TryFrom;

use super::{
    client::{ContentType, FileExtension, HtmlString, SubmissionInfo},
    html_wrapper::HtmlElement,
};

impl TryFrom<HtmlString> for SubmissionInfo {
    type Error = anyhow::Error;

    fn try_from(submission_html: HtmlString) -> Result<Self> {
        let document = Html::parse_document(&submission_html.value());
        let root = HtmlElement::from(document.root_element());

        let submission_url = root.select("meta[property*='og:url']")?.attr("content")?;
        let submission_img = format!("https:{}", root.select("#submissionImg")?.attr("src")?);
        let submission_img_content_type = ContentType::try_from(FileExtension::new(
            submission_img
                .split('.')
                .last()
                .ok_or_else(|| anyhow!("Could not determine submission file extension"))?,
        ))?;

        let thumbnail_img = format!(
            "https:{}",
            root.select("#submissionImg")?.attr("data-preview-src")?
        );
        let thumbnail_img_content_type = ContentType::try_from(FileExtension::new(
            thumbnail_img
                .split('.')
                .last()
                .ok_or_else(|| anyhow!("Could not determine thumbnail file extension"))?,
        ))?;

        let title = root.select("meta[property*='og:title']")?.attr("content")?;
        let description = root
            .select("meta[property*='og:description']")?
            .attr("content")?;

        let stats = root.select("#columnpage")?;
        let view_count = stats.select(".views")?.select("span")?.text().parse()?;
        let comment_count = stats.select(".comments")?.select("span")?.text().parse()?;
        let fave_count = stats.select(".favorites")?.select("span")?.text().parse()?;

        Ok(SubmissionInfo {
            url: submission_url,
            title,
            description,
            view_count,
            comment_count,
            fave_count,
            submission_media: super::client::Media {
                download_url: submission_img,
                content_type: submission_img_content_type,
            },
            thumbnail_media: super::client::Media {
                download_url: thumbnail_img,
                content_type: thumbnail_img_content_type,
            },
        })
    }
}

impl<'a> TryFrom<FileExtension<'a>> for ContentType {
    type Error = anyhow::Error;

    fn try_from(value: FileExtension) -> Result<Self> {
        match value.as_ref() {
            "jpeg" => Ok(Self::ImageJpeg),
            "jpg" => Ok(Self::ImageJpeg),
            "png" => Ok(Self::ImagePng),
            "gif" => Ok(Self::ImageGif),
            "mp4" => Ok(Self::VideoMp4),
            _ => Err(anyhow!("Unsupported content type")),
        }
    }
}
