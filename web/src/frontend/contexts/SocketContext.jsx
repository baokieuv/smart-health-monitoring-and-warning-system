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

    // Monitor user changes (check every 1 second)
    useEffect(() => {
        const checkUserChange = setInterval(() => {
            const userInfo = getUserInfo();
            const userId = userInfo?.id;
            
            if (currentUserIdRef.current && userId !== currentUserIdRef.current) {
                console.log('🔄 User changed detected, clearing old notifications');
                setNotifications([]);
                currentUserIdRef.current = userId;
                
                // Disconnect old socket
                if (socket) {
                    socket.disconnect();
                    setSocket(null);
                }
            } else if (!userId && currentUserIdRef.current) {
                // User logged out
                console.log('👋 User logged out, clearing notifications');
                setNotifications([]);
                currentUserIdRef.current = null;
                if (socket) {
                    socket.disconnect();
                    setSocket(null);
                }
            }
        }, 1000);

        return () => clearInterval(checkUserChange);
    }, [socket]);

    useEffect(() => {
        const token = getToken();
        const userInfo = getUserInfo();
        const userId = userInfo?.id;
        
        // Update current user ID on mount
        if (!currentUserIdRef.current) {
            currentUserIdRef.current = userId;
        }
        
        if (!token) {
            console.log('No token found, skipping socket connection');
            return;
        }

        // Initialize socket connection
        const newSocket = io(process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000', {
            auth: {
                token: token
            },
            path: '/socket.io',
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
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
        newSocket.on('connect_error', (error) => {
                console.error('❌ Socket connection error:', error.message);
            console.error('Error details:', error);
            setIsConnected(false);
            
            // If authentication error, try to refresh token
            if (error.message && error.message.includes('Authentication')) {
                console.log('🔄 Token might be expired, please re-login');
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
    }, []);

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
