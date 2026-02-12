import { NextResponse } from 'next/server';
import * as http from 'node:http';
import * as https from 'node:https';
import type { IncomingMessage } from 'node:http';
import { Readable } from 'node:stream';

const AUTOMATIC1111_URL = process.env.A1111_URL || process.env.AUTOMATIC1111_URL || 'http://localhost:7860';

export const runtime = 'nodejs';

export const maxDuration = 900;

const readStreamAsText = async (stream: IncomingMessage): Promise<string> => {
  return await new Promise<string>((resolve, reject) => {
    let out = '';
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => {
      out += String(chunk);
    });
    stream.on('end', () => resolve(out));
    stream.on('error', (err) => reject(err));
  });
};

const postJsonNoTimeout = async (urlString: string, payload: unknown, signal?: AbortSignal) => {
  const url = new URL(urlString);
  const body = JSON.stringify(payload);

  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;

  const requestOptions: http.RequestOptions = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port ? Number(url.port) : isHttps ? 443 : 80,
    path: `${url.pathname}${url.search}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  return await new Promise<IncomingMessage>((resolve, reject) => {
    const req = lib.request(requestOptions, (res) => resolve(res));
    req.on('error', (err) => reject(err));

    if (signal) {
      if (signal.aborted) {
        req.destroy(new Error('Request aborted'));
        return;
      }
      signal.addEventListener('abort', () => req.destroy(new Error('Request aborted')));
    }

    req.write(body);
    req.end();
  });
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = body?.payload;

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }

    const upstreamUrl = `${AUTOMATIC1111_URL}/sdapi/v1/txt2img`;

    const upstream = await postJsonNoTimeout(upstreamUrl, payload, request.signal);

    const status = upstream.statusCode || 500;
    const contentTypeHeader = upstream.headers['content-type'];
    const contentType = Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader || '';

    if (status < 200 || status >= 300) {
      const text = await readStreamAsText(upstream);
      console.error('Automatic1111 upstream error:', {
        upstreamUrl,
        status,
        details: text,
      });
      return NextResponse.json(
        {
          error: 'Automatic1111 error',
          status,
          details: text,
        },
        { status }
      );
    }

    // Fallback if A1111 returned non-json.
    return new NextResponse(Readable.toWeb(upstream) as any, {
      status,
      headers: {
        'content-type': contentType || 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Automatic1111 proxy error:', error?.stack || error);

    const upstreamUrl = `${AUTOMATIC1111_URL}/sdapi/v1/txt2img`;
    const cause = error?.cause;
    return NextResponse.json(
      {
        error: 'Failed to communicate with Automatic1111',
        upstreamUrl,
        message: error?.message || String(error),
        name: error?.name,
        cause: cause
          ? {
              name: cause?.name,
              message: cause?.message || String(cause),
              code: (cause as any)?.code,
              errno: (cause as any)?.errno,
              syscall: (cause as any)?.syscall,
              address: (cause as any)?.address,
              port: (cause as any)?.port,
            }
          : undefined,
      },
      { status: 500 }
    );
  }
}
