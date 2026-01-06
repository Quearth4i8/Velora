import { NextResponse } from 'next/server';

const TTS_SERVER_URL = process.env.TTS_SERVER_URL || 'http://127.0.0.1:8001';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = String(body?.text || '').trim();

    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const ttsResponse = await fetch(`${TTS_SERVER_URL}/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      return NextResponse.json(
        { error: `TTS server error: ${ttsResponse.statusText}`, details: errorText },
        { status: ttsResponse.status }
      );
    }

    const contentType = ttsResponse.headers.get('content-type') || 'audio/wav';
    const audio = await ttsResponse.arrayBuffer();

    return new Response(audio, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('TTS proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with TTS server', message: error.message },
      { status: 500 }
    );
  }
}
