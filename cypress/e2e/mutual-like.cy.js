/// <reference types="cypress" />

// E2E test covering mutual likes, match notification, chat messaging and unread counts

describe('Mutual like flow with chat notifications', () => {
  const password = 'Password123!';
  let userA; // will like userB to trigger match
  let userB; // already likes userA

  before(() => {
    cy.task('seedMutualUsers').then((res) => {
      userA = res.userA;
      userB = res.userB;
    });
  });

  after(() => {
    cy.task('cleanupUsers', { uids: [userA.uid, userB.uid] });
  });

  it('matches two users and tracks unread counts', () => {
    // Login as userA and like userB to create a match
    cy.login(userA.email, password);
    cy.visit('/');
    cy.get('[data-testid="match-view"] [data-testid="like-button"]').click();
    cy.contains("It's a match").should('be.visible');

    // open chat via modal
    cy.contains('Send a message').click();

    // send text message from userA
    cy.get('textarea').type('Hello from A{enter}');
    cy.contains('Hello from A').should('be.visible');

    // image messaging not yet implemented in chat UI
    cy.log('Image message upload skipped - feature not implemented');

    // log out and switch to userB
    cy.logout();
    cy.login(userB.email, password);
    cy.visit('/chats');

    // verify unread count
    cy.contains(userA.name)
      .parent()
      .find('span')
      .should('contain', '1');

    // open chat and send reply
    cy.contains(userA.name).click();
    cy.get('textarea').type('Hi A!{enter}');
    cy.contains('Hi A!').should('be.visible');

    // unread count should reset after opening
    cy.visit('/chats');
    cy.contains(userA.name)
      .parent()
      .find('span')
      .should('not.exist');
  });
});
