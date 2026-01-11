const express = require('express');
const dotenv = require('dotenv');
// const fetch = require('node-fetch'); // Native fetch in Node 18+
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
// Keys are loaded from .env
// const API_KEY = process.env.ELEVENLABS_API_KEY;
// const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

// Middleware
app.use(express.static('public'));
app.use(express.json());

app.get('/questions.json', (req, res) => res.sendFile(path.join(__dirname, 'src', 'data', 'questions.json')));
app.get('/transitions.json', (req, res) => res.sendFile(path.join(__dirname, 'src', 'data', 'transitions.json')));

// TTS Endpoint
app.post('/api/tts', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    if (!process.env.ELEVENLABS_API_KEY || !process.env.ELEVENLABS_VOICE_ID) {
        console.error('Missing env vars');
        return res.status(500).json({ error: 'Server misconfiguration: Missing API Key or Voice ID' });
    }

    try {
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}/stream`,
            {
                method: 'POST',
                headers: {
                    'xi-api-key': process.env.ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_turbo_v2_5', // Good balance of speed/quality
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                })
            }
        );

        if (!response.ok) {
            const err = await response.text();
            console.error('ElevenLabs TTS Error:', err);
            return res.status(response.status).send(err);
        }

        // Pipe the audio stream directly to the client
        res.setHeader('Content-Type', 'audio/mpeg');
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.send(buffer);

    } catch (error) {
        console.error('TTS Server Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
