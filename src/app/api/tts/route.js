import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { text } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const API_KEY = process.env.ELEVENLABS_API_KEY;
        const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

        if (!API_KEY || !VOICE_ID) {
            console.error('Missing env vars');
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
            {
                method: 'POST',
                headers: {
                    'xi-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_turbo_v2_5',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                })
            }
        );

        if (!response.ok) {
            const err = await response.text();
            return new NextResponse(err, { status: response.status });
        }

        const arrayBuffer = await response.arrayBuffer();

        // Return audio/mpeg
        return new NextResponse(arrayBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
            },
        });

    } catch (error) {
        console.error('TTS API Key Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
