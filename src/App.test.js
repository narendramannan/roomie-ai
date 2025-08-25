import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./auth/useAuth', () => ({
  __esModule: true,
  default: jest.fn(() => ({ user: null, userData: null, loading: true })),
}));
jest.mock('./firebase/init', () => ({ auth: {}, db: {} }));
jest.mock('firebase/firestore', () => ({ doc: jest.fn(), setDoc: jest.fn(), collection: jest.fn(), query: jest.fn(), where: jest.fn(), onSnapshot: jest.fn(() => jest.fn()) }));
jest.mock('firebase/auth', () => ({ signOut: jest.fn() }));

test.skip('renders loading screen', () => {
  render(<App />);
  const loadingElement = screen.getByText(/Loading Your Perfect Match/i);
  expect(loadingElement).toBeInTheDocument();
});
