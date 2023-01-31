use worker::{Request, Response, RouteContext, Url};

use crate::embed_generator::telegram_open_graph::generate_telegram_opengraph_embed;
use crate::{furaffinity::client::FurAffinity, requester::Requester};

// TODO Better handle errors & either generate an embed to show the error, or log something, or both
// TODO: weird bug where it works locally but not on the worker, even though the worker seems to receive html??
//       It's just missing the #columnpage section for views and whatnot, and the submission image is present, so auth is unlikely to be the issue
pub async fn handle_submission(
    req: Request,
    context: RouteContext<FurAffinity>,
) -> Result<Response, worker::Error> {
    let submission_id = context.param("id").unwrap().parse().unwrap();

    let requester = Requester::from_user_agent(
        req.headers()
            .get("user-agent")
            .unwrap()
            .unwrap_or_default()
            .as_str(),
    );

    if let Requester::Human = requester {
        return Ok(Response::redirect(
            Url::parse(&format!("https://furaffinity.net/view/{submission_id}")).unwrap(),
        )
        .unwrap());
    }

    let info = context
        .data
        .fetch_submission_info(submission_id)
        .await
        .unwrap();

    let embed = match requester {
        Requester::Telegram => generate_telegram_opengraph_embed(&info).unwrap(),
        Requester::OtherBot => todo!(),
        Requester::Human => panic!("Humans are handled above"),
    };

    Ok(Response::from(embed))
}
