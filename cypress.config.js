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
        async seedMutualUsers() {
          const timestamp = Date.now();
          const password = 'Password123!';

          const userARecord = await admin
            .auth()
            .createUser({
              email: `testA-${timestamp}@example.com`,
              password,
            });
          const userBRecord = await admin
            .auth()
            .createUser({
              email: `testB-${timestamp}@example.com`,
              password,
            });

          const userAProfile = {
            uid: userARecord.uid,
            name: 'Test User A',
            age: 25,
            gender: 'Man',
            likes: [],
            matches: [],
            createdAt: new Date(),
          };
          const userBProfile = {
            uid: userBRecord.uid,
            name: 'Test User B',
            age: 26,
            gender: 'Woman',
            likes: [userARecord.uid],
            matches: [],
            createdAt: new Date(),
          };

          await Promise.all([
            db.collection('users').doc(userARecord.uid).set(userAProfile),
            db.collection('users').doc(userBRecord.uid).set(userBProfile),
          ]);

          return {
            userA: {
              email: userARecord.email,
              uid: userARecord.uid,
              password,
              name: 'Test User A',
            },
            userB: {
              email: userBRecord.email,
              uid: userBRecord.uid,
              password,
              name: 'Test User B',
            },
          };
        },
        async cleanupUsers({ uids }) {
          await Promise.all(
            uids.map(async (uid) => {
              try {
                await admin.auth().deleteUser(uid);
              } catch (err) {
                console.warn('Unable to delete auth user', uid, err.message);
              }
              await db.collection('users').doc(uid).delete();
            })
          );
          return null;
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
