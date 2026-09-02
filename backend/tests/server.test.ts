import request from 'supertest';
import { app } from '../src/server';
import * as admin from 'firebase-admin';
import * as cloudinaryModule from '../src/cloudinary';
import * as processAudioModule from '../src/processAudio';

// Mock Firebase Admin
jest.mock('firebase-admin', () => {
  const mockAuth = {
    verifyIdToken: jest.fn(),
  };
  return {
    apps: [],
    initializeApp: jest.fn(() => ({
      auth: () => mockAuth,
    })),
    app: jest.fn(() => ({
      auth: () => mockAuth,
    })),
    auth: jest.fn(() => mockAuth),
    credential: {
      cert: jest.fn(),
      applicationDefault: jest.fn(),
    },
  };
});

describe('Express Server Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Endpoints', () => {
    it('GET /health should return 200 with service status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('voice-denoise-backend');
      expect(res.body.timestamp).toBeDefined();
    });

    it('POST /health should return 200 with service status', async () => {
      const res = await request(app).post('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('POST /v1/audio/process', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/v1/audio/process')
        .send({
          sourceUrl: 'https://res.cloudinary.com/demo/video/upload/test.m4a',
          coupleId: 'c123',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('should reject invalid payload with 400 when authenticated', async () => {
      const authInstance = admin.auth();
      (authInstance.verifyIdToken as jest.Mock).mockResolvedValueOnce({ uid: 'test-user' });

      const res = await request(app)
        .post('/v1/audio/process')
        .set('Authorization', 'Bearer valid-test-token')
        .send({
          sourceUrl: 'not-a-url',
          coupleId: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Bad Request');
    });

    it('should process audio successfully end-to-end', async () => {
      const authInstance = admin.auth();
      (authInstance.verifyIdToken as jest.Mock).mockResolvedValueOnce({ uid: 'test-user' });

      jest.spyOn(cloudinaryModule, 'downloadAudioFile').mockResolvedValueOnce();
      jest.spyOn(processAudioModule, 'runFFmpegDenoise').mockResolvedValueOnce();
      jest.spyOn(cloudinaryModule, 'uploadProcessedAudio').mockResolvedValueOnce({
        secure_url: 'https://res.cloudinary.com/demo/video/upload/cleaned_output.m4a',
        public_id: 'datty/c123/chat/cleaned_output',
        duration: 12.5,
      });

      const res = await request(app)
        .post('/v1/audio/process')
        .set('Authorization', 'Bearer valid-test-token')
        .send({
          sourceUrl: 'https://res.cloudinary.com/demo/video/upload/test.m4a',
          coupleId: 'couple-abc',
          durationSeconds: 12,
        });

      expect(res.status).toBe(200);
      expect(res.body.audioUrl).toBe('https://res.cloudinary.com/demo/video/upload/cleaned_output.m4a');
      expect(res.body.processingVersion).toBe('afftdn-v1');
      expect(res.body.duration).toBe(12.5);
    });
  });
});
