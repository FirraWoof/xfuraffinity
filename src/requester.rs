pub enum Requester {
    Human,
    Telegram,
    OtherBot,
}

impl Requester {
    pub fn from_user_agent(user_agent: &str) -> Requester {
        let normalized = user_agent.to_lowercase();
        if normalized.contains("telegram") {
            return Requester::Telegram;
        }

        if normalized.starts_with("mozilla/5.0") {
            if normalized.contains("facebook")
                || normalized.contains("valve steam")
                || normalized.contains("slack")
                || normalized.contains("discord")
            {
                return Requester::OtherBot;
            } else {
                return Requester::Human;
            }
        }

        Requester::OtherBot
    }
}
