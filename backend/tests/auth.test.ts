import { authenticateFirebaseToken, AuthenticatedRequest } from '../src/auth';
import { Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

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

describe('Auth Middleware Tests', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    req = {
      headers: {},
    };
    res = {
      status: statusMock,
      json: jsonMock,
    };
    next = jest.fn();
  });

  it('should return 401 if Authorization header is missing', async () => {
    await authenticateFirebaseToken(req as AuthenticatedRequest, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Unauthorized' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if Authorization header does not start with Bearer', async () => {
    req.headers = { authorization: 'Basic 123456' };

    await authenticateFirebaseToken(req as AuthenticatedRequest, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Unauthorized' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if Bearer token is invalid/rejected by Firebase Admin', async () => {
    req.headers = { authorization: 'Bearer invalid-token' };
    const authInstance = admin.auth();
    (authInstance.verifyIdToken as jest.Mock).mockRejectedValueOnce(
      new Error('Decoding Firebase ID token failed')
    );

    await authenticateFirebaseToken(req as AuthenticatedRequest, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should authenticate successfully with valid token and populate req.user', async () => {
    req.headers = { authorization: 'Bearer valid-firebase-token' };
    const mockUser = {
      uid: 'user-xyz',
      email: 'test@example.com',
      aud: 'datty-project',
    };
    const authInstance = admin.auth();
    (authInstance.verifyIdToken as jest.Mock).mockResolvedValueOnce(mockUser);

    await authenticateFirebaseToken(req as AuthenticatedRequest, res as Response, next);

    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });
});
