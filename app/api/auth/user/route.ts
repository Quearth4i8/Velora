import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/db/postgres';

export async function GET() {
  try {
    const result = await postgres.auth.getUser();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
