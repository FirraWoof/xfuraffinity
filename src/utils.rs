use cfg_if::cfg_if;
use worker::{console_log, Date, Env, Request};

use crate::furaffinity::client::FurAffinitySession;

cfg_if! {
    if #[cfg(feature = "console_error_panic_hook")] {
        extern crate console_error_panic_hook;
        pub use self::console_error_panic_hook::set_once as set_panic_hook;
    } else {
        #[inline]
        pub fn set_panic_hook() {}
    }
}

pub fn log_request(req: &Request) {
    console_log!(
        "{} - [{}], located at: {:?}, within: {}",
        Date::now().to_string(),
        req.path(),
        req.cf().coordinates().unwrap_or_default(),
        req.cf().region().unwrap_or_else(|| "unknown region".into())
    );
}

pub fn get_secret(env: &Env, var: &str) -> String {
    if env.var("WORKERS_RS_VERSION").is_ok() {
        env.secret(var)
            .unwrap_or_else(|_| panic!("Missing required secret {}", var))
            .to_string()
    } else {
        env.var(var)
            .unwrap_or_else(|_| panic!("Missing required variable {}", var))
            .to_string()
    }
}

pub fn get_furaffinity_session(env: &Env) -> FurAffinitySession {
    FurAffinitySession::new(get_secret(env, "SESSION_A"), get_secret(env, "SESSION_B"))
}
