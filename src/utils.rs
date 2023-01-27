use std::env;

use cfg_if::cfg_if;
use worker::{Env, RouteContext};

use crate::furaffinity::client::FurAffinitySession;

cfg_if! {
    // https://github.com/rustwasm/console_error_panic_hook#readme
    if #[cfg(feature = "console_error_panic_hook")] {
        extern crate console_error_panic_hook;
        pub use self::console_error_panic_hook::set_once as set_panic_hook;
    } else {
        #[inline]
        pub fn set_panic_hook() {}
    }
}

pub fn get_furaffinity_session(env: &Env) -> FurAffinitySession {
    if env.var("WORKERS_RS_VERSION").is_ok() {
        FurAffinitySession::new(
            env.secret("SESSION_A")
                .expect("Missing SESSION_A secret")
                .to_string(),
            env.secret("SESSION_B")
                .expect("Missing SESSION_B secret")
                .to_string(),
        )
    } else {
        FurAffinitySession::new(
            env.var("SESSION_A")
                .expect("Missing SESSION_A env var")
                .to_string(),
            env.var("SESSION_B")
                .expect("Missing SESSION_B env var")
                .to_string(),
        )
    }
}
