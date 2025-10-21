import { initializeApp } from 'firebase/app';

const firebaseConfig = {
    apiKey: "AIzaSyAvvci6hnRBv7upjG-SdhMBqkXMJPCHiTI",
    authDomain: "andeseats.firebaseapp.com",
    projectId: "andeseats",
    storageBucket: "andeseats.appspot.com",
    messagingSenderId: "687027400186",
    appId: "1:687027400186:web:44b8bfeaf1cde7d3204843",
    measurementId: "G-MLNX5C18S3"
}

const app = initializeApp(firebaseConfig);

export { app, firebaseConfig };