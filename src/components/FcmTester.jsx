import { useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebase';

const FcmTester = () => {
    const [fcmToken, setFcmToken] = useState('');
    const [notificationMsg, setNotificationMsg] = useState('');
    const [status, setStatus] = useState('');

    // IMPORTANT: Replace this with your actual VAPID key from Firebase Console
    const VAPID_KEY = 'BARtYAZpbdC3YjphAm3xkjT57oxzne4MAMkJ-dUlJxy8hBVRxyDuwpY_i8XovoFKFHvlKjJ5glK7iiFzHv6SCN4';

    // Listen for foreground messages
    useEffect(() => {
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Message received in foreground:', payload);
            setNotificationMsg(`🔔 ${payload.notification?.title}: ${payload.notification?.body}`);
        });
        return () => unsubscribe();
    }, []);

    const requestPermissionAndGetToken = async () => {
        setStatus('Requesting permission...');
        try {
            if (typeof window !== 'undefined' && 'Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    setStatus('Permission granted. Fetching token...');

                    if (VAPID_KEY === 'YOUR_VAPID_KEY_HERE') {
                        setStatus('Error: Please replace YOUR_VAPID_KEY_HERE with your real VAPID key in FcmTester.jsx');
                        return;
                    }

                    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
                    if (currentToken) {
                        setFcmToken(currentToken);
                        setStatus('Token generated successfully! Saving to database...');
                        console.log('FCM Token:', currentToken);

                        // Also sync to backend so the user doesn't have to refresh
                        const jwtToken = localStorage.getItem('joker_token');
                        if (jwtToken) {
                            try {
                                const res = await fetch('/api/users/fcm-token', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${jwtToken}`
                                    },
                                    body: JSON.stringify({ token: currentToken, deviceType: 'WEB' })
                                });
                                if (res.ok) {
                                    setStatus('Token generated & saved to database successfully!');
                                } else {
                                    setStatus('Token generated, but failed to save to DB.');
                                }
                            } catch (e) {
                                setStatus(`Error saving DB: ${e.message}`);
                            }
                        } else {
                            setStatus('Token generated! (Not saved: You are not logged in)');
                        }
                    } else {
                        setStatus('Failed to generate token. Check configuration and VAPID key.');
                    }
                } else {
                    setStatus('Notification permission denied by user.');
                }
            }
        } catch (error) {
            console.error('Error fetching FCM token:', error);
            setStatus(`Error: ${error.message}`);
        }
    };

    const sendTestPush = async () => {
        if (!fcmToken) {
            setStatus('Must generate token first.');
            return;
        }

        setStatus('Sending request to backend API...');
        try {
            const response = await fetch('/api/test/fcm/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: fcmToken,
                    title: 'Frontend Test Push',
                    body: 'This push was triggered from the FcmTester React component!'
                })
            });

            if (response.ok) {
                const resultText = await response.text();
                setStatus(`Backend Response: ${resultText}`);
            } else {
                setStatus(`Backend API Error: ${response.status}`);
            }
        } catch (error) {
            console.error('Error sending request to backend:', error);
            setStatus(`Error calling backend: ${error.message}`);
        }
    };



    return (
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '20px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <h3>Firebase Push Notification Tester</h3>
            <p style={{ margin: '10px 0', color: '#ffb74d' }}>Status: {status}</p>

            {notificationMsg && (
                <div style={{ padding: '10px', backgroundColor: '#e3f2fd', color: '#0d47a1', borderRadius: '4px', marginBottom: '10px' }}>
                    {notificationMsg}
                </div>
            )}

            <div style={{ marginBottom: '15px' }}>
                <button
                    onClick={requestPermissionAndGetToken}
                    style={{ padding: '8px 16px', marginRight: '10px', cursor: 'pointer' }}
                >
                    1. Request Permission & Get Token
                </button>
            </div>

            {fcmToken && (
                <div style={{ marginBottom: '15px' }}>
                    <p><strong>Your FCM Token:</strong></p>
                    <textarea
                        readOnly
                        value={fcmToken}
                        style={{ width: '100%', height: '80px', fontSize: '12px', padding: '5px' }}
                    />
                </div>
            )}

            <div style={{ marginBottom: '15px' }}>
                <button
                    onClick={sendTestPush}
                    disabled={!fcmToken}
                    style={{ padding: '8px 16px', marginRight: '10px', cursor: fcmToken ? 'pointer' : 'not-allowed', opacity: fcmToken ? 1 : 0.5 }}
                >
                    2. Send Test Push via Backend
                </button>
            </div>


        </div>
    );
};

export default FcmTester;
