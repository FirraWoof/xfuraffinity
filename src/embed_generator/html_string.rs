use std::ops::Deref;

use worker::Response;

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
        Response::from_html(value.0).unwrap()
    }
}
