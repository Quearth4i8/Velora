import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/db/postgres';
import { parse } from 'cookie';

const SESSION_COOKIE = 'velora_session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    const result = await postgres.auth.signInWithPassword({ email, password });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Read session from cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = parse(cookieHeader);
    const sessionCookie = cookies[SESSION_COOKIE];
    
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie);
        return NextResponse.json({ 
          data: { 
            session: sessionData.session,
            user: sessionData.user 
          }, 
          error: null 
        });
      } catch {
        // Invalid cookie format
      }
    }
    
    // Fallback to memory-based session
    const result = await postgres.auth.getSession();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
