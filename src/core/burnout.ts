export type BurnoutAnswers = {
  exhaustion: number;
  distance: number;
  cognitive: number;
  emotional: number;
};

export const BURNOUT_THRESHOLD = 3.5;

export function calculateBurnoutScore(answers: BurnoutAnswers): number {
  const values = [
    answers.exhaustion,
    answers.distance,
    answers.cognitive,
    answers.emotional,
  ];
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function isBurnoutRisk(score: number): boolean {
  return score >= BURNOUT_THRESHOLD;
}
