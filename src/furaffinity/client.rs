use std::convert::TryFrom;

use anyhow::{anyhow, Context, Result};
use serde::Serialize;
use worker::{Fetch, Method, Request, Response};

// TODO: Furaffinity client abstracting auth and whatnot
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

#[derive(Debug)]
pub struct HtmlString(String);

impl HtmlString {
    pub fn value(self) -> String {
        self.0
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
}

#[derive(Debug, Serialize)]
pub struct SubmissionInfo {
    pub url: String,
    pub title: String,
    pub description: String,
    pub view_count: usize,
    pub comment_count: usize,
    pub fave_count: usize,
    pub submission_media: Media,
    pub thumbnail_media: Media,
}

#[derive(Debug, Serialize)]
pub struct Media {
    pub download_url: String,
    pub content_type: ContentType,
}

#[derive(Debug, Serialize)]
pub enum ContentType {
    ImageJpeg,
    ImagePng,
    ImageGif,
    VideoMp4,
}
