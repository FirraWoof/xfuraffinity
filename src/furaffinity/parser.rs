use anyhow::Result;
use scraper::Html;
use std::convert::TryFrom;

use super::{
    client::{HtmlString, SubmissionInfo},
    html_wrapper::HtmlElement,
};

impl TryFrom<HtmlString> for SubmissionInfo {
    type Error = anyhow::Error;

    fn try_from(submission_html: HtmlString) -> Result<Self> {
        let document = Html::parse_document(&submission_html.value());
        let root = HtmlElement::from(document.root_element());

        let submission_url = format!("https:{}", root.select("#submissionImg")?.attr("src")?);
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
                download_url: "".to_string(),
                content_type: super::client::ContentType::ImageGif,
            },
            thumbnail_media: super::client::Media {
                download_url: "".to_string(),
                content_type: super::client::ContentType::ImageGif,
            },
        })
    }
}
