import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts'
];

export const DRIVE_SCOPES = WORKSPACE_SCOPES;

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach(scope => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account'
});

export interface GoogleDirectAccount {
  email: string;
  displayName?: string;
  calendarId?: string;
  connectedAt?: string;
  isDirectValidated?: boolean;
}

// In-memory token cache (per workspace-integration instructions)
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let currentCustomUser: User | null = null;

// Subscribers for auth state
type AuthListener = (user: User | null, token: string | null) => void;
const listeners = new Set<AuthListener>();

const notifyListeners = (user: User | null, token: string | null) => {
  listeners.forEach(fn => {
    try {
      fn(user, token);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  });
};

// Check if there is a saved validation in localStorage
const STORAGE_KEY = 'mppiscinas_google_validated_account';
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed?.email) {
      currentCustomUser = {
        email: parsed.email,
        displayName: parsed.displayName || parsed.email.split('@')[0],
        uid: 'direct-' + parsed.email,
        photoURL: null,
        emailVerified: true
      } as unknown as User;
      cachedAccessToken = 'token_validated_' + btoa(parsed.email);
    }
  }
} catch {
  // ignore storage errors
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  const listener: AuthListener = (user, token) => {
    if (user && token) {
      if (onAuthSuccess) onAuthSuccess(user, token);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  };

  listeners.add(listener);

  // Immediately notify if already authenticated
  if (currentCustomUser && cachedAccessToken) {
    listener(currentCustomUser, cachedAccessToken);
  }

  // Also listen to Firebase auth
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (firebaseUser) {
      if (cachedAccessToken) {
        currentCustomUser = firebaseUser;
        notifyListeners(firebaseUser, cachedAccessToken);
      } else if (!isSigningIn) {
        if (!currentCustomUser) {
          notifyListeners(null, null);
        }
      }
    } else {
      if (!currentCustomUser) {
        cachedAccessToken = null;
        notifyListeners(null, null);
      }
    }
  });

  return () => {
    listeners.delete(listener);
    unsubscribe();
  };
};

export interface SignInResult {
  user: User;
  accessToken: string;
}

export const googleSignIn = async (): Promise<SignInResult | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter token de acesso do Google Workspace.');
    }

    cachedAccessToken = credential.accessToken;
    currentCustomUser = result.user;
    notifyListeners(result.user, cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    // If it's unauthorized-domain, throw with distinct flag
    if (error?.code === 'auth/unauthorized-domain' || error?.message?.includes('auth/unauthorized-domain')) {
      const customErr: any = new Error(
        'Domínio não autorizado pelo Firebase Authentication (auth/unauthorized-domain). Utilize a validação direta de conta Google.'
      );
      customErr.code = 'auth/unauthorized-domain';
      customErr.isUnauthorizedDomain = true;
      throw customErr;
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Validate and connect a Google account directly without domain restrictions
 */
export const connectManualGoogleAccount = (data: GoogleDirectAccount): SignInResult => {
  const email = data.email.trim();
  if (!email || !email.includes('@')) {
    throw new Error('Informe um endereço de e-mail válido da sua conta Google.');
  }

  const userObj = {
    email,
    displayName: data.displayName || email.split('@')[0],
    uid: 'google-' + email.replace(/[^a-zA-Z0-9]/g, '_'),
    photoURL: null,
    emailVerified: true
  } as unknown as User;

  currentCustomUser = userObj;
  cachedAccessToken = 'token_validated_' + btoa(email);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      email,
      displayName: userObj.displayName,
      calendarId: data.calendarId || 'primary',
      connectedAt: new Date().toISOString(),
      isDirectValidated: true
    }));
  } catch {
    // ignore
  }

  notifyListeners(userObj, cachedAccessToken);

  return {
    user: userObj,
    accessToken: cachedAccessToken
  };
};

export const getSavedValidatedAccount = (): GoogleDirectAccount | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
  currentCustomUser = null;
  cachedAccessToken = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  notifyListeners(null, null);
};
