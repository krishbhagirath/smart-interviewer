
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { questionId, transcript, timestamp } = body;

        console.log('\n--- NEW TRANSCRIPT LOG ---');
        console.log(`Question ID: ${questionId}`);
        console.log(`Timestamp: ${timestamp}`);
        console.log(`Transcript: "${transcript}"`);
        console.log('--------------------------\n');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error logging transcript:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
