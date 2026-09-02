import { z } from 'zod';

export const AudioProcessRequestSchema = z.object({
  sourceUrl: z
    .string()
    .url('sourceUrl must be a valid URL')
    .refine((url) => {
      try {
        const parsed = new URL(url);
        // Ensure https protocol
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
          return false;
        }
        // Validate Cloudinary host
        const isCloudinary = parsed.hostname === 'res.cloudinary.com' || parsed.hostname.endsWith('.cloudinary.com');
        if (!isCloudinary) return false;

        // If CLOUDINARY_CLOUD_NAME is configured in env, ensure URL matches this account
        const configuredCloudName = process.env.CLOUDINARY_CLOUD_NAME;
        if (configuredCloudName) {
          const pathSegments = parsed.pathname.split('/').filter(Boolean);
          if (pathSegments.length > 0 && pathSegments[0] !== configuredCloudName) {
            return false;
          }
        }

        return true;
      } catch {
        return false;
      }
    }, {
      message: 'sourceUrl must be a valid Cloudinary URL belonging to the configured Cloudinary account',
    }),
  coupleId: z
    .string()
    .min(1, 'coupleId is required')
    .regex(/^[a-zA-Z0-9_-]+$/, 'coupleId contains invalid characters'),
  durationSeconds: z
    .number()
    .positive('durationSeconds must be positive')
    .refine(
      (val) => {
        const max = Number(process.env.MAX_DURATION_SECONDS) || 300;
        return val <= max;
      },
      (val) => ({
        message: `durationSeconds cannot exceed ${Number(process.env.MAX_DURATION_SECONDS) || 300} seconds`,
      })
    )
    .optional(),
});

export type AudioProcessRequest = z.infer<typeof AudioProcessRequestSchema>;

export function validateAudioProcessPayload(data: unknown): {
  success: boolean;
  data?: AudioProcessRequest;
  errors?: string[];
} {
  const result = AudioProcessRequestSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return { success: false, errors };
  }
  return { success: true, data: result.data };
}
