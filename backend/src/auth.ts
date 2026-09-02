import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

let isFirebaseInitialized = false;

export function initializeFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    isFirebaseInitialized = true;
    return admin.app();
  }

  try {
    const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
    if (rawJson) {
      let parsed: any;
      try {
        parsed = JSON.parse(rawJson);
      } catch {
        // Try decoding from base64 if user encoded it
        parsed = JSON.parse(Buffer.from(rawJson, 'base64').toString('utf8'));
      }

      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }

      const app = admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });
      isFirebaseInitialized = true;
      console.log('[Auth] Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT_JSON');
      return app;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    let privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();

    if (projectId && clientEmail && privateKey) {
      // Strip outer quotes if pasted with quotes in cloud UI
      privateKey = privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

      const app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      isFirebaseInitialized = true;
      console.log('[Auth] Firebase Admin initialized from individual env credentials');
      return app;
    }

    // Default application credentials or local development
    const app = admin.initializeApp();
    isFirebaseInitialized = true;
    console.log('[Auth] Firebase Admin initialized using default credentials');
    return app;
  } catch (error: any) {
    console.warn('[Auth] Firebase Admin initialization warning:', error.message);
    // In test environment, allow mock operations
    if (process.env.NODE_ENV === 'test') {
      const app = admin.initializeApp({ projectId: 'test-project' });
      isFirebaseInitialized = true;
      return app;
    }
    throw error;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

export async function authenticateFirebaseToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header. Expected Bearer <token>',
    });
    return;
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Bearer token cannot be empty',
    });
    return;
  }

  try {
    if (!isFirebaseInitialized) {
      initializeFirebaseAdmin();
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.error('[Auth] Token verification failed:', error.message || error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired Firebase ID token',
      code: error.code || 'auth/invalid-token',
    });
  }
}
