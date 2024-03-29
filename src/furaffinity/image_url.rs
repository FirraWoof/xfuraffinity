use anyhow::{anyhow, Result};
use std::ops::Deref;

use super::content_type::ContentType;

#[derive(Debug)]
pub struct ImageUrl(String);

impl Deref for ImageUrl {
    type Target = str;

    fn deref(&self) -> &Self::Target {
        self.0.as_ref()
    }
}

impl ImageUrl {
    pub fn new(url: String) -> Self {
        Self(url)
    }

    pub fn guess_content_type(&self) -> Result<ContentType> {
        let ext = self
            .0
            .split('.')
            .last()
            .ok_or_else(|| anyhow!("Could not determine submission file extension"))?;

        Ok(match ext {
            "jpg" => ContentType::ImageJpeg,
            "jpeg" => ContentType::ImageJpeg,
            "png" => ContentType::ImagePng,
            "gif" => ContentType::ImageGif,
            "mp4" => ContentType::VideoMp4,
            _ => Err(anyhow!(
                "Content type from url {} was not recognized",
                self.0
            ))?,
        })
    }
}
