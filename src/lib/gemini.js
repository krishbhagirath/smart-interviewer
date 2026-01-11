
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiClient {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });
  }

  async generateReport(prompt) {
    const maxRetries = 5;
    let baseDelay = 4000; // Start with 4 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // The prompt here is expected to be an array of parts: [{ text: "..." }, { text: "..." }]
        // based on the user's request: "put those strings as prompts and get the response"
        // and snippet: contents: [{ role: "user", parts: prompt }]

        const result = await this.model.generateContent({
          contents: [{ role: "user", parts: prompt }]
        });

        return result.response.text();
      } catch (error) {
        const isRateLimit = error.message?.includes('429') || error.status === 429;

        if (isRateLimit && attempt < maxRetries) {
          console.warn(`Gemini 429 Check: Retrying attempt ${attempt}/${maxRetries} in ${baseDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, baseDelay));
          baseDelay *= 1.5; // Exponential backoff
          continue;
        }

        console.error('Gemini API error:', error);
        throw new Error('Failed to generate report with Gemini AI (Quota Exceeded or Error)');
      }
    }
  }
}
