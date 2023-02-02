use super::html_string::HtmlString;

pub struct OpenGraphBuilder {
    metadata: Vec<String>,
}

impl OpenGraphBuilder {
    pub fn new() -> Self {
        Self {
            metadata: Vec::with_capacity(10),
        }
    }

    pub fn with_title(&mut self, title: &str) -> &mut Self {
        self.metadata.push(format!(
            r#"
            <meta property="og:title" content="{title}" />
            <meta name="twitter:title" content="{title}" />
            "#
        ));

        self
    }

    pub fn with_description(&mut self, description: &str) -> &mut Self {
        self.metadata.push(format!(
            r#"
            <meta property="og:description" content="{description}" />
            <meta name="twitter:description" content="{description}" />
            "#
        ));

        self
    }

    pub fn with_website_url(&mut self, url: &str) -> &mut Self {
        self.metadata.push(format!(
            r#"
            <meta property="og:url" content="{url}" />
            <meta name="twitter:url" content="{url}" />
            "#
        ));

        self
    }

    pub fn with_image(&mut self, image_url: &str, content_type: &str) -> &mut Self {
        self.metadata.push(format!(
            r#"
            <meta property="og:image" content="{image_url}" />
            <meta property="og:image:secure_url" content="{image_url}" />
            <meta name="twitter:image" content="{image_url}" />
            <meta property="og:image:type" content="{content_type}" />
            "#
        ));

        self
    }

    pub fn with_video(&mut self, video_url: &str, content_type: &str) -> &mut Self {
        self.metadata.push(format!(
            r#"
            <meta property="og:video" content="{video_url}">
            <meta property="og:video:url" content="{video_url}">
            <meta property="og:video:secure_url" content="{video_url}">
            <meta property="og:video:type" content="{content_type}">
            "#
        ));

        self
    }

    pub fn with_default_metadata(&mut self) -> &mut Self {
        self.metadata.push(
            r#"
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            "#
            .to_owned(),
        );

        self
    }

    pub fn build(&self) -> HtmlString {
        let built_metadata = self.metadata.join("\n");

        HtmlString(format!(
            r#"
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html lang="en" class="no-js" xmlns="http://www.w3.org/1999/xhtml">
            <head>
            {built_metadata}
            </head>
            </html>
            "#
        ))
    }
}
