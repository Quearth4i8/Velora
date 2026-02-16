import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/db/postgres';
import { serialize } from 'cookie';

const SESSION_COOKIE = 'velora_session';

export async function POST() {
  try {
    const result = await postgres.auth.signOut();
    
    // Clear session cookie
    const cookie = serialize(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: -1, // Expire immediately
      path: '/'
    });
    
    const response = NextResponse.json(result);
    response.headers.set('Set-Cookie', cookie);
    
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
