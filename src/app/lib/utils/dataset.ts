import { Dataset } from "@/db/schema";

/**
 * @param array
 * @returns
 */
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * splitDataset function splits the dataset into train, validation, and test sets
 * It shuffles the task IDs and divides them into 70% training, 15% validation, and 15% test sets.
 * If the length of tasks is 1, it returns the single task in the train set and empty arrays for validation and test.
 * If the length of tasks is 2, it returns one task in the train set and one in the validation set, leaving the test set empty.
 * If the length of tasks is 3 or more, it splits them into the specified proportions.
 * In any case, it should ensure the priority of the train set, followed by validation, and then test sets.
 * @param taskIds
 */
export function splitDataset(taskIds: string[]): Record<Dataset, string[]> {
  taskIds = shuffle(taskIds);
  const datasetLength = taskIds.length;

  let result: Record<Dataset, string[]> = {
    train: [] as string[],
    valid: [] as string[],
    test: [] as string[],
  };

  const trainCount = Math.max(1, Math.floor(datasetLength * 0.7));

  result.train = taskIds.slice(0, trainCount);

  if (datasetLength > trainCount) {
    const validCount = Math.ceil((datasetLength - trainCount) * 0.5);
    result.valid = taskIds.slice(trainCount, trainCount + validCount);
    result.test = taskIds.slice(trainCount + validCount);
  }

  return result;
}
