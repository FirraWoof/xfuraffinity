use anyhow::Result;
use serde::Serialize;

use super::{client::FurAffinity, image_url::ImageUrl};

#[derive(Debug, Serialize)]
pub enum ContentType {
    ImageJpeg,
    ImagePng,
    ImageGif,
    VideoMp4,
}

#[derive(Debug, Serialize)]
pub struct SubmissionImage<'a> {
    #[serde(skip)]
    client: &'a FurAffinity,
    download_url: ImageUrl,
    size_in_bytes: Option<usize>,
}

impl<'a> SubmissionImage<'a> {
    pub fn new(client: &'a FurAffinity, url: ImageUrl) -> Self {
        SubmissionImage {
            client,
            download_url: url,
            size_in_bytes: None,
        }
    }

    pub fn content_type(&self) -> Result<ContentType> {
        self.download_url.guess_content_type()
    }

    pub fn url(&self) -> &str {
        &self.download_url
    }

    pub async fn fetch_size(&mut self) -> Result<usize> {
        if let Some(size) = self.size_in_bytes {
            Ok(size)
        } else {
            let submission_response = self.client.fetch_image_size(&self.download_url).await?;
            self.size_in_bytes = Some(submission_response);
            Ok(submission_response)
        }
    }
}
