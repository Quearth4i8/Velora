import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const getBaseUrl = () => {
  const baseUrl = process.env.A1111_URL || process.env.AUTOMATIC1111_URL || 'http://localhost:7860';
  return String(baseUrl).replace(/\/+$/, '');
};

const copyUpstreamHeaders = (headers: Headers) => {
  const out = new Headers();
  headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === 'content-encoding') return;
    if (k === 'transfer-encoding') return;
    out.set(key, value);
  });
  out.set('cache-control', 'no-store');
  return out;
};

const proxy = async (request: Request, pathParts: string[]) => {
  const baseUrl = getBaseUrl();

  const incomingUrl = new URL(request.url);
  const upstreamUrl = `${baseUrl}/${pathParts.map((p) => encodeURIComponent(p)).join('/')}${incomingUrl.search}`;

  try {
    const method = request.method.toUpperCase();

    const headers = new Headers(request.headers);
    headers.delete('host');

    let body: ArrayBuffer | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      body = await request.arrayBuffer();
    }

    const upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers,
      body: body ? Buffer.from(body) : undefined,
      redirect: 'manual',
      signal: request.signal,
    });

    if (!upstreamResponse.ok) {
      const text = await upstreamResponse.text();
      console.error('Automatic1111 upstream error:', {
        upstreamUrl,
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        details: text,
      });

      return NextResponse.json(
        {
          error: 'Automatic1111 error',
          upstreamUrl,
          status: upstreamResponse.status,
          details: text,
        },
        { status: upstreamResponse.status }
      );
    }

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: copyUpstreamHeaders(upstreamResponse.headers),
    });
  } catch (error: any) {
    console.error('Automatic1111 proxy error:', error?.stack || error);
    return NextResponse.json(
      {
        error: 'Failed to communicate with Automatic1111',
        upstreamUrl,
        message: error?.message || String(error),
        name: error?.name,
      },
      { status: 500 }
    );
  }
};

export async function GET(request: Request, { params }: { params: { path: string[] } }) {
  return await proxy(request, params.path || []);
}

export async function POST(request: Request, { params }: { params: { path: string[] } }) {
  return await proxy(request, params.path || []);
}

export async function PUT(request: Request, { params }: { params: { path: string[] } }) {
  return await proxy(request, params.path || []);
}

export async function PATCH(request: Request, { params }: { params: { path: string[] } }) {
  return await proxy(request, params.path || []);
}

export async function DELETE(request: Request, { params }: { params: { path: string[] } }) {
  return await proxy(request, params.path || []);
}
