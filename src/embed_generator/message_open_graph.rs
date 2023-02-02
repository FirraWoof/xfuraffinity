use super::{html_string::HtmlString, open_graph_builder::OpenGraphBuilder};

pub fn generate_message_opengraph_embed(title: &str, body: &str) -> HtmlString {
    let mut builder = OpenGraphBuilder::new();

    builder
        .with_default_metadata()
        .with_title(title)
        .with_description(body)
        .build()
}
