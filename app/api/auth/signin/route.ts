import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/db/postgres';
import { serialize } from 'cookie';

const SESSION_COOKIE = 'velora_session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Signin attempt:', email);
    
    const result = await postgres.auth.signInWithPassword({ email, password });
    
    if (result.error) {
      console.error('Signin error:', result.error);
      return NextResponse.json(result, { status: 400 });
    }
    
    console.log('Signin success:', result.data?.user?.id);
    
    // Set session cookie
    const sessionData = JSON.stringify({
      user: result.data.user,
      session: result.data.session
    });
    
    const cookie = serialize(SESSION_COOKIE, sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
    
    const response = NextResponse.json(result);
    response.headers.set('Set-Cookie', cookie);
    
    return response;
  } catch (error: any) {
    console.error('Signin exception:', error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
