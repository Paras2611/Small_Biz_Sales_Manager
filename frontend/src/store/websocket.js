import { useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from './authStore';

let stompClient = null;
const listeners = new Set();

export const subscribeToSync = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

export const initializeWebSocket = () => {
  if (stompClient) return;

  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';
  
  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${baseUrl}/ws`),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  stompClient.onConnect = () => {
    console.log('Connected to WebSocket for real-time sync');
    stompClient.subscribe('/topic/updates', (message) => {
      if (message.body) {
        const payload = JSON.parse(message.body);
        listeners.forEach((cb) => cb(payload));
      }
    });
  };

  stompClient.onStompError = (frame) => {
    console.error('Broker reported error: ' + frame.headers['message']);
    console.error('Additional details: ' + frame.body);
  };

  stompClient.activate();
};

export const disconnectWebSocket = () => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
};
