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

  it('renders profile sections with theme colors', () => {
    render(
      <ThemeProvider>
        <ProfileScreen userData={userData} onProfileUpdate={jest.fn()} />
      </ThemeProvider>
    );
    const heading = screen.getByText('My Details');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveStyle(`color: ${theme.colors.textPrimary}`);
    expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
  });
});
