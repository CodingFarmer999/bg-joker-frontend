// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDIR-sQUzRD9uwKSOds-dm7hqaYXIhO_Ho",
    authDomain: "bg-joker.firebaseapp.com",
    projectId: "bg-joker",
    storageBucket: "bg-joker.firebasestorage.app",
    messagingSenderId: "740523977370",
    appId: "1:740523977370:web:cabde71511b6bba8534d23",
    measurementId: "G-M3LNN24NWV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
export default app;
