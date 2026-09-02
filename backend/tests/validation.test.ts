import { validateAudioProcessPayload } from '../src/validation';

describe('Validation Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should accept a valid Cloudinary URL and coupleId', () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'datty-cloud';

    const payload = {
      sourceUrl: 'https://res.cloudinary.com/datty-cloud/video/upload/v12345/datty/couple-123/chat/test.m4a',
      coupleId: 'couple-123',
      durationSeconds: 15,
    };

    const result = validateAudioProcessPayload(payload);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(payload);
  });

  it('should reject a non-Cloudinary URL', () => {
    const payload = {
      sourceUrl: 'https://malicious-site.com/audio.m4a',
      coupleId: 'couple-123',
      durationSeconds: 10,
    };

    const result = validateAudioProcessPayload(payload);
    expect(result.success).toBe(false);
    expect(result.errors?.some((e) => e.includes('sourceUrl'))).toBe(true);
  });

  it('should reject a Cloudinary URL from a different cloud_name when configured', () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'datty-official';

    const payload = {
      sourceUrl: 'https://res.cloudinary.com/other-unauthorized-account/video/upload/test.m4a',
      coupleId: 'couple-123',
      durationSeconds: 10,
    };

    const result = validateAudioProcessPayload(payload);
    expect(result.success).toBe(false);
    expect(result.errors?.some((e) => e.includes('sourceUrl'))).toBe(true);
  });

  it('should reject invalid coupleId with dangerous characters', () => {
    const payload = {
      sourceUrl: 'https://res.cloudinary.com/datty-cloud/video/upload/test.m4a',
      coupleId: '../../../etc/passwd',
      durationSeconds: 5,
    };

    const result = validateAudioProcessPayload(payload);
    expect(result.success).toBe(false);
    expect(result.errors?.some((e) => e.includes('coupleId'))).toBe(true);
  });

  it('should reject negative or zero duration', () => {
    const payload = {
      sourceUrl: 'https://res.cloudinary.com/datty-cloud/video/upload/test.m4a',
      coupleId: 'couple-123',
      durationSeconds: -5,
    };

    const result = validateAudioProcessPayload(payload);
    expect(result.success).toBe(false);
    expect(result.errors?.some((e) => e.includes('durationSeconds'))).toBe(true);
  });

  it('should reject durations exceeding MAX_DURATION_SECONDS', () => {
    process.env.MAX_DURATION_SECONDS = '120';

    const payload = {
      sourceUrl: 'https://res.cloudinary.com/datty-cloud/video/upload/test.m4a',
      coupleId: 'couple-123',
      durationSeconds: 150,
    };

    const result = validateAudioProcessPayload(payload);
    expect(result.success).toBe(false);
    expect(result.errors?.some((e) => e.includes('durationSeconds'))).toBe(true);
  });
});
