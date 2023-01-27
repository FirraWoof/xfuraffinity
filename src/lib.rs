use furaffinity::client::FurAffinity;
use handlers::handle_submission;
use utils::get_furaffinity_session;
use worker::*;

mod furaffinity;
mod handlers;
mod utils;

fn log_request(req: &Request) {
    console_log!(
        "{} - [{}], located at: {:?}, within: {}",
        Date::now().to_string(),
        req.path(),
        req.cf().coordinates().unwrap_or_default(),
        req.cf().region().unwrap_or_else(|| "unknown region".into())
    );
}

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
        .run(req, env)
        .await
}
