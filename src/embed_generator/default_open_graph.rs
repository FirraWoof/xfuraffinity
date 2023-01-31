use super::html_string::HtmlString;

pub fn generate_default_opengraph_embed() -> HtmlString {
    HtmlString(
      r#"
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html lang="en" class="no-js" xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta property="og:image" content="https://www.furaffinity.net/themes/beta/img/banners/fa_logo.png?v2">
          <meta property="og:title" content="Login Required -- Fur Affinity [dot] net" />
          <meta property="og:description" content="Fur Affinity | For all things fluff, scaled, and feathered!" />
          <meta name="twitter:image" content="https://www.furaffinity.net/themes/beta/img/banners/fa_logo.png?v2">
          <meta name="twitter:title" content="Login Required -- Fur Affinity [dot] net" />
          <meta name="twitter:description" content="Fur Affinity | For all things fluff, scaled, and feathered!" />
        </head>
        </html>
      "#.to_owned(),
    )
}
