import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || 'dummy_client_id';
  // Use absolute URL since this redirect happens from the user's browser
  const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/userlooker/api/auth/discord/callback';
  const DISCORD_AUTH_URL = "https://discord.com/api/oauth2/authorize";

  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify",
    state: state,
  });

  const url = `${DISCORD_AUTH_URL}?${params.toString()}`;
  const response = NextResponse.redirect(url);

  response.cookies.set('discord_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return response;
}
