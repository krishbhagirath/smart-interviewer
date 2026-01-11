import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request) {
    try {
        const body = await request.json();
        const { audioData, questionId, sessionId, interviewType, experienceLevel } = body;

        if (!audioData) {
            return NextResponse.json({ error: 'No audio data provided' }, { status: 400 });
        }

        const apiKey = process.env.GC_TRANSCRIBE_API;
        if (!apiKey) {
            console.error("GC_TRANSCRIBE_API is missing in .env");
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Google Cloud Speech-to-Text REST API
        const url = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;

        const requestBody = {
            config: {
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 48000,
                languageCode: 'en-US',
                enableAutomaticPunctuation: true,
            },
            audio: {
                content: audioData
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Google API Error:", errorText);
            throw new Error(`Google API failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Extract transcript
        const results = data.results || [];
        const transcript = results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

        // LOGGING TO TERMINAL
        console.log('\n--- TRANSCRIPT LOG (Google STT) ---');
        console.log(`Question ID: ${questionId}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log(`Text: "${transcript}"`);
        console.log('-------------------------------------\n');

        // Save to JSON File if transcript exists
        if (sessionId) {
            const filePath = path.join(process.cwd(), 'interview_answers.json');
            let fileData = null;

            try {
                const fileContent = await fs.readFile(filePath, 'utf8');
                fileData = JSON.parse(fileContent);
            } catch (e) {
                // File doesn't exist or invalid JSON
                fileData = null;
            }

            const newAnswer = {
                questionId,
                transcript: transcript || "(No speech detected)",
                timestamp: new Date().toISOString()
            };

            if (fileData && fileData.sessionId === sessionId) {
                // APPEND to existing session
                fileData.answers.push(newAnswer);
            } else {
                // OVERWRITE (New Session)
                fileData = {
                    sessionId,
                    startTime: new Date().toISOString(),
                    interviewType: interviewType || 'Unknown',
                    experienceLevel: experienceLevel || 'Unknown',
                    answers: [newAnswer]
                };
            }

            await fs.writeFile(filePath, JSON.stringify(fileData, null, 2));
        }

        return NextResponse.json({ transcript, success: true });

    } catch (error) {
        console.error('Transcription error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
