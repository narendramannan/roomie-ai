import { render, screen } from '@testing-library/react';
import MatchView from '../matching/MatchView';
import { ThemeProvider, theme } from '../theme';

jest.mock('@sentry/react', () => ({ captureException: jest.fn(), init: jest.fn() }));
jest.mock('../firebase/init', () => ({ db: {} }));

describe('MatchView layout', () => {
  it('shows themed loading state', () => {
    render(
      <ThemeProvider>
        <MatchView currentUserData={null} />
      </ThemeProvider>
    );
    const text = screen.getByText(/Finding potential roomies/i);
    expect(text).toHaveStyle(`color: ${theme.colors.textPrimary}`);
  });
});
