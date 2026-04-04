import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { fetchDiscordUser } from '../../../lib/discord';

export async function GET(request, { params }) {
  // Get the username and decode it
  const roblox_username_raw = (await params).roblox_username;
  if (!roblox_username_raw || typeof roblox_username_raw !== 'string') {
    return NextResponse.json(
      { success: false, error: "Invalid Roblox Username" },
      { status: 400 }
    );
  }
  const roblox_username = decodeURIComponent(roblox_username_raw);

  try {
    const client = await clientPromise;
    const dbName = process.env.DB_NAME || 'discord_data';
    const db = client.db(dbName);

    // Step 1: Find roblox user in known_users collection
    // Use case-insensitive search for robust matching
    const knownUser = await db.collection('known_users').findOne({ 
      RobloxUsername: { $regex: new RegExp(`^${roblox_username}$`, 'i') } 
    });

    let profilesResult = [];
    let discordIds = [];
    let primaryName = roblox_username;

    if (!knownUser) {
        // If not found in known_users, check user_profiles history as fallback
        const profileFallback = await db.collection('user_profiles').find({
            roblox_usernames: { $regex: new RegExp(`^${roblox_username}$`, 'i') }
        }).toArray();

        // If even fallback fails
        if (!profileFallback || profileFallback.length === 0) {
            return NextResponse.json(
              { success: false, error: `Roblox user '${roblox_username}' not found in known_users or profile fallbacks` },
              { status: 404 }
            );
        }
        
        // Use fallback profiles
        profilesResult = profileFallback;
        discordIds = profileFallback.map(p => p._id);
    } else {
        const discordAccounts = knownUser.DiscordAccounts || [];
        discordIds = discordAccounts.map(acc => acc.DiscordUserId).filter(Boolean);
        primaryName = knownUser.RobloxUsername;

        if (discordIds.length === 0) {
          return NextResponse.json(
            { success: false, error: `Roblox user '${roblox_username}' found, but No associated Discord accounts in known_users` },
            { status: 404 }
          );
        }

        // Step 2: Fetch pre-computed data from user_profiles
        profilesResult = await db.collection('user_profiles').find({
          _id: { $in: discordIds }
        }).toArray();

        if (profilesResult.length === 0) {
          return NextResponse.json(
            { success: false, error: `No profile data found in user_profiles for associated Discord IDs: ${discordIds.join(',')}` },
            { status: 404 }
          );
        }
    }

    // Step 3: Aggregate data
    let totalMessages = 0;
    let firstSeen = null;
    let lastSeen = null;
    let maxGuildCount = 0;
    const heatmap = {};
    const allRobloxNamesSet = new Set([primaryName]);

    // Track the primary profile (the one with the most messages) to represent the user in the 'discord' object
    let primaryProfile = profilesResult[0];

    for (const profile of profilesResult) {
      if (profile.message_count && profile.message_count > (primaryProfile.message_count || 0)) {
        primaryProfile = profile;
      }

      totalMessages += (profile.message_count || 0);

      if (profile.guild_count && profile.guild_count > maxGuildCount) {
        maxGuildCount = profile.guild_count;
      }

      if (profile.first_seen) {
        const pfTime = new Date(profile.first_seen).getTime();
        if (!firstSeen || pfTime < new Date(firstSeen).getTime()) {
          firstSeen = profile.first_seen;
        }
      }

      if (profile.last_seen) {
        const plTime = new Date(profile.last_seen).getTime();
        if (!lastSeen || plTime > new Date(lastSeen).getTime()) {
          lastSeen = profile.last_seen;
        }
      }

      if (profile.roblox_usernames) {
        profile.roblox_usernames.forEach(name => allRobloxNamesSet.add(name));
      }

      // Aggregate heatmap
      if (profile.heatmap) {
        for (const day in profile.heatmap) {
          if (!heatmap[day]) heatmap[day] = {};
          for (const hour in profile.heatmap[day]) {
            heatmap[day][hour] = (heatmap[day][hour] || 0) + profile.heatmap[day][hour];
          }
        }
      }
    }

    // Step 4: External lookup for the primary profile (optimized via caching logic)
    let discordData = null;
    let rateLimitHit = false;

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const updatedAtTime = primaryProfile.updated_at ? new Date(primaryProfile.updated_at).getTime() : 0;
    const nowTime = new Date().getTime();
    
    // Fetch if stale OR if stored avatar is not from Discord CDN (e.g. B2 URL)
    const hasDiscordAvatar = primaryProfile.avatar_url && primaryProfile.avatar_url.includes('cdn.discordapp.com');
    if (nowTime - updatedAtTime > ONE_DAY_MS || !hasDiscordAvatar) {
        discordData = await fetchDiscordUser(primaryProfile._id);
        
        if (discordData === 'RATE_LIMIT') {
             rateLimitHit = true;
             discordData = null;
        } else if (discordData) {
            // Background update to MongoDB with fresh Discord data
             db.collection('user_profiles').updateOne(
                { _id: primaryProfile._id },
                { 
                    $set: { 
                        discord_username: discordData.username, 
                        avatar_url: discordData.avatar_url,
                        updated_at: new Date()
                    } 
                }
            ).catch(err => console.error("Failed to update profile silently:", err));
        }
    }

    // Prepare response schema
    const allRobloxNames = Array.from(allRobloxNamesSet);

    const responseData = {
      success: true,
      data: {
        discord: {
          id: primaryProfile._id,
          username: discordData?.username || primaryProfile.discord_username || "Unknown",
          avatar_url: discordData?.avatar_url || primaryProfile.avatar_url || null,
          banner_color: discordData?.banner_color || null 
        },
        roblox: {
          primary_name: primaryName,
          history: allRobloxNames
        },
        stats: {
          total_messages: totalMessages,
          first_seen: firstSeen,
          last_seen: lastSeen,
          guild_count: maxGuildCount,
          heatmap: heatmap
        },
        // We output associated discord ids in case the frontend needs to indicate multiple accounts
        associated_discord_ids: discordIds
      }
    };

    const statusObj = rateLimitHit ? { status: 200, headers: { 'X-Rate-Limited': 'true' } } : { status: 200 };
    return NextResponse.json(responseData, statusObj);

  } catch (error) {
    console.error("API Error fetching roblox search:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
