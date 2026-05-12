import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './lib/db.js';
import authRoute from './routes/authRoute.js';
import cookieParser from 'cookie-parser';
import userRoute from './routes/userRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// middleware
app.use(express.json());
app.use(cookieParser());

// public routes
app.use('/api/auth', authRoute);

// protected routes
app.use('/api/user', userRoute);

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});