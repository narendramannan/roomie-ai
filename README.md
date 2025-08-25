# RoomieAI 🏠

A React-based roommate matching app that uses AI analysis and Firebase for real-time matching and chat functionality.

## Features

- 🔐 User authentication with Firebase
- 📱 Modern, responsive UI with Tailwind CSS
- 💬 Real-time chat with matches
- 🎯 AI-powered personality analysis
- 👥 Smart roommate matching algorithm
- 📸 Photo upload and analysis (simulated)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project

## Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd roomie-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Copy `env.template` to `.env.local`
   - Fill in your Firebase configuration values:
   ```bash
   cp env.template .env.local
   ```
   - Edit `.env.local` with your Firebase project details

4. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Copy your config values to `.env.local`

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file in the root directory with:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App

## Tech Stack

- **Frontend**: React 19, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore)
- **Styling**: Tailwind CSS
- **Build Tool**: Create React App

## Project Structure

```
src/
├── App.js          # Main application component
├── App.css         # Global styles
└── index.js        # Application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Security Notes

- Never commit `.env.local` files to version control
- Keep Firebase API keys secure
- Use environment variables for all sensitive configuration

## Firestore Security Rules

The project defines Firestore rules in `firestore.rules` to protect user data:

- Authenticated users may read any user profile but can only modify their own document.
- Chat documents and their messages are readable and writable only by users listed in the chat's `users` array.

Deploy rule updates with the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```
