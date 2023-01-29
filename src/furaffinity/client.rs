use std::convert::TryFrom;

use anyhow::{anyhow, Context, Result};
use worker::{Fetch, Method, Request, Response};

use super::{html_wrapper::HtmlString, image_url::ImageUrl, submission_info::SubmissionInfo};

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

    pub async fn fetch_submission_info(&self, submission_id: usize) -> Result<SubmissionInfo> {
        let submission_url = format!("https://furaffinity.net/view/{}", submission_id);
        let mut submission_response = self
            .fetch(&submission_url, Method::Get)
            .await
            .with_context(|| "Failed to query FA for submission info".to_string())?;

        let submission_html = submission_response
            .text()
            .await
            .map_err(|e| anyhow!("Could not parse the response from FA: {}", e))?;

        SubmissionInfo::try_from(HtmlString(submission_html))
    }

    pub async fn fetch_image_size(&self, image_url: &ImageUrl) -> Result<usize> {
        let submission_response = self
            .fetch(image_url, Method::Head)
            .await
            .with_context(|| "Failed to query FA for submission info".to_string())?;

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
