jest.mock('@sentry/react', () => ({ captureException: jest.fn(), init: jest.fn() }));
jest.mock('../firebase/init', () => ({ db: {} }));

import { calculateCompatibility } from '../matching/MatchView';

describe('calculateCompatibility', () => {
  it('calculates score and insights', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

    const userA = {
      lifestyle: { sleep: 8, cleanliness: 8, socialVibe: 'Introvert' },
      aiAnalysis: { tags: ['quiet', 'studious'] }
    };
    const userB = {
      lifestyle: { sleep: 8, cleanliness: 8, socialVibe: 'Introvert' },
      aiAnalysis: { tags: ['quiet', 'studious'] }
    };

    const result = calculateCompatibility(userA, userB);

    expect(result.score).toBe(90);
    expect(result.insights).toHaveLength(3);
    expect(result.insights[0].type).toBe('sleep');

    randomSpy.mockRestore();
  });
});

