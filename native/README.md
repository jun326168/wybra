# Vibe Matching Native App

React Native app built with Expo for vibe matching.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your OAuth credentials:
```
EXPO_PUBLIC_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
```

To get Google OAuth credentials:
- Go to https://console.cloud.google.com/
- Create a new project or select an existing one
- Enable Google+ API
- Create OAuth 2.0 credentials for iOS and Android

## Running the App

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Authentication

The app uses:
- Google Sign-In (iOS & Android)
- Apple Sign-In (iOS only)

Both use native authentication flows for the best user experience.


