import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const lmStudioUrl = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234';
        const lmStudioResponse = await fetch(`${lmStudioUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!lmStudioResponse.ok) {
            const errorText = await lmStudioResponse.text();
            return NextResponse.json(
                { error: `LM Studio error: ${lmStudioResponse.statusText}`, details: errorText },
                { status: lmStudioResponse.status }
            );
        }

        const data = await lmStudioResponse.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Proxy error:', error);
        return NextResponse.json(
            { error: 'Failed to communicate with LM Studio', message: error.message },
            { status: 500 }
        );
    }
}
