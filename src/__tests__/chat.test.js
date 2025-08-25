import { render, screen } from '@testing-library/react';
import ChatView from '../chat/ChatView';

jest.mock('@sentry/react', () => ({ captureException: jest.fn(), init: jest.fn() }));
jest.mock('../firebase/init', () => ({ db: {} }));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  updateDoc: jest.fn(),
}));

test('shows message when no matches', async () => {
  render(<ChatView currentUserData={{ uid: 'user1', matches: [] }} />);
  expect(await screen.findByText(/You have no matches yet/i)).toBeInTheDocument();
});


