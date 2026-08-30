// Compress photos before upload: resize to max 1280px wide and re-encode as
// JPEG @ 0.6. A 12MP gallery photo becomes ~200–400KB instead of several MB.
// This is the fix for the Android image-send crash (the app restarted because
// fetching + uploading full-res images blew the memory budget).

// Lazy require (not a static import): if the dev client binary doesn't include
// the ExpoImageManipulator native module yet, require() throws — callers catch
// it and show the "Upload failed" state instead of crashing the app.
let manipulator: typeof import('expo-image-manipulator') | null = null;

function getManipulator(): typeof import('expo-image-manipulator') {
  if (!manipulator) {
    manipulator = require('expo-image-manipulator');
  }
  return manipulator!;
}

export async function prepareImageForUpload(uri: string): Promise<string> {
  const ImageManipulator = getManipulator();
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1280 } }],
    {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );
  return result.uri;
}