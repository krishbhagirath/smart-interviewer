import { promises as fs } from 'fs';
import path from 'path';

// Safely read JSON files, return default if missing
export async function safeReadJSON(filePath, defaultValue = null) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to read ${filePath}:`, error.message);
    return defaultValue;
  }
}

// Aggregate all interview data sources
export async function aggregateInterviewData(sessionId) {
  const answersPath = path.join(process.cwd(), 'interview_answers.json');
  const eventsPath = path.join(process.cwd(), 'presage_quickstart', 'interview_events.json');
  const stressPath = path.join(process.cwd(), 'presage_quickstart', 'stress_events.json');

  const [answersData, vitalsData, stressData] = await Promise.all([
    safeReadJSON(answersPath),
    safeReadJSON(eventsPath, []),
    safeReadJSON(stressPath, [])
  ]);

  if (!answersData || answersData.sessionId !== sessionId) {
    throw new Error('Session not found or mismatched');
  }

  return {
    session: {
      sessionId: answersData.sessionId,
      startTime: answersData.startTime,
      interviewType: answersData.interviewType,
      experienceLevel: answersData.experienceLevel
    },
    answers: answersData.answers || [],
    vitals: vitalsData,
    stressEvents: stressData
  };
}

// Map question IDs to text
export function getQuestionText(questionId) {
  const map = {
    "1": "Tell me a little about yourself.",
    "2": "What motivated you to apply for this role?",
    "3": "Can you describe a challenge you faced and how you handled it?",
    "4": "Tell me about a project or experience you are proud of.",
    "5": "Is there anything else you would like us to know about you?",
    "Intro": "Are you ready to start your interview?"
  };
  return map[questionId] || "Unknown question";
}
