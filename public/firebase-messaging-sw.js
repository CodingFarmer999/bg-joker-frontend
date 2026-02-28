importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
// Update these config values to match your src/firebase.js config
const firebaseConfig = {
    apiKey: "AIzaSyDIR-sQUzRD9uwKSOds-dm7hqaYXIhO_Ho",
    authDomain: "bg-joker.firebaseapp.com",
    projectId: "bg-joker",
    storageBucket: "bg-joker.firebasestorage.app",
    messagingSenderId: "740523977370",
    appId: "1:740523977370:web:cabde71511b6bba8534d23",
    measurementId: "G-M3LNN24NWV"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/vite.svg'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
