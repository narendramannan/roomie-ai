import React from 'react';
import OnboardingScreen from '../../src/onboarding/OnboardingScreen';
import { mount } from 'cypress/react';

describe('Onboarding flow', () => {
  it('allows a user to complete steps and view summary', () => {
    const onProfileUpdate = cy.stub().as('onProfileUpdate');
    mount(<OnboardingScreen onProfileUpdate={onProfileUpdate} />);

    cy.contains('About You');
    cy.get('input[name="name"]').type('Alice');
    cy.get('input[name="age"]').type('25');
    cy.contains('Next').click();

    cy.contains('Your Lifestyle');
    cy.get('input[name="sleep"]').invoke('val', 7).trigger('input');
    cy.contains('Next').click();

    cy.contains('Summary');
    cy.contains('Alice');
    cy.contains('25');
    cy.contains('Finish').click();
    cy.get('@onProfileUpdate').should('have.been.calledOnce');
  });
});
