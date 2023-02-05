use serde::Serialize;

use super::image_url::ImageUrl;

#[derive(Debug, Serialize)]
pub struct SubmissionInfo {
    pub url: String,
    pub title: String,
    pub description: String,
    pub view_count: usize,
    pub comment_count: usize,
    pub fave_count: usize,
    pub submission_image_url: ImageUrl,
    pub submission_size_bytes: usize,
    pub thumbnail_image_url: ImageUrl,
}
