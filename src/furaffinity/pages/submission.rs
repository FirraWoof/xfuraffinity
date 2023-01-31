use anyhow::{Context, Result};
use scraper::Html;

use super::html_wrapper::HtmlElement;

pub struct SubmissionPage<'a>(HtmlElement<'a>);

impl<'a> SubmissionPage<'a> {
    pub fn new(html: &'a Html) -> Self {
        SubmissionPage(HtmlElement::from(html.root_element()))
    }

    pub fn get_url(&self) -> Result<String> {
        self.0.select("meta[property*='og:url']")?.attr("content")
    }

    pub fn get_title(&self) -> Result<String> {
        self.0.select("meta[property*='og:title']")?.attr("content")
    }

    pub fn get_description(&self) -> Result<String> {
        self.0
            .select("meta[property*='og:description']")?
            .attr("content")
    }

    pub fn get_view_count(&self) -> Result<usize> {
        self.0
            .select("#columnpage .views span")?
            .text()
            .parse()
            .with_context(|| "Could not parse view count")
    }

    pub fn get_comment_count(&self) -> Result<usize> {
        self.0
            .select("#columnpage .comments span")?
            .text()
            .parse()
            .with_context(|| "Could not parse comment count")
    }

    pub fn get_fave_count(&self) -> Result<usize> {
        self.0
            .select("#columnpage .favorites span")?
            .text()
            .parse()
            .with_context(|| "Could not parse fave count")
    }

    pub fn get_submission_download_url(&self) -> Result<String> {
        Ok(format!(
            "https:{}",
            self.0.select("#submissionImg")?.attr("src")?
        ))
    }

    pub fn get_thumbnail_download_url(&self) -> Result<String> {
        Ok(format!(
            "https:{}",
            self.0.select("#submissionImg")?.attr("data-preview-src")?
        ))
    }
}