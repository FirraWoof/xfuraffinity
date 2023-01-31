use serde::Serialize;

#[derive(Debug, Serialize)]
pub enum ContentType {
    ImageJpeg,
    ImagePng,
    ImageGif,
    VideoMp4,
}
