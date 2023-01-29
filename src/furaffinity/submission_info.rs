use anyhow::Result;
use scraper::Html;
use serde::Serialize;
use std::convert::TryFrom;

use super::{
    html_wrapper::{HtmlElement, HtmlString},
    image_url::ImageUrl,
};

#[derive(Debug, Serialize)]
pub struct SubmissionInfo {
    pub url: String,
    pub title: String,
    pub description: String,
    pub view_count: usize,
    pub comment_count: usize,
    pub fave_count: usize,
    pub submission_image_url: ImageUrl,
    pub thumbnail_image_url: ImageUrl,
}

impl TryFrom<HtmlString> for SubmissionInfo {
    type Error = anyhow::Error;

    fn try_from(submission_html: HtmlString) -> Result<Self> {
        let document = Html::parse_document(submission_html.as_ref());
        let root = HtmlElement::from(document.root_element());

        let submission_url = root.select("meta[property*='og:url']")?.attr("content")?;
        let submission_img = ImageUrl::new(format!(
            "https:{}",
            root.select("#submissionImg")?.attr("src")?
        ));

        let thumbnail_img = ImageUrl::new(format!(
            "https:{}",
            root.select("#submissionImg")?.attr("data-preview-src")?
        ));

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
            submission_image_url: submission_img,
            thumbnail_image_url: thumbnail_img,
        })
    }
}
