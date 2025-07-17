use furaffinity::client::FurAffinity;
use submission_handler::handle_submission;
use utils::{get_furaffinity_session, log_request};
use worker::*;

mod alerting;
mod embed_generator;
mod furaffinity;
mod requester;
mod submission_handler;
mod utils;

#[event(fetch)]
pub async fn main(req: Request, env: Env, _ctx: worker::Context) -> Result<Response> {
    log_request(&req);
    utils::set_panic_hook();

    // Optionally, use the Router to handle matching endpoints, use ":name" placeholders, or "*name"
    // catch-alls to match on specific patterns.
    let session = get_furaffinity_session(&env);
    let client = FurAffinity::new(session);
    let router = Router::with_data(client);

    router
        .get("/", |_, _| {
            Response::redirect(Url::parse("https://firrawoof.github.io/xfuraffinity/").unwrap())
        })
        .get_async("/view/:id", handle_submission)
        .get_async("/view/:id/", handle_submission)
        .get_async("/full/:id", handle_submission)
        .get_async("/full/:id/", handle_submission)
        .run(req, env)
        .await
}
