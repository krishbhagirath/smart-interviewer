import { getQuestionText } from './dataAggregator';

export function buildInterviewAnalysisPrompt(data) {
  const { session, answers, vitals, stressEvents } = data;

  return `You are an expert interview coach. Provide concise, actionable feedback for this practice interview.

## INTERVIEW CONTEXT
- Type: ${session.interviewType}
- Experience Level: ${session.experienceLevel}
- Date: ${new Date(session.startTime).toLocaleDateString()}

## RESPONSES PROVIDED
${answers.map((answer, idx) => {
  const questionText = getQuestionText(answer.questionId);
  const vitalsForQ = vitals.find(v => v.question_number === parseInt(answer.questionId)) || {};

  return `### Question ${idx + 1}: "${questionText}"
Answer: ${answer.transcript || "(No response)"}
Heart Rate: ${vitalsForQ.avg_pulse || 'N/A'} BPM | Breathing: ${vitalsForQ.avg_breathing || 'N/A'} BPM`;
}).join('\n\n')}

## STRESS INDICATORS
${stressEvents.length > 0 ? stressEvents.map(e =>
  `- Q${e.question_number} at ${e.time_offset_sec.toFixed(1)}s: ${e.type} ${e.value} BPM`
).join('\n') : 'No significant stress detected.'}

## OUTPUT FORMAT (use markdown)

### Overall Performance
2-3 sentences on strengths and general impression.

### Question Analysis
For each question: brief content feedback, delivery insights from vitals, 1-2 specific tips.

### Stress Management
Patterns in stress responses, which questions triggered stress, anxiety management tips.

### Top Recommendations
3-5 actionable next steps to improve.

Keep it concise, encouraging, and specific.`;
}
