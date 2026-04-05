import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { fetchDiscordUser } from '../../../lib/discord';

const DISCORD_SNOWFLAKE_REGEX = /^\d{17,19}$/;

export async function GET(request, { params }) {
  const { id } = await params;

  if (!DISCORD_SNOWFLAKE_REGEX.test(id)) {
    return NextResponse.json(
      { success: false, error: "Invalid Discord ID" },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.DB_NAME || 'discord_data';
    const db = client.db(dbName);

    console.log(`[user route] DB_NAME=${dbName}, searching user_profiles for _id=${id} (type: ${typeof id})`);

    // Step 1: Internal lookup
    const userProfile = await db.collection('user_profiles').findOne({ _id: id });

    console.log(`[user route] findOne result: ${userProfile ? 'FOUND' : 'NOT FOUND'}`);

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "User not found in archive" },
        { status: 404 }
      );
    }

    // Step 2: External lookup (optimized via caching logic)
    let discordData = null;
    let rateLimitHit = false;

    // Check if we need to ping Discord based on MongoDB avatar age (24hrs cache)
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const updatedAtTime = userProfile.updated_at ? new Date(userProfile.updated_at).getTime() : 0;
    const nowTime = new Date().getTime();
    
    // Fetch if stale OR if stored avatar is not from Discord CDN (e.g. B2 URL)
    const hasDiscordAvatar = userProfile.avatar_url && userProfile.avatar_url.includes('cdn.discordapp.com');
    if (nowTime - updatedAtTime > ONE_DAY_MS || !hasDiscordAvatar) {
        discordData = await fetchDiscordUser(id);
        
        if (discordData === 'RATE_LIMIT') {
             rateLimitHit = true;
             discordData = null;
        } else if (discordData) {
            // Background update to MongoDB with fresh Discord data
             db.collection('user_profiles').updateOne(
                { _id: id },
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
    const primaryName = userProfile.primary_roblox_username || null;
    const allRobloxNames = userProfile.roblox_usernames || [];

    const responseData = {
      success: true,
      data: {
        discord: {
          id: id,
          username: discordData?.username || userProfile.discord_username || "Unknown",
          avatar_url: discordData?.avatar_url || userProfile.avatar_url || null,
          banner_color: discordData?.banner_color || null // We don't store banner color in DB currently
        },
        roblox: {
          primary_name: primaryName,
          history: allRobloxNames
        },
        stats: {
          total_messages: userProfile.message_count || 0,
          first_seen: userProfile.first_seen,
          last_seen: userProfile.last_seen,
          guild_count: userProfile.guild_count || 0,
          heatmap: userProfile.heatmap || {}
        }
      }
    };

    const statusObj = rateLimitHit ? { status: 200, headers: { 'X-Rate-Limited': 'true' } } : { status: 200 };
    return NextResponse.json(responseData, statusObj);

  } catch (error) {
    console.error("API Error fetching user:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
