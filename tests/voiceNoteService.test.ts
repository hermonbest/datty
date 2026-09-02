import { processAndUploadVoiceNote } from '../src/services/voiceNoteService';
import * as FileSystem from 'expo-file-system/legacy';
import * as fileToBytes from '../src/services/fileToBytes';
import * as functionsModule from 'firebase/functions';

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: {
    Base64: 'base64',
  },
}));

jest.mock('../src/services/firebase', () => ({
  functions: {},
}));

jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(),
}));

jest.mock('../src/services/fileToBytes', () => ({
  uploadFileToCloudinary: jest.fn(),
}));

describe('voiceNoteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully returns secure_url from Cloud Function when processing succeeds', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce('base64audioData');
    const mockCallable = jest.fn().mockResolvedValueOnce({
      data: {
        secure_url: 'https://res.cloudinary.com/demo/video/upload/v1234/voice_proc.m4a',
        processed: true,
      },
    });
    (functionsModule.httpsCallable as jest.Mock).mockReturnValueOnce(mockCallable);

    const result = await processAndUploadVoiceNote('file:///path/to/note.m4a', 'datty/couple123/chat');

    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith('file:///path/to/note.m4a', {
      encoding: 'base64',
    });
    expect(mockCallable).toHaveBeenCalledWith({
      audioBase64: 'base64audioData',
      folder: 'datty/couple123/chat',
    });
    expect(result).toBe('https://res.cloudinary.com/demo/video/upload/v1234/voice_proc.m4a');
    expect(fileToBytes.uploadFileToCloudinary).not.toHaveBeenCalled();
  });

  it('falls back to direct Cloudinary upload when Cloud Function call fails', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce('base64audioData');
    const mockCallable = jest.fn().mockRejectedValueOnce(new Error('Network request failed'));
    (functionsModule.httpsCallable as jest.Mock).mockReturnValueOnce(mockCallable);
    (fileToBytes.uploadFileToCloudinary as jest.Mock).mockResolvedValueOnce(
      'https://res.cloudinary.com/demo/raw/upload/v1234/note_fallback.m4a'
    );

    const result = await processAndUploadVoiceNote('file:///path/to/note.m4a', 'datty/couple123/chat');

    expect(fileToBytes.uploadFileToCloudinary).toHaveBeenCalledWith(
      'file:///path/to/note.m4a',
      'raw',
      'datty/couple123/chat'
    );
    expect(result).toBe('https://res.cloudinary.com/demo/raw/upload/v1234/note_fallback.m4a');
  });

  it('falls back to direct Cloudinary upload when reading base64 fails', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValueOnce(new Error('File not readable'));
    (fileToBytes.uploadFileToCloudinary as jest.Mock).mockResolvedValueOnce(
      'https://res.cloudinary.com/demo/raw/upload/v1234/note_fallback2.m4a'
    );

    const result = await processAndUploadVoiceNote('file:///path/to/note.m4a', 'datty/couple123/chat');

    expect(fileToBytes.uploadFileToCloudinary).toHaveBeenCalledWith(
      'file:///path/to/note.m4a',
      'raw',
      'datty/couple123/chat'
    );
    expect(result).toBe('https://res.cloudinary.com/demo/raw/upload/v1234/note_fallback2.m4a');
  });
});
