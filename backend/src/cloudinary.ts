import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

let isCloudinaryConfigured = false;

export function initCloudinary(): typeof cloudinary {
  if (!isCloudinaryConfigured) {
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || 'qrzxe89y')?.trim().replace(/^["']|["']$/g, '');
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim().replace(/^["']|["']$/g, '');
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim().replace(/^["']|["']$/g, '');
    const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim().replace(/^["']|["']$/g, '');

    if (cloudinaryUrl) {
      cloudinary.config({
        cloudinary_url: cloudinaryUrl,
        secure: true,
      });
      console.log('[Cloudinary] Configured using CLOUDINARY_URL');
    } else {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      console.log('[Cloudinary] Configured with cloud_name:', cloudName, 'apiKey present:', Boolean(apiKey));
    }
    isCloudinaryConfigured = true;
  }
  return cloudinary;
}

export async function downloadAudioFile(
  url: string,
  destinationPath: string,
  maxBytes: number = (Number(process.env.MAX_FILE_SIZE_MB) || 25) * 1024 * 1024
): Promise<void> {
  const dir = path.dirname(destinationPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const response = await axios({
    method: 'GET',
    url,
    responseType: 'stream',
    timeout: 30000,
    headers: {
      'User-Agent': 'VoiceDenoiseBackend/1.0',
    },
  });

  const contentLength = response.headers['content-length'];
  if (contentLength && parseInt(String(contentLength), 10) > maxBytes) {
    throw new Error(`Audio file exceeds maximum allowed size of ${maxBytes / (1024 * 1024)}MB`);
  }

  let totalBytes = 0;
  const writer = fs.createWriteStream(destinationPath);

  return new Promise((resolve, reject) => {
    response.data.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        writer.destroy();
        fs.unlink(destinationPath, () => {});
        reject(new Error(`Audio file exceeds maximum allowed size of ${maxBytes / (1024 * 1024)}MB`));
      }
    });

    response.data.pipe(writer);

    writer.on('finish', () => resolve());
    writer.on('error', (err) => {
      fs.unlink(destinationPath, () => {});
      reject(err);
    });
    response.data.on('error', (err: any) => {
      fs.unlink(destinationPath, () => {});
      reject(err);
    });
  });
}

export async function uploadProcessedAudio(
  filePath: string,
  folder: string
): Promise<{ secure_url: string; public_id: string; duration?: number }> {
  initCloudinary();

  if (!fs.existsSync(filePath)) {
    throw new Error(`Processed audio file does not exist at ${filePath}`);
  }

  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: 'video',
    folder,
    format: 'm4a',
    overwrite: true,
  });

  if (!result || !result.secure_url) {
    throw new Error('Cloudinary response missing secure_url');
  }

  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
    duration: result.duration,
  };
}
