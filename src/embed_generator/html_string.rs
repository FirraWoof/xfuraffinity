use std::ops::Deref;

use worker::{Headers, Response};

#[derive(Debug)]
pub struct HtmlString(pub String);

impl Deref for HtmlString {
    type Target = str;

    fn deref(&self) -> &Self::Target {
        self.0.as_ref()
    }
}

impl From<HtmlString> for Response {
    fn from(value: HtmlString) -> Self {
        let mut headers = Headers::default();
        headers
            .append("Content-Type", "text/html; charset=utf-8")
            .unwrap();

        Response::from_html(value.0).unwrap().with_headers(headers)
    }
}
