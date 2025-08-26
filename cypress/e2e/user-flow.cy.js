/// <reference types="cypress" />

describe('New user end-to-end flow', () => {
  const email = `newuser-${Date.now()}@example.com`;
  const password = 'Password123!';

  it('registers a new user, uploads photo, and completes onboarding', () => {
    cy.visit('/');
    cy.contains('Sign Up').click();
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.contains('Sign Up').click();

    cy.get('input[name="name"]').type('New User');
    cy.get('input[name="age"]').type('25');
    cy.get('select[name="gender"]').select('Woman');
    cy.contains('Next').click();

    cy.contains('Man').click();
    cy.contains('Next').click();

    cy.get('input[name="sleep"]').invoke('val', 7).trigger('input');
    cy.get('input[name="cleanliness"]').invoke('val', 6).trigger('input');
    cy.contains('Next').click();

    cy.fixture('sample-photo.txt', 'base64').then((fileContent) => {
      const blob = Cypress.Blob.base64StringToBlob(fileContent, 'image/png');
      cy.get('input[type="file"]').selectFile(
        {
          contents: blob,
          fileName: 'sample-photo.png',
          mimeType: 'image/png',
        },
        { force: true }
      );
    });
    cy.contains('Finish').click();
  });

  it('likes a seeded user and exchanges chat messages after a match', () => {
    cy.login(email, password);
    cy.visit('/');
    cy.get('[data-testid="match-view"] [data-testid="like-button"]').click();
    cy.contains("It's a match").should('be.visible');
    cy.contains('Send a message').click();
    cy.get('textarea').type('Hi there!{enter}');
    cy.contains('Hi there!').should('be.visible');
  });

  it('edits profile fields and AI tags and persists after reload', () => {
    cy.login(email, password);
    cy.visit('/profile');
    cy.get('input[name="name"]').clear().type('Updated User');
    cy.get('[data-testid="ai-tags"] input').type('friendly{enter}');
    cy.contains('Save').click();
    cy.reload();
    cy.get('input[name="name"]').should('have.value', 'Updated User');
    cy.get('[data-testid="ai-tags"]').contains('friendly');
  });
});
