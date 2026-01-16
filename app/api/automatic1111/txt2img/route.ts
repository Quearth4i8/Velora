import { NextResponse } from 'next/server';

const AUTOMATIC1111_URL = process.env.AUTOMATIC1111_URL || 'http://127.0.0.1:7860';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = body?.payload;

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }

    const upstream = await fetch(`${AUTOMATIC1111_URL}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const contentType = upstream.headers.get('content-type') || '';
    const text = await upstream.text();

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: `Automatic1111 error: ${upstream.statusText}`,
          status: upstream.status,
          details: text,
        },
        { status: upstream.status }
      );
    }

    if (contentType.includes('application/json')) {
      return NextResponse.json(JSON.parse(text));
    }

    // Fallback if A1111 returned non-json.
    return new NextResponse(text, {
      status: 200,
      headers: {
        'content-type': contentType || 'text/plain; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Automatic1111 proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with Automatic1111', message: error?.message || String(error) },
      { status: 500 }
    );
  }
}
