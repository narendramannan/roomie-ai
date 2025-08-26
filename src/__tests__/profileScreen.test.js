import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('firebase/firestore', () => ({
  __esModule: true,
  doc: jest.fn(() => ({})),
  updateDoc: jest.fn(),
  getFirestore: jest.fn(() => ({})),
}));

import { updateDoc } from 'firebase/firestore';
import ProfileScreen from '../profile/ProfileScreen';
import { ThemeProvider } from '../theme';
import { auth } from '../firebase/init';

describe('ProfileScreen layout', () => {
  const userData = {
    name: 'Test User',
    age: 30,
    aiAnalysis: { tags: ['clean', 'quiet'] },
    photos: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile header and sections', () => {
    render(
      <ThemeProvider>
        <ProfileScreen userData={userData} onProfileUpdate={jest.fn()} />
      </ThemeProvider>
    );
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('About Me')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
  });

  it('adds a tag', async () => {
    auth.currentUser = { uid: 'abc' };
    render(
      <ThemeProvider>
        <ProfileScreen userData={userData} onProfileUpdate={jest.fn()} />
      </ThemeProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: /Edit/i }));
    const input = screen.getByPlaceholderText('Add tag');
    await userEvent.type(input, 'friendly{enter}');
    expect(screen.getByText('friendly')).toBeInTheDocument();
    await waitFor(() => expect(updateDoc).toHaveBeenCalled());
    expect(updateDoc.mock.calls[0][1]).toEqual({
      'aiAnalysis.tags': ['clean', 'quiet', 'friendly'],
    });
  });

  it('removes a tag', async () => {
    auth.currentUser = { uid: 'abc' };
    render(
      <ThemeProvider>
        <ProfileScreen userData={userData} onProfileUpdate={jest.fn()} />
      </ThemeProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: /Edit/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove clean' }));
    expect(screen.queryByText('clean')).not.toBeInTheDocument();
    await waitFor(() => expect(updateDoc).toHaveBeenCalled());
    expect(updateDoc.mock.calls[0][1]).toEqual({
      'aiAnalysis.tags': ['quiet'],
    });
  });
});
