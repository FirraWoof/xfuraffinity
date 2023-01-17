package requesting_entities

import "strings"

type Entity string

const (
	Human    Entity = "human"
	Telegram        = "telegram"
	Discord         = "discord"
	Other           = "other"
)

// DetermineRequestingEntity determines whether the request user-agent belongs to a human.
// Bot user-agents must not start with `Mozilla/`, except for the Discord bot, which uses a browser-like user-agent.
// Use this for user agents https://developers.whatismybrowser.com/useragents/explore/
func DetermineRequestingEntity(userAgent string) Entity {
	if strings.Contains(userAgent, "TelegramBot") {
		return Telegram
	}

	if strings.Contains(userAgent, "Discordbot") {
		return Discord
	}

	if strings.HasPrefix(userAgent, "Mozilla/") {
		return Human
	}

	return Other
}
