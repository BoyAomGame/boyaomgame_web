export async function fetchDiscordUser(discordId) {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
        console.warn("DISCORD_BOT_TOKEN is not set. Discord live lookup skipped.");
        return null;
    }

    try {
        const response = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
            headers: {
                "Authorization": `Bot ${botToken}`,
                "Content-Type": "application/json"
            },
            next: {
                revalidate: 86400 // Cache Discord API response for 24h at the fetch level
            }
        });

        if (response.status === 429) {
            console.warn(`Discord API rate limit hit for ${discordId}`);
            return 'RATE_LIMIT';
        }

        if (response.status === 404) {
             return null;
        }

        if (!response.ok) {
            throw new Error(`Discord API error: ${response.status}`);
        }

        const data = await response.json();
        return {
            id: data.id,
            username: data.username,
            avatar_url: data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` : null,
            banner_color: data.banner_color,
            fetched_at: new Date().toISOString()
        };
    } catch (error) {
        console.error(`Error fetching Discord user ${discordId}:`, error);
        return null; // Graceful degradation
    }
}
