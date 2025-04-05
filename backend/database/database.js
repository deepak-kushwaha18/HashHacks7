import mongoose from "mongoose";

/**
 * Connect to MongoDB with retry logic
 * @returns {Promise<void>}
 */
async function connect() {
    try {
        // Set connection options
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        };

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, options);
        console.log("Connected to MongoDB successfully");
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
            setTimeout(connect, 5000); // Retry connection after 5 seconds
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });
        
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        // Retry connection after 5 seconds
        setTimeout(connect, 5000);
    }
}

export default connect;