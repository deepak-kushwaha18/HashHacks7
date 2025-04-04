import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import { generateResult } from './services/ai.service.js';

const port = process.env.PORT || 4000;

const server = http.createServer(app);


const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});


io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;

        if (!projectId) {
            return next(new Error('Project ID is required'));
        }

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid project ID'));
        }

        const project = await projectModel.findById(projectId);
        if (!project) {
            return next(new Error('Project not found'));
        }

        socket.project = project;

        if (!token) {
            return next(new Error('Authentication token is required'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded) {
                return next(new Error('Invalid token'));
            }
            socket.user = decoded;
            next();
        } catch (jwtError) {
            return next(new Error('Invalid token'));
        }
    } catch (error) {
        console.error('Socket middleware error:', error)
        next(new Error('Authentication failed'));
    }
});


io.on('connection', socket => {
    try {
        socket.roomId = socket.project._id.toString();
        console.log(`User connected to project: ${socket.roomId}`);

        socket.join(socket.roomId);

        socket.on('project-message', async data => {
            try {
                const message = data.message;
                const aiIsPresentInMessage = message.includes('@ai');


                if (!aiIsPresentInMessage) {
                    socket.broadcast.to(socket.roomId).emit('project-message', data);
                    return;
                }


                try {
                    const prompt = message.replace('@ai', '').trim();
                    if (!prompt) {
                        throw new Error('Empty prompt');
                    }

                    console.log('Processing AI request:', prompt);
                    const result = await generateResult(prompt);
                    console.log('AI response generated:', result);
                    
                    io.to(socket.roomId).emit('project-message', {
                        message: result,
                        sender: {
                            _id: 'ai',
                            email: 'AI'
                        }
                    });
                } catch (aiError) {
                    console.error('AI generation error:', aiError);
                    

                    let errorMessage = 'Sorry, I encountered an error processing your request.';
                    
                    if (aiError.message.includes('API key') || aiError.message.includes('model access')) {
                        errorMessage = 'The AI service is not properly configured. Please contact the administrator.';
                    } else if (aiError.message.includes('placeholder')) {
                        errorMessage = 'The AI service is not properly configured. Please set a valid Google AI API key in the .env file.';
                    } else if (aiError.message.includes('quota')) {
                        errorMessage = 'The AI service quota has been exceeded. Please try again later.';
                    } else if (aiError.message.includes('rate limit')) {
                        errorMessage = 'Too many requests. Please wait a moment and try again.';
                    }
                    

        socket.emit('project-message', {
                        message: { text: errorMessage },
                        sender: {
                            _id: 'ai',
                            email: 'AI'
                        }
                    });
                }
            } catch (error) {
                console.error('Message handling error:', error);
                socket.emit('error', { message: 'Error processing message' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected from project: ${socket.roomId}`);
            socket.leave(socket.roomId);
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
            socket.emit('error', { message: 'An error occurred' });
        });
    } catch (error) {
        console.error('Connection handling error:', error);
               socket.disconnect(true);
    }
});


server.on('error', (error) => {
    console.error('Server error:', error);
});
console.log("GOOGLE_AI_KEY:", process.env.GOOGLE_AI_KEY ? "Loaded" : "Not Loaded");


server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
