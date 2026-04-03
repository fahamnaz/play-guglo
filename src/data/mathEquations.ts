export interface MathEquation {
  level: 'easy' | 'medium' | 'hard';
  elements: string[]; // Correct order: e.g. ["2", "+", "3", "=", "5"]
}

export const mathEquations: MathEquation[] = [
  // EASY
  { level: 'easy', elements: ["2", "+", "3", "=", "5"] },
  { level: 'easy', elements: ["4", "−", "1", "=", "3"] },
  { level: 'easy', elements: ["1", "+", "1", "=", "2"] },
  // MEDIUM
  { level: 'medium', elements: ["5", "×", "2", "=", "10"] },
  { level: 'medium', elements: ["8", "÷", "2", "=", "4"] },
  { level: 'medium', elements: ["10", "−", "4", "=", "6"] },
  // HARD
  { level: 'hard', elements: ["4", "×", "2", "+", "1", "=", "9"] },
  { level: 'hard', elements: ["10", "÷", "2", "+", "3", "=", "8"] },
  { level: 'hard', elements: ["5", "+", "5", "−", "2", "=", "8"] },
];