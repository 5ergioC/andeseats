import { initializeApp } from 'firebase/app';

const envSources = {
    apiKey: ['REACT_APP_FIREBASE_API_KEY'],
    authDomain: ['REACT_APP_FIREBASE_AUTH_DOMAIN', 'REACT_APP_FIREBASE_DOMAIN'],
    projectId: ['REACT_APP_FIREBASE_PROJECT_ID'],
    storageBucket: ['REACT_APP_FIREBASE_STORAGE_BUCKET'],
    messagingSenderId: ['REACT_APP_FIREBASE_MESSAGING_SENDER_ID'],
    appId: ['REACT_APP_FIREBASE_APP_ID'],
    measurementId: ['REACT_APP_FIREBASE_MEASUREMENT_ID']
};

const firebaseConfig = Object.fromEntries(
    Object.entries(envSources).map(([configKey, candidates]) => {
        const value = candidates.map((name) => process.env[name]).find(Boolean);
        return [configKey, value];
    })
);

const requiredConfigKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
];

const missingEnvVars = requiredConfigKeys
    .map((configKey) => envSources[configKey])
    .map((candidates) => candidates.find((name) => Boolean(process.env[name])) ?? candidates[0])
    .filter((envName) => !process.env[envName]);

if (missingEnvVars.length > 0) {
    throw new Error(
        `Missing Firebase environment variables: ${missingEnvVars.join(', ')}. ` +
        'Check your .env file or Vercel project settings.'
    );
}

const app = initializeApp(firebaseConfig);

export { app, firebaseConfig };
