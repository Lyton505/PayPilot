import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes placeholder
app.get('/api', (req, res) => {
  res.json({ message: 'PayPilot Backend API' });
});

app.listen(PORT, () => {
  console.log(`PayPilot backend server running on port ${PORT}`);
});