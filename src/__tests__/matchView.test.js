import { render, screen } from '@testing-library/react';
import { ThemeProvider, theme } from '../theme';

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

import MatchView from '../matching/MatchView';

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
