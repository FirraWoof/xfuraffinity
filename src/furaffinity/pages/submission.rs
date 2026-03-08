use anyhow::{Context, Result};
use scraper::Html;

use super::html_wrapper::HtmlElement;
const SUBMISSION_NOT_FOUND_TEXT: &str =
    "The submission you are trying to find is not in our database.";
const UNAUTHENTICATED_TEXT: &str = "please log in or create an account";
const CLOUDFLARE_JS_CHALLENGE_SELECTOR: &str = "#challenge-form";
const CLOUDFLARE_JS_REQUIRED_TEXT: &str = "Enable JavaScript and cookies to continue";
const CLOUDFLARE_CHECKING_TEXT: &str = "checking your browser";

#[derive(Debug)]
pub enum SubmissionPageVariant {
    NotFound,
    Unauthenticated,
    Blocked,
    ImageSubmission,
    FlashSubmission,
}

pub struct SubmissionPage<'a>(HtmlElement<'a>);
impl<'a> SubmissionPage<'a> {
    pub fn new(html: &'a Html) -> Self {
        SubmissionPage(HtmlElement::from(html.root_element()))
    }

    pub fn get_variant(&self) -> SubmissionPageVariant {
        if self.0.select(CLOUDFLARE_JS_CHALLENGE_SELECTOR).is_ok() {
            return SubmissionPageVariant::Blocked;
        }

        let page_text = self.0.text().to_lowercase();
        if page_text.contains(&CLOUDFLARE_JS_REQUIRED_TEXT.to_lowercase())
            || page_text.contains(CLOUDFLARE_CHECKING_TEXT)
        {
            return SubmissionPageVariant::Blocked;
        }

        let section_body = self.0.select(".section-body");
        if let Ok(section_body) = section_body {
            if section_body.text().contains(SUBMISSION_NOT_FOUND_TEXT) {
                return SubmissionPageVariant::NotFound;
            }

            if section_body.text().contains(UNAUTHENTICATED_TEXT) {
                return SubmissionPageVariant::Unauthenticated;
            }
        }

        if self.0.select("#flash_embed").is_ok() {
            return SubmissionPageVariant::FlashSubmission;
        }

        SubmissionPageVariant::ImageSubmission
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
            .select("div.views span")?
            .text()
            .parse()
            .with_context(|| "Could not parse view count")
    }

    pub fn get_comment_count(&self) -> Result<usize> {
        self.0
            .select("section.stats-container div.comments span")?
            .text()
            .parse()
            .with_context(|| "Could not parse comment count")
    }

    pub fn get_fave_count(&self) -> Result<usize> {
        self.0
            .select("div.favorites span")?
            .text()
            .parse()
            .with_context(|| "Could not parse fave count")
    }

    pub fn get_submission_download_url(&self) -> Result<String> {
        Ok(format!(
            "https:{}",
            self.0.select("div.download a")?.attr("href")?
        ))
    }

    pub fn get_thumbnail_download_url(&self) -> Result<String> {
        Ok(format!(
            "https:{}",
            self.0.select("#submissionImg")?.attr("data-preview-src")?
        ))
    }
}
