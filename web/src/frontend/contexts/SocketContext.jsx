import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { getToken, getUserInfo } from '../utils/api';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const currentUserIdRef = useRef(null);
    const [socketTrigger, setSocketTrigger] = useState(0); // Trigger to recreate socket

    // Initialize currentUserId on mount
    useEffect(() => {
        const userInfo = getUserInfo();
        if (userInfo?.id) {
            currentUserIdRef.current = userInfo.id;
            setSocketTrigger(1); // Initial trigger
        }
    }, []);

    // Monitor user changes (check every 2 seconds)
    useEffect(() => {
        const checkUserChange = setInterval(() => {
            const userInfo = getUserInfo();
            const userId = userInfo?.id;
            const prevUserId = currentUserIdRef.current;
            
            // User changed
            if (prevUserId && userId && userId !== prevUserId) {
                console.log('🔄 User changed from', prevUserId, 'to', userId);
                setNotifications([]);
                currentUserIdRef.current = userId;
                
                // Disconnect old socket
                if (socket) {
                    console.log('Disconnecting old socket...');
                    socket.disconnect();
                    setSocket(null);
                    setIsConnected(false);
                }
                
                // Trigger socket recreation after a short delay
                setTimeout(() => {
                    console.log('Triggering socket recreation...');
                    setSocketTrigger(prev => prev + 1);
                }, 100);
            } 
            // User logged out
            else if (!userId && prevUserId) {
                console.log('👋 User logged out');
                setNotifications([]);
                currentUserIdRef.current = null;
                if (socket) {
                    socket.disconnect();
                    setSocket(null);
                    setIsConnected(false);
                }
            }
            // User logged in (first time)
            else if (userId && !prevUserId) {
                console.log('👋 User logged in:', userId);
                currentUserIdRef.current = userId;
                setSocketTrigger(prev => prev + 1);
            }
        }, 2000);

        return () => clearInterval(checkUserChange);
    }, [socket]);

    useEffect(() => {
        let token = getToken();
        const userInfo = getUserInfo();
        const userId = userInfo?.id;
        
        if (!token || !userId) {
            console.log('No token or userId found, skipping socket connection');
            return;
        }

        // Initialize socket connection with token refresh logic
        const newSocket = io(process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000', {
            auth: (cb) => {
                // Get fresh token on each auth attempt
                const freshToken = getToken();
                cb({ token: freshToken });
            },
            path: '/socket.io',
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionDelay: 800,
            reconnectionAttempts: 5,
            timeout: 20000,
            forceNew: true,
            upgrade: true
        });

        // Connection events
        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('connected', (data) => {
            console.log('📡 Server confirmed connection:', data);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            setIsConnected(false);
        });

        // Receive alarm notifications
        newSocket.on('alarm-notification', (alarmData) => {
            console.log('🚨 Received alarm notification:', alarmData);
            console.log('🔍 Current user info:', { token: getToken()?.substring(0, 20) });
            
            // Add to notifications list
            setNotifications(prev => [alarmData, ...prev]);
            
            // Optional: Play sound for critical alarms
            if (alarmData.severity === 'CRITICAL') {
                playAlertSound();
            }
        });

        // Error handling
        newSocket.on('connect_error', async (error) => {
            console.error('❌ Socket connection error:', error.message);
            console.error('Error details:', error);
            setIsConnected(false);
            
            // If authentication error, try to refresh token
            if (error.message && error.message.includes('Authentication')) {
                console.log('🔄 Token expired, attempting to refresh...');
                try {
                    const { refreshAccessToken, setToken } = await import('../utils/api');
                    const response = await refreshAccessToken();
                    if (response.access_token) {
                        setToken(response.access_token);
                        console.log('✅ Token refreshed, reconnecting socket...');
                        // Socket will auto-reconnect with new token
                    }
                } catch (err) {
                    console.error('❌ Token refresh failed:', err);
                    console.log('Please re-login');
                    // Optionally redirect to login
                }
            }
        });

        newSocket.on('error', (error) => {
            console.error('❌ Socket error:', error);
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [socketTrigger]); // Re-run when socketTrigger changes

    // Play alert sound
    const playAlertSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.error('Failed to play alert sound:', error);
        }
    };

    // Mark notification as read
    const markAsRead = (notificationId) => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === notificationId ? { ...notif, read: true } : notif
            )
        );
    };

    // Clear all notifications
    const clearNotifications = () => {
        setNotifications([]);
    };

    // Get unread count
    const unreadCount = notifications.filter(n => !n.read).length;

    const value = {
        socket,
        isConnected,
        notifications,
        unreadCount,
        markAsRead,
        clearNotifications
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
