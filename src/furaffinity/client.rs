use anyhow::{anyhow, Context, Result};
use scraper::Html;
use worker::{console_log, Fetch, Method, Request, Response};

use super::{
    image_url::ImageUrl, pages::submission::SubmissionPage, submission_info::SubmissionInfo,
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
        let mut req = Request::new(uri, method).unwrap();

        let session_cookie = format!("a={}; b={}", self.credentials.a, self.credentials.b);
        req.headers_mut()
            .unwrap()
            .set("Cookie", &session_cookie)
            .unwrap();

        Fetch::Request(req)
            .send()
            .await
            .map_err(|e| anyhow!("{}", e))
    }

    pub fn get_submission_url(&self, submission_id: usize) -> String {
        format!("{BASE_URL}/view/{submission_id}")
    }

    pub async fn fetch_submission_info(&self, submission_id: usize) -> Result<SubmissionInfo> {
        let submission_url = self.get_submission_url(submission_id);

        let mut submission_response = self
            .fetch(&submission_url, Method::Get)
            .await
            .with_context(|| "Failed to fetch submission info from FA")?;

        let submission_bytes = submission_response
            .bytes()
            .await
            .map_err(|e| anyhow!("Could not get bytes from FA response: {}", e))?;

        let submission_html = String::from_utf8_lossy(&submission_bytes);
        let document = Html::parse_document(submission_html.as_ref());
        let page = SubmissionPage::new(&document);

        let image_size = self
            .fetch_image_size(&page.get_submission_download_url()?)
            .await?;

        Ok(SubmissionInfo {
            url: page.get_url()?,
            title: page.get_title()?,
            description: page.get_description()?,
            view_count: page.get_view_count()?,
            comment_count: page.get_comment_count()?,
            fave_count: page.get_fave_count()?,
            submission_image_url: ImageUrl::new(page.get_submission_download_url()?),
            submission_size_bytes: image_size,
            thumbnail_image_url: ImageUrl::new(page.get_thumbnail_download_url()?),
        })
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
