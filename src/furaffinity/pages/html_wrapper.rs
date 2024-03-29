use anyhow::{anyhow, Context, Result};
use scraper::{ElementRef, Selector};

pub struct HtmlElement<'a> {
    element: ElementRef<'a>,
}

impl<'a> From<ElementRef<'a>> for HtmlElement<'a> {
    fn from(element: ElementRef<'a>) -> Self {
        Self { element }
    }
}

impl<'a> HtmlElement<'a> {
    pub fn select(&self, selection: &str) -> Result<Self> {
        Ok(self
            .element
            .select(&Selector::parse(selection).unwrap())
            .next()
            .ok_or_else(|| {
                anyhow!(
                    "Selector `{selection}` matched no DOM elements on `{:?}`",
                    self.element.value()
                )
            })?
            .into())
    }

    pub fn attr(&self, attr: &str) -> Result<String> {
        self.element
            .value()
            .attr(attr)
            .with_context(|| {
                format!(
                    "Could not find attr `{attr}` on DOM element `{:?}`",
                    self.element.value()
                )
            })
            .map(|v| v.to_string())
    }

    pub fn text(&self) -> String {
        self.element.text().collect::<Vec<_>>().join("")
    }
}
