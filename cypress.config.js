const { defineConfig } = require('cypress');
const admin = require('firebase-admin');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId:
            process.env.REACT_APP_FIREBASE_PROJECT_ID || 'test-project-id',
        });
      }
      const db = admin.firestore();
      on('task', {
        async getUserProfile(uid) {
          const doc = await db.collection('users').doc(uid).get();
          return doc.exists ? doc.data() : null;
        },
      });
    },
  },
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
  },
});
