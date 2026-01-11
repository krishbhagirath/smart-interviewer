import { NextResponse } from 'next/server';
import { GeminiClient } from '@/lib/gemini';
import { aggregateInterviewData } from '@/lib/dataAggregator';
import { buildInterviewAnalysisPrompt } from '@/lib/promptBuilder';

export async function POST(request) {
  try {
    const { sessionId } = await request.json();

    // Validate sessionId
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    // Aggregate data from all sources
    const aggregatedData = await aggregateInterviewData(sessionId);

    // Build prompt
    const prompt = buildInterviewAnalysisPrompt(aggregatedData);

    // Generate report with Gemini
    const gemini = new GeminiClient();
    const report = await gemini.generateReport(prompt);

    return NextResponse.json({
      success: true,
      report,
      metadata: {
        sessionId,
        generatedAt: new Date().toISOString(),
        questionsAnalyzed: aggregatedData.answers.length,
        stressEventsDetected: aggregatedData.stressEvents.length
      }
    });

  } catch (error) {
    console.error('Report generation error:', error);

    if (error.message.includes('Session not found')) {
      return NextResponse.json(
        { success: false, error: 'No interview data found for this session', retryable: false },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate report. Please try again.', retryable: true },
      { status: 500 }
    );
  }
}
