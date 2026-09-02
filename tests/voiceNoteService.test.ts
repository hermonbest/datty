import {
  processAndUploadVoiceNote,
  applyCloudinaryAudioTransformations,
  uploadVoiceNoteWithCloudinaryTransform,
} from '../src/services/voiceNoteService';
import * as fileToBytes from '../src/services/fileToBytes';

jest.mock('../src/services/fileToBytes', () => ({
  uploadFileToCloudinary: jest.fn(),
}));

describe('voiceNoteService (Cloudinary Audio Transformations)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('applyCloudinaryAudioTransformations', () => {
    it('correctly injects audio transformations into a Cloudinary video URL and ensures .m4a format', () => {
      const original = 'https://res.cloudinary.com/qrzxe89y/video/upload/v1725274000/datty/chat/note.3gp';
      const transformed = applyCloudinaryAudioTransformations(original, 'e_volume:80');
      expect(transformed).toBe(
        'https://res.cloudinary.com/qrzxe89y/video/upload/e_volume:80/v1725274000/datty/chat/note.m4a'
      );
    });

    it('does not duplicate transformations if already present', () => {
      const alreadyTransformed =
        'https://res.cloudinary.com/qrzxe89y/video/upload/e_volume:80/v1725274000/datty/chat/note.m4a';
      const result = applyCloudinaryAudioTransformations(alreadyTransformed, 'e_volume:80');
      expect(result).toBe(alreadyTransformed);
    });

    it('returns original URL if not a Cloudinary video upload URL', () => {
      const rawUrl = 'https://res.cloudinary.com/qrzxe89y/raw/upload/v1725274000/datty/chat/note.m4a';
      expect(applyCloudinaryAudioTransformations(rawUrl)).toBe(rawUrl);
    });
  });

  describe('uploadVoiceNoteWithCloudinaryTransform', () => {
    it('uploads as video and applies volume boost and .m4a transformation', async () => {
      (fileToBytes.uploadFileToCloudinary as jest.Mock).mockResolvedValueOnce(
        'https://res.cloudinary.com/qrzxe89y/video/upload/v1725274000/datty/couple123/chat/test.3gp'
      );

      const result = await uploadVoiceNoteWithCloudinaryTransform('file:///path/to/note.m4a', 'datty/couple123/chat');

      expect(fileToBytes.uploadFileToCloudinary).toHaveBeenCalledWith(
        'file:///path/to/note.m4a',
        'video',
        'datty/couple123/chat'
      );
      expect(result).toBe(
        'https://res.cloudinary.com/qrzxe89y/video/upload/e_volume:80/v1725274000/datty/couple123/chat/test.m4a'
      );
    });

    it('falls back to raw upload if video upload fails', async () => {
      (fileToBytes.uploadFileToCloudinary as jest.Mock)
        .mockRejectedValueOnce(new Error('Video resource type error'))
        .mockResolvedValueOnce('https://res.cloudinary.com/qrzxe89y/raw/upload/v1725274000/datty/couple123/chat/test.m4a');

      const result = await uploadVoiceNoteWithCloudinaryTransform('file:///path/to/note.m4a', 'datty/couple123/chat');

      expect(fileToBytes.uploadFileToCloudinary).toHaveBeenCalledWith(
        'file:///path/to/note.m4a',
        'video',
        'datty/couple123/chat'
      );
      expect(fileToBytes.uploadFileToCloudinary).toHaveBeenCalledWith(
        'file:///path/to/note.m4a',
        'raw',
        'datty/couple123/chat'
      );
      expect(result).toBe('https://res.cloudinary.com/qrzxe89y/raw/upload/v1725274000/datty/couple123/chat/test.m4a');
    });
  });
});
