use anyhow::Context;
use worker::{Request, Response, RouteContext, Url};

use crate::alerting::send_alert;
use crate::embed_generator::default_open_graph::generate_default_opengraph_embed;
use crate::embed_generator::generic_embed_open_graph::generate_generic_opengraph_embed;
use crate::embed_generator::message_open_graph::generate_message_opengraph_embed;
use crate::embed_generator::telegram_embed_open_graph::generate_telegram_opengraph_embed;
use crate::furaffinity::submission_info::SubmissionInfoResponse;
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

    let info_response = context
        .data
        .fetch_submission_info(submission_id)
        .await
        .with_context(|| format!("Failed to fetch submission info for {submission_id}"))?;

    let embed = match info_response {
        SubmissionInfoResponse::ImageSubmission(info) => match requester {
            Requester::Telegram => generate_telegram_opengraph_embed(&info)?,
            Requester::OtherBot => generate_generic_opengraph_embed(&info)?,
            Requester::Human => generate_generic_opengraph_embed(&info)?,
        },
        SubmissionInfoResponse::FlashSubmission => generate_message_opengraph_embed(
            "Unsupported Submission",
            "Flash content cannot be shown as a preview",
        ),
        SubmissionInfoResponse::NotFound => generate_message_opengraph_embed(
            "Not Found",
            &format!("The submission {submission_id} was not found on FurAffinity"),
        ),
        SubmissionInfoResponse::ServerError => generate_message_opengraph_embed(
            "FA Down",
            "FurAffinity responded with a server error, which means it's probably down at the moment, or encountered an error"
        ),
    };

    Ok(Response::from(embed))
}
