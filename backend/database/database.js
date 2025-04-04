import mongoose from "mongoose";

async function connect() {
    try {

        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
        };

        await mongoose.connect(process.env.MONGODB_URI, options);
        console.log("Connected to MongoDB successfully");
        

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
            setTimeout(connect, 5000);
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });
        
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);

        setTimeout(connect, 5000);
    }
}

export default connect;
