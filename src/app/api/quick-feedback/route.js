import { NextResponse } from 'next/server';
import { GeminiClient } from '@/lib/gemini';

export async function POST(request) {
    try {
        const { questionText, answerText } = await request.json();

        if (!questionText) {
            return NextResponse.json({ error: 'Missing question' }, { status: 400 });
        }

        const gemini = new GeminiClient();

        // Construct a specific prompt for quick feedback
        // Must return an array of parts as expected by our refactored GeminiClient
        const promptParts = [
            { text: `You are an interview coach giving real-time feedback.` },
            { text: `Question: "${questionText}"` },
            { text: `Candidate Answer: "${answerText || "(No response provided)"}"` },
            {
                text: `Task: Provide extremely concise feedback. 
        1. One sentence observation on the content.
        2. One specific, actionable tip for improvement.
        Keep the total response under 50 words. Be direct and encouraging.` }
        ];

        const feedback = await gemini.generateReport(promptParts);

        return NextResponse.json({ feedback });

    } catch (error) {
        console.error('Quick Feedback Error:', error);
        // Return a safe fallback so the UI handles it gracefully (or just ignores it)
        return NextResponse.json({ feedback: null }, { status: 500 });
    }
}
