/**
 * Randomly selects n items from an array
 */
export function getRandomItems<T>(array: T[], n: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}
