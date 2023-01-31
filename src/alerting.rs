use worker::{Env, Fetch, Headers, Method, Request, RequestInit};

use crate::utils::get_secret;

pub async fn send_alert(env: &Env, body: &str) {
    let webhook_url = get_secret(env, "ALERTING_URL");

    let mut headers = Headers::new();
    headers.set("Content-Type", "text/plain").unwrap();

    let mut req_ini = RequestInit::new();
    req_ini.with_headers(headers);
    req_ini.with_method(Method::Post);
    req_ini.with_body(Some(body.into()));

    let req = Request::new_with_init(&webhook_url, &req_ini)
        .expect("Could not create the request to send an alert");

    Fetch::Request(req)
        .send()
        .await
        .expect("Could not send the alert");
}
