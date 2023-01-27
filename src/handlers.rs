use worker::{Request, Response, RouteContext};

use crate::furaffinity::client::FurAffinity;

pub async fn handle_submission(
    mut _req: Request,
    context: RouteContext<FurAffinity>,
) -> Result<Response, worker::Error> {
    let info = context
        .data
        .fetch_submission_info(context.param("id").unwrap().parse().unwrap())
        .await
        .unwrap();

    Ok(Response::from_json(&info).unwrap())
}
