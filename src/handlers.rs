use worker::{Request, Response, RouteContext};

use crate::furaffinity::client::{FurAffinity, FurAffinitySession};

pub async fn handle_submission(
    mut req: Request,
    context: RouteContext<()>,
) -> Result<Response, worker::Error> {
    let client = FurAffinity::new(FurAffinitySession::new("".to_string(), "".to_string()));

    let info = client
        .fetch_submission_info(context.param("id").unwrap().parse().unwrap())
        .await
        .unwrap();

    Ok(Response::from_json(&info).unwrap())
}
