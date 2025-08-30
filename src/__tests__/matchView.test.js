import { render, screen } from '@testing-library/react';
import { ThemeProvider, theme } from '../theme';
import { filterByLocationAndBudget } from '../matching/MatchView';
import MatchView from '../matching/MatchView';

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn(),
  serverTimestamp: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ forEach: jest.fn() }),
}));

jest.mock('../notifications/notifications', () => ({
  playNotificationSound: jest.fn(),
}));

jest.mock('../firebase/init', () => ({
  db: {},
  auth: {},
  storage: {},
}));


const dummyUser = {
  uid: '1',
  matchingPreferences: { gender: [] },
  likes: [],
  passes: [],
};

describe('MatchView layout', () => {
  it('uses theme colors and typography', () => {
    render(
      <ThemeProvider>
        <MatchView currentUserData={dummyUser} />
      </ThemeProvider>
    );
    const loading = screen.getByText('Finding potential roomies...');
    expect(loading).toHaveStyle(`color: ${theme.colors.textPrimary}`);
  });
});

describe('filterByLocationAndBudget', () => {
  const profiles = [
    { uid: '1', location: 'NYC', budget: 1000 },
    { uid: '2', location: 'SF', budget: 1500 },
    { uid: '3', location: 'NYC', budget: 2000 },
  ];

  it('filters by location and budget range', () => {
    const res = filterByLocationAndBudget(profiles, 'NYC', 900, 1600);
    expect(res).toHaveLength(1);
    expect(res[0].uid).toBe('1');
  });
});
