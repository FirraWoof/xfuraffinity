use super::html_string::HtmlString;

pub fn generate_message_opengraph_embed(title: &str, body: &str) -> HtmlString {
    HtmlString(format!(
        r#"
          <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
          <html lang="en" class="no-js" xmlns="http://www.w3.org/1999/xhtml">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />

            <meta property="og:type" content="website" />
            <meta property="og:title" content="{title}" />
            <meta name="twitter:title" content="{title}" />

            <meta property="og:description" content="{body}" />
            <meta name="twitter:description" content="{body}" />

            <meta name="twitter:card" content="summary_large_image" />
          </head>
          </html>
        "#
    ))
}
