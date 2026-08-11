import { createHash } from 'crypto';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export interface CloudinaryUploadResult {
  secureUrl: string;
}

const AVATAR_FOLDER = 'courseflix/avatars';

// No cloudinary SDK dependency — a signed upload is a handful of fields
// (folder + timestamp, signed per Cloudinary's documented recipe: sha1 of
// the sorted param string with the api secret appended) posted as
// multipart/form-data, which Node's built-in fetch/FormData/Blob already
// support. api_secret itself is only ever used here, server-side, to
// compute the signature — it's never sent to Cloudinary or to the browser.
export async function uploadImageToCloudinary(
  buffer: Buffer,
  filename: string,
  config: CloudinaryConfig,
): Promise<CloudinaryUploadResult> {
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `folder=${AVATAR_FOLDER}&timestamp=${timestamp}`;
  const signature = createHash('sha1')
    .update(paramsToSign + config.apiSecret)
    .digest('hex');

  const formData = new FormData();
  // Buffer's TS type admits SharedArrayBuffer-backed instances, which
  // BlobPart's type doesn't accept — a Node Buffer here is always backed
  // by a real ArrayBuffer in practice (Multer's memoryStorage allocates
  // it), so this narrows a type-checker mismatch, not a runtime one.
  formData.append(
    'file',
    new Blob([buffer as unknown as ArrayBuffer]),
    filename,
  );
  formData.append('api_key', config.apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', AVATAR_FOLDER);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    { method: 'POST', body: formData },
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `Cloudinary upload failed (${response.status}): ${errorBody.slice(0, 300)}`,
    );
  }

  const body = (await response.json()) as { secure_url?: string };
  if (!body.secure_url) {
    throw new Error('Cloudinary response did not include a secure_url.');
  }

  return { secureUrl: body.secure_url };
}
