import socket from 'socket.io-client';

let socketInstance = null;

export const initializeSocket = (projectId) => {
    // If we already have a socket instance, disconnect it first
    if (socketInstance) {
        socketInstance.disconnect();
    }

    // Create a new socket instance
    socketInstance = socket(import.meta.env.VITE_API_URL, {
        auth: {
            token: localStorage.getItem('token')
        },
        query: {
            projectId
        }
    });

    return socketInstance;
}

export const receiveMessage = (eventName, cb) => {
    if (!socketInstance) {
        console.error('Socket not initialized');
        return;
    }
    socketInstance.on(eventName, cb);
}

export const sendMessage = (eventName, data) => {
    if (!socketInstance) {
        console.error('Socket not initialized');
        return;
    }
    socketInstance.emit(eventName, data);
}