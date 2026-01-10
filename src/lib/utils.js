import { clsx } from 'clsx';

// Combine class names
export function cn(...inputs) {
  return clsx(inputs);
}

// Validate form data
export function validatePreInterviewForm(data) {
  const errors = {};

  if (!data.interviewType) {
    errors.interviewType = 'Please select an interview type';
  }

  if (!data.role || data.role.trim().length === 0) {
    errors.role = 'Please enter your target role';
  }

  if (!data.experienceLevel) {
    errors.experienceLevel = 'Please select your experience level';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Load questions for interview type
export async function loadQuestions(interviewType) {
  try {
    const questions = await import(`@/data/questions/${interviewType}.json`);
    return questions.default;
  } catch (error) {
    console.error('Failed to load questions:', error);
    return null;
  }
}
