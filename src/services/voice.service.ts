import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

/* =========================================================
   CLOUDINARY CONFIG
========================================================= */

const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME?.trim();

const apiKey =
  process.env.CLOUDINARY_API_KEY?.trim();

const apiSecret =
  process.env.CLOUDINARY_API_SECRET?.trim();

if (
  cloudName &&
  apiKey &&
  apiSecret
) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  console.log("Cloudinary: Configured");
} else {
  console.warn(
    "⚠️ Cloudinary credentials are missing"
  );
}

/* =========================================================
   TYPES
========================================================= */

export interface VoiceUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  resourceType: string;
  format: string | null;
  bytes: number;
  duration: number | null;
}

/* =========================================================
   CONSTANTS
========================================================= */

const MAX_VOICE_SIZE =
  25 * 1024 * 1024; // 25 MB

const ALLOWED_AUDIO_TYPES =
  new Set([
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/m4a",
    "audio/aac",
    "audio/wav",
    "audio/x-wav",
    "audio/webm",
    "audio/ogg",
    "audio/opus",
  ]);

/* =========================================================
   CLOUDINARY CHECK
========================================================= */

function ensureCloudinary() {
  if (
    !cloudName ||
    !apiKey ||
    !apiSecret
  ) {
    throw new Error(
      "Cloudinary is not configured"
    );
  }
}

/* =========================================================
   MIME VALIDATION
========================================================= */

function normalizeMimeType(
  mimeType?: string
) {
  return (
    mimeType
      ?.trim()
      .toLowerCase() || ""
  );
}

function isAllowedAudioType(
  mimeType?: string
) {
  const normalized =
    normalizeMimeType(mimeType);

  return ALLOWED_AUDIO_TYPES.has(
    normalized
  );
}

/* =========================================================
   BUFFER → CLOUDINARY
========================================================= */

function uploadBufferToCloudinary(
  buffer: Buffer,
  options: {
    folder: string;
    publicId?: string;
    resourceType?: "video" | "raw";
  }
): Promise<any> {
  return new Promise(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              options.folder,

            public_id:
              options.publicId,

            /*
             * Cloudinary audio files are
             * normally handled as video resources.
             */
            resource_type:
              options.resourceType ||
              "video",

            overwrite: false,

            unique_filename: true,

            use_filename: false,
          },

          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            if (!result) {
              reject(
                new Error(
                  "Cloudinary returned empty result"
                )
              );

              return;
            }

            resolve(result);
          }
        );

      const stream =
        Readable.from(buffer);

      stream.on(
        "error",
        reject
      );

      stream.pipe(uploadStream);
    }
  );
}

/* =========================================================
   UPLOAD VOICE BUFFER
========================================================= */

export async function uploadVoice(
  buffer: Buffer,
  mimeType: string,
  originalName?: string
): Promise<VoiceUploadResult> {
  ensureCloudinary();

  if (!Buffer.isBuffer(buffer)) {
    throw new Error(
      "Invalid voice file"
    );
  }

  if (buffer.length === 0) {
    throw new Error(
      "Voice file is empty"
    );
  }

  if (
    buffer.length >
    MAX_VOICE_SIZE
  ) {
    throw new Error(
      "Voice file is too large. Maximum size is 25MB"
    );
  }

  const normalizedMime =
    normalizeMimeType(
      mimeType
    );

  if (
    !isAllowedAudioType(
      normalizedMime
    )
  ) {
    throw new Error(
      `Unsupported audio type: ${normalizedMime}`
    );
  }

  const publicId =
    originalName
      ? originalName
          .replace(
            /\.[^/.]+$/,
            ""
          )
          .replace(
            /[^a-zA-Z0-9_-]/g,
            "_"
          )
          .slice(0, 80)
      : undefined;

  const result =
    await uploadBufferToCloudinary(
      buffer,
      {
        folder:
          "tasko/voice",
        publicId,
        resourceType:
          "video",
      }
    );

  return {
    url:
      result.url,

    secureUrl:
      result.secure_url,

    publicId:
      result.public_id,

    resourceType:
      result.resource_type,

    format:
      result.format || null,

    bytes:
      Number(
        result.bytes || buffer.length
      ),

    duration:
      typeof result.duration ===
      "number"
        ? result.duration
        : null,
  };
}

/* =========================================================
   UPLOAD VOICE FROM MULTER FILE
========================================================= */

export async function uploadVoiceFile(
  file: Express.Multer.File
): Promise<VoiceUploadResult> {
  if (!file) {
    throw new Error(
      "Voice file is required"
    );
  }

  return uploadVoice(
    file.buffer,
    file.mimetype,
    file.originalname
  );
}

/* =========================================================
   DELETE VOICE
========================================================= */

export async function deleteVoice(
  publicId: string
) {
  ensureCloudinary();

  const normalized =
    publicId?.trim();

  if (!normalized) {
    throw new Error(
      "Voice public ID is required"
    );
  }

  return cloudinary.uploader.destroy(
    normalized,
    {
      resource_type:
        "video",
    }
  );
}

/* =========================================================
   EXPORT CONSTANTS
========================================================= */

export const VOICE_CONFIG = {
  maxSize:
    MAX_VOICE_SIZE,

  maxSizeMB:
    MAX_VOICE_SIZE /
    1024 /
    1024,

  allowedMimeTypes:
    Array.from(
      ALLOWED_AUDIO_TYPES
    ),
};