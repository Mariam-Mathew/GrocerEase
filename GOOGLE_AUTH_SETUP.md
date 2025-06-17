# Google Authentication Setup

This guide explains how to set up Google OAuth for your React Native/Expo application.

## Prerequisites

1. A Google Cloud Project with the OAuth consent screen configured
2. OAuth 2.0 Client IDs for Web, Android, and iOS (as needed)

## Setup Instructions

### 1. Configure Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. For each platform (Web, Android, iOS), create a separate OAuth client ID

### 2. Update Configuration

In `utils/auth-utils.ts`, update the following:

```typescript
const config = {
  clientId: Platform.select({
    web: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    android: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    ios: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  }),
  redirectUri: AuthSession.makeRedirectUri({
    scheme: 'yourapp', // Replace with your app's scheme
    path: 'auth/callback',
  }),
  // ... rest of the config
};
```

### 3. Configure Deep Linking (for mobile)

Add the following to your `app.json`:

```json
{
  "expo": {
    "scheme": "yourapp",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "yourapp",
              "host": "auth"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

## Usage

### Sign In

```typescript
import { signInWithGoogle } from '../utils/auth-utils';

const handleSignIn = async () => {
  const result = await signInWithGoogle();
  
  if (result.type === 'success') {
    // User is signed in
    console.log('User:', result.user);
  } else if (result.type === 'cancel') {
    // User cancelled the sign-in
    console.log('Sign in cancelled');
  } else {
    // Error occurred
    console.error('Error:', result.error);
  }
};
```

### Check Authentication Status

```typescript
import { isAuthenticated, getCurrentUser } from '../utils/auth-utils';

const checkAuth = async () => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    const user = await getCurrentUser();
    console.log('User is logged in:', user);
  } else {
    console.log('User is not logged in');
  }
};
```

### Sign Out

```typescript
import { signOut } from '../utils/auth-utils';

const handleSignOut = async () => {
  try {
    await signOut();
    console.log('Successfully signed out');
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
```

## Important Notes

1. **Secure Storage**: The current implementation includes commented-out code for secure storage. For production, you should implement secure storage for tokens.

2. **Token Refresh**: The utility includes a token refresh mechanism that you can implement as needed.

3. **Web vs Mobile**: The configuration handles both web and mobile platforms automatically.

4. **Error Handling**: Make sure to handle authentication errors gracefully in your UI.

5. **Testing**: Test the authentication flow on all target platforms to ensure everything works as expected.
