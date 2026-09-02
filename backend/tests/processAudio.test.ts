import { runFFmpegDenoise, cleanupFiles } from '../src/processAudio';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import ffmpeg from 'fluent-ffmpeg';

describe('FFmpeg Audio Processing Tests', () => {
  const tempDir = os.tmpdir();
  const testInputPath = path.join(tempDir, `test-input-${Date.now()}.wav`);
  const testOutputPath = path.join(tempDir, `test-output-${Date.now()}.m4a`);

  beforeAll((done) => {
    // Generate a 1-second synthetic sine tone file for testing
    ffmpeg()
      .input('sine=frequency=440:duration=1')
      .inputFormat('lavfi')
      .audioCodec('pcm_s16le')
      .output(testInputPath)
      .on('end', () => done())
      .on('error', (err) => done(err))
      .run();
  });

  afterAll(() => {
    cleanupFiles(testInputPath, testOutputPath);
  });

  it('should process audio through afftdn and loudnorm filter chain and generate a valid .m4a', async () => {
    expect(fs.existsSync(testInputPath)).toBe(true);

    await runFFmpegDenoise(testInputPath, testOutputPath);

    expect(fs.existsSync(testOutputPath)).toBe(true);
    const stat = fs.statSync(testOutputPath);
    expect(stat.size).toBeGreaterThan(500); // Verify non-empty audio container
  });

  it('should safely cleanup files without throwing errors', () => {
    const dummyPath1 = path.join(tempDir, `dummy-${Date.now()}-1.tmp`);
    const dummyPath2 = path.join(tempDir, `dummy-${Date.now()}-2.tmp`);

    fs.writeFileSync(dummyPath1, 'test');
    fs.writeFileSync(dummyPath2, 'test');

    expect(fs.existsSync(dummyPath1)).toBe(true);
    expect(fs.existsSync(dummyPath2)).toBe(true);

    cleanupFiles(dummyPath1, dummyPath2, null, undefined, '/non/existent/path.tmp');

    expect(fs.existsSync(dummyPath1)).toBe(false);
    expect(fs.existsSync(dummyPath2)).toBe(false);
  });
});
