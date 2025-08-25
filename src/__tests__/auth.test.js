import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthView from '../auth/AuthView';

jest.mock('../firebase/init', () => ({ auth: {} }));

const mockSignIn = jest.fn(() => Promise.resolve());
const mockCreate = jest.fn(() => Promise.resolve());

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args) => mockSignIn(...args),
  createUserWithEmailAndPassword: (...args) => mockCreate(...args),
}));

describe('AuthView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs in with email and password', async () => {
    render(<AuthView />);
    fireEvent.change(screen.getByPlaceholderText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /Log In/i }));
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith({}, 'test@example.com', 'password'));
  });

  it('signs up new user', async () => {
    render(<AuthView />);
    fireEvent.click(screen.getByText(/Sign Up/i));
    fireEvent.change(screen.getByPlaceholderText(/Email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'newpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith({}, 'new@example.com', 'newpass'));
  });
});

