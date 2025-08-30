import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OnboardingScreen from '../onboarding/OnboardingScreen';

jest.mock('@sentry/react', () => ({ captureException: jest.fn(), init: jest.fn() }));

jest.mock('../profile/ImageUpload', () => {
  const React = require('react');
  return (props) => {
    React.useEffect(() => {
      props.onUpload('http://example.com/photo.jpg', {
        description: 'Smiling friend',
        tags: ['friendly', 'smiling'],
      });
    }, []);
    return <div>mock upload</div>;
  };
});

jest.mock('../firebase/init', () => ({
  auth: { currentUser: { uid: '123' } },
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(() =>
    Promise.resolve({
      data: () => ({
        aiAnalysis: { description: 'Smiling friend', tags: ['friendly', 'smiling'] },
      }),
    })
  ),
}));

describe('Onboarding summary flow', () => {
  it('shows AI personality profile after finishing onboarding', async () => {
    const mockUpdate = jest.fn(() => Promise.resolve());
    render(
      <MemoryRouter>
        <OnboardingScreen onProfileUpdate={mockUpdate} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));

    const finishButton = screen.getByText('Finish');
    await waitFor(() => expect(finishButton).not.toBeDisabled());
    fireEvent.click(finishButton);

    expect(mockUpdate).toHaveBeenCalled();
    await screen.findByText('AI Personality Profile');
    await screen.findByText('Smiling friend');
    await screen.findByText('friendly');
  });
});
