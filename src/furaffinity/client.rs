use anyhow::{anyhow, Context, Result};
use scraper::Html;
use worker::{console_log, Fetch, Headers, Method, Request, RequestInit, Response};

use crate::furaffinity::pages::submission::SubmissionPageVariant;

use super::{
    image_url::ImageUrl,
    pages::submission::SubmissionPage,
    submission_info::{SubmissionInfo, SubmissionInfoResponse},
};

const BASE_URL: &str = "https://www.furaffinity.net";

#[derive(Debug)]
pub struct FurAffinity {
    credentials: FurAffinitySession,
}

#[derive(Debug)]
pub struct FurAffinitySession {
    a: String,
    b: String,
}

impl FurAffinitySession {
    pub fn new(a: String, b: String) -> Self {
        FurAffinitySession { a, b }
    }
}

impl FurAffinity {
    pub fn new(credentials: FurAffinitySession) -> Self {
        FurAffinity { credentials }
    }

    async fn fetch(&self, uri: &str, method: Method) -> Result<Response> {
        console_log!("{method:?}\t{uri}");

        let session_cookie = format!("a={}; b={}", self.credentials.a, self.credentials.b);
        let headers = Headers::new();
        headers
            .set("Cookie", &session_cookie)
            .map_err(|e| anyhow!("{}", e))?;
        headers
            .set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
            .map_err(|e| anyhow!("{}", e))?;
        headers
            .set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8")
            .map_err(|e| anyhow!("{}", e))?;
        headers
            .set("Accept-Language", "en-US,en;q=0.9")
            .map_err(|e| anyhow!("{}", e))?;
        headers
            .set("Sec-Fetch-Dest", "document")
            .map_err(|e| anyhow!("{}", e))?;
        headers
            .set("Sec-Fetch-Mode", "navigate")
            .map_err(|e| anyhow!("{}", e))?;
        headers
            .set("Sec-Fetch-Site", "none")
            .map_err(|e| anyhow!("{}", e))?;
        headers
            .set("Sec-Fetch-User", "?1")
            .map_err(|e| anyhow!("{}", e))?;
        headers
            .set("Upgrade-Insecure-Requests", "1")
            .map_err(|e| anyhow!("{}", e))?;

        let mut init = RequestInit::new();
        init.with_method(method).with_headers(headers);

        let req = Request::new_with_init(uri, &init).map_err(|e| anyhow!("{}", e))?;
        Fetch::Request(req)
            .send()
            .await
            .map_err(|e| anyhow!("{}", e))
    }

    pub fn get_submission_url(&self, submission_id: usize) -> String {
        format!("{BASE_URL}/view/{submission_id}")
    }

    pub async fn fetch_submission_info(
        &self,
        submission_id: usize,
    ) -> Result<SubmissionInfoResponse> {
        let submission_url = self.get_submission_url(submission_id);

        let mut submission_response = self
            .fetch(&submission_url, Method::Get)
            .await
            .with_context(|| "Failed to fetch submission info from FA")?;

        if submission_response.status_code() >= 500 {
            return Ok(SubmissionInfoResponse::ServerError);
        }

        let submission_bytes = submission_response
            .bytes()
            .await
            .map_err(|e| anyhow!("Could not get bytes from FA response: {}", e))?;

        let submission_html = String::from_utf8_lossy(&submission_bytes);
        console_log!("Submission HTML\n\n{}\n\n", submission_html);
        let document = Html::parse_document(submission_html.as_ref());
        let page = SubmissionPage::new(&document);

        let page_variant = page.get_variant();
        console_log!("Submission {submission_id}: page variant is {page_variant:?}");
        match page_variant {
            SubmissionPageVariant::NotFound => return Ok(SubmissionInfoResponse::NotFound),
            SubmissionPageVariant::Unauthenticated => {
                return Ok(SubmissionInfoResponse::Unauthenticated)
            }
            SubmissionPageVariant::Blocked => return Ok(SubmissionInfoResponse::Blocked),
            SubmissionPageVariant::FlashSubmission => {
                return Ok(SubmissionInfoResponse::FlashSubmission)
            }
            SubmissionPageVariant::ImageSubmission => {}
        }

        let download_url = page.get_submission_download_url().with_context(|| {
            format!("Submission {submission_id}: failed to extract download URL (div.download a)")
        })?;
        console_log!("Submission {submission_id}: download URL = {download_url}");

        let thumbnail_url = page.get_thumbnail_download_url().with_context(|| {
            format!("Submission {submission_id}: failed to extract thumbnail URL (#submissionImg)")
        })?;
        console_log!("Submission {submission_id}: thumbnail URL = {thumbnail_url}");

        let image_size = self.fetch_image_size(&download_url).await?;

        Ok(SubmissionInfoResponse::ImageSubmission(SubmissionInfo {
            url: page.get_url()?,
            title: page.get_title()?,
            description: page.get_description()?,
            view_count: page.get_view_count()?,
            comment_count: page.get_comment_count()?,
            fave_count: page.get_fave_count()?,
            submission_image_url: ImageUrl::new(download_url),
            submission_size_bytes: image_size,
            thumbnail_image_url: ImageUrl::new(thumbnail_url),
        }))
    }

    async fn fetch_image_size(&self, image_url: &str) -> Result<usize> {
        let submission_response = self
            .fetch(image_url, Method::Head)
            .await
            .with_context(|| "Failed to query FA for submission info")?;

        let image_size = submission_response
            .headers()
            .get("content-length")
            .unwrap()
            .ok_or_else(|| anyhow!("content-length header missing"))?
            .parse()
            .with_context(|| "Could not parse content-length header value")?;

        Ok(image_size)
    }
}
