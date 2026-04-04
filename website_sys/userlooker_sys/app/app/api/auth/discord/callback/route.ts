import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'your-super-secret-jwt-key'
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  // Handle user denying the authorization request
  if (error) {
    return NextResponse.redirect(new URL('/userlooker/?error=access_denied', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/userlooker/?error=no_code', request.url));
  }

  // Verify state
  const savedState = request.cookies.get('discord_oauth_state')?.value;
  if (!state || state !== savedState) {
    return NextResponse.redirect(new URL('/userlooker/?error=invalid_state', request.url));
  }

  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || 'dummy_client_id';
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'dummy_client_secret';
  const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/userlooker/api/auth/discord/callback';
  const ADMIN_DISCORD_IDS = (process.env.ADMIN_DISCORD_IDS || '').split(',');

  // Exchange code for token
  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: DISCORD_REDIRECT_URI,
    }),
  });

  if (!tokenResponse.ok) {
    console.error('Failed to exchange token:', await tokenResponse.text());
    return NextResponse.redirect(new URL('/userlooker/?error=auth_failed', request.url));
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Get user info
  const userResponse = await fetch('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    console.error('Failed to get user info:', await userResponse.text());
    return NextResponse.redirect(new URL('/userlooker/?error=user_info_failed', request.url));
  }

  const userData = await userResponse.json();
  const discordId = userData.id;

  // Check if user is admin
  if (ADMIN_DISCORD_IDS.length > 0 && ADMIN_DISCORD_IDS[0] !== '' && !ADMIN_DISCORD_IDS.includes(discordId)) {
    return NextResponse.redirect(new URL('/userlooker/?error=unauthorized', request.url));
  }

  // Create response that redirects to dashboard
  const response = NextResponse.redirect(new URL('/userlooker/dashboard', request.url));

  // Create JWT token
  const jwt = await new SignJWT({ sub: discordId, username: userData.username, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  // Set auth cookie
  response.cookies.set('userlooker_auth', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });

  // Clear state cookie
  response.cookies.delete('discord_oauth_state');

  return response;
}
