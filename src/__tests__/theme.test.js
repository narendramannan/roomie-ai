import { render, screen } from '@testing-library/react';
import { ThemeProvider, theme } from '../theme';
import { Header } from '../App';

test('Header uses theme tokens', () => {
  render(
    <ThemeProvider>
      <Header />
    </ThemeProvider>
  );
  const title = screen.getByText(/RoomieAI/i);
  expect(title).toHaveStyle(`color: ${theme.colors.primary}`);
  expect(title).toHaveStyle(`font-family: ${theme.typography.fonts.heading}`);
});
