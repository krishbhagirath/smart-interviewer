import { getQuestionText } from './dataAggregator';

export function buildInterviewAnalysisPrompt(data) {
  // Convert the complex object into a clean JSON string
  const jsonString = JSON.stringify(data, null, 2);

  // Return the prompt structure expected by the Gemini Client
  // "read this and turn the jsons into strings and then put those strings as prompts"
  return [
    {
      text: `You are an expert interview coach. Analyze the following interview data (answers, vitals, stress events) and provide a concise, actionable markdown report.
    
    Output Format:
    ### Overall Performance
    **Overall Score: X/100**
    (2-3 sentences on strengths and general impression)
    
    ### Question Analysis
    For each question:
    **Question X Score: X/10**
    (Brief content feedback, delivery insights, and tips)
    
    ### Stress Management
    (Insights on stress levels)
    
    ### Top Recommendations
    (3-5 actionable tips)` },
    { text: jsonString }
  ];
}
