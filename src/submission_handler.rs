use anyhow::Context;
use worker::{Request, Response, RouteContext, Url};

use crate::alerting::send_alert;
use crate::embed_generator::default_open_graph::generate_default_opengraph_embed;
use crate::embed_generator::message_open_graph::generate_message_opengraph_embed;
use crate::embed_generator::telegram_embed_open_graph::generate_telegram_opengraph_embed;
use crate::{furaffinity::client::FurAffinity, requester::Requester};

pub async fn handle_submission(
    req: Request,
    context: RouteContext<FurAffinity>,
) -> Result<Response, worker::Error> {
    let result = handle_submission_inner(req, &context).await;

    if let Err(e) = &result {
        send_alert(&context.env, &format!("{:?}", e)).await;
    }

    match result {
        Ok(resp) => Ok(resp),
        Err(_) => Ok(Response::from(generate_default_opengraph_embed())),
    }
}

async fn handle_submission_inner(
    req: Request,
    context: &RouteContext<FurAffinity>,
) -> anyhow::Result<Response> {
    let submission_id = context.param("id").unwrap().parse();
    if submission_id.is_err() {
        return Ok(Response::from(generate_message_opengraph_embed(
            "User Error",
            "Please use a valid submission URL to generate an embed.",
        )));
    }
    let submission_id = submission_id.unwrap();

    let requester = Requester::from_user_agent(
        req.headers()
            .get("user-agent")
            .unwrap()
            .unwrap_or_default()
            .as_str(),
    );

    if let Requester::Human = requester {
        return Ok(Response::redirect(
            Url::parse(&context.data.get_submission_url(submission_id)).unwrap(),
        )
        .unwrap());
    }

    let info = context
        .data
        .fetch_submission_info(submission_id)
        .await
        .with_context(|| format!("Failed to fetch submission info for {submission_id}"))?;

    let embed = match requester {
        Requester::Telegram => generate_telegram_opengraph_embed(&info)?,
        Requester::OtherBot => todo!(),
        Requester::Human => panic!("Humans are handled above"),
    };

    Ok(Response::from(embed))
}
