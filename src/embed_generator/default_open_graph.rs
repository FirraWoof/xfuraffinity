use super::{html_string::HtmlString, open_graph_builder::OpenGraphBuilder};

pub fn generate_default_opengraph_embed() -> HtmlString {
    let mut builder = OpenGraphBuilder::new();

    builder
        .with_default_metadata()
        .with_title("Login Required -- Fur Affinity [dot] net")
        .with_description("Fur Affinity | For all things fluff, scaled, and feathered!")
        .with_image(
            "https://www.furaffinity.net/themes/beta/img/banners/fa_logo.png?v2",
            "image/png",
        )
        .build()
}
