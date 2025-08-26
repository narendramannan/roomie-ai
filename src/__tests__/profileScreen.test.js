import { render, screen } from '@testing-library/react';
import ProfileScreen from '../profile/ProfileScreen';
import { ThemeProvider, theme } from '../theme';

describe('ProfileScreen layout', () => {
  const userData = {
    name: 'Test User',
    age: 30,
    aiAnalysis: { tags: ['clean', 'quiet'] },
    photos: [],
  };

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
});
