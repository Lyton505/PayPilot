import request from 'supertest';
import express from 'express';

// Simple test setup for the backend
const app = express();
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

describe('Backend API', () => {
  test('Health check endpoint should return OK', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeDefined();
  });
});