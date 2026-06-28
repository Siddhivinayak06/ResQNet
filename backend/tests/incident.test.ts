import request from 'supertest';
import app from '../src/app';

describe('Incident API', () => {
  it('should list incidents via GET /api/v1/incidents', async () => {
    const res = await request(app).get('/api/v1/incidents');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
