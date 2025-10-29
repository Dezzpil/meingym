export abstract class TrainingTimeScorer {
  /**
   * Сделать оценку и сохранить ее в БД
   * @param trainingId
   * @returns список оценок для каждого упражнения в секундах
   */
  abstract score(trainingId: number): Promise<number[]>;
}
