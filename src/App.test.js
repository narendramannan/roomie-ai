import { render, screen } from '@testing-library/react';
import App from './App';

test('renders loading screen', () => {
  render(<App />);
  const loadingElement = screen.getByText(/Loading Your Perfect Match/i);
  expect(loadingElement).toBeInTheDocument();
});
