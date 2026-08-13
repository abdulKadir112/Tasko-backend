import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import * as streamifier from "streamifier";


// =========================================================
// CLOUDINARY UPLOAD
// =========================================================

function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string,
  resourceType: "image" | "video" | "raw" | "auto"
) {
  return new Promise<any>((resolve, reject) => {
    console.log("☁️ CLOUDINARY UPLOAD START");
    console.log("📁 Folder:", folder);
    console.log("📄 File:", file.originalname);
    console.log("🎵 MIME:", file.mimetype);
    console.log("📦 Size:", file.size);
    console.log("🔧 Resource Type:", resourceType);

    const stream =
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },

        (error, result) => {
          if (error) {
            console.log(
              "❌ CLOUDINARY ERROR:",
              error
            );

            return reject(error);
          }

          console.log(
            "✅ CLOUDINARY UPLOAD SUCCESS"
          );

          console.log(
            "🔗 URL:",
            result?.secure_url
          );

          resolve(result);
        }
      );

    streamifier
      .createReadStream(file.buffer)
      .pipe(stream);
  });
}


// =========================================================
// IMAGE
// =========================================================

export async function uploadImage(
  req: Request,
  res: Response
) {
  console.log("🔥 IMAGE CONTROLLER HIT");

  try {
    console.log(
      "📦 IMAGE FILE:",
      req.file
    );

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image selected",
      });
    }

    const result =
      await uploadToCloudinary(
        req.file,
        "service-marketplace/images",
        "image"
      );

    return res.status(200).json({
      success: true,

      data: {
        url: result.secure_url,
        imageUrl: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (error: any) {
    console.log(
      "❌ IMAGE UPLOAD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ??
        "Image upload failed",
    });
  }
}


// =========================================================
// VOICE
// =========================================================

export async function uploadVoice(
  req: Request,
  res: Response
) {
  console.log(
    "🔥🔥🔥 VOICE CONTROLLER HIT 🔥🔥🔥"
  );

  try {
    console.log(
      "📦 VOICE FILE:",
      req.file
    );

    // =====================================================
    // FILE CHECK
    // =====================================================

    if (!req.file) {
      console.log(
        "❌ VOICE FILE NOT FOUND"
      );

      return res.status(400).json({
        success: false,
        message: "No voice selected",
      });
    }

    console.log(
      "🎵 VOICE FILE RECEIVED"
    );

    console.log(
      "📄 Original Name:",
      req.file.originalname
    );

    console.log(
      "🎵 MIME:",
      req.file.mimetype
    );

    console.log(
      "📦 Size:",
      req.file.size
    );

    // =====================================================
    // CLOUDINARY
    // =====================================================

    const result =
      await uploadToCloudinary(
        req.file,
        "service-marketplace/voices",
        "auto"
      );

    // =====================================================
    // RESULT
    // =====================================================

    console.log(
      "🎉 VOICE UPLOAD COMPLETE"
    );

    console.log(
      "🔗 Voice URL:",
      result.secure_url
    );

    return res.status(200).json({
      success: true,

      data: {
        url: result.secure_url,
        voiceUrl: result.secure_url,
        publicId: result.public_id,
        duration: result.duration ?? null,
        bytes: result.bytes,
        format: result.format,
        resourceType:
          result.resource_type ?? null,
      },
    });
  } catch (error: any) {
    console.log(
      "❌❌❌ VOICE UPLOAD ERROR ❌❌❌"
    );

    console.log(
      "Message:",
      error?.message
    );

    console.log(
      "Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ??
        "Voice upload failed",
    });
  }
}


// =========================================================
// DOCUMENT
// =========================================================

export async function uploadDocument(
  req: Request,
  res: Response
) {
  console.log(
    "🔥 DOCUMENT CONTROLLER HIT"
  );

  try {
    console.log(
      "📦 DOCUMENT FILE:",
      req.file
    );

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No document selected",
      });
    }

    const result =
      await uploadToCloudinary(
        req.file,
        "service-marketplace/documents",
        "raw"
      );

    return res.status(200).json({
      success: true,

      data: {
        url: result.secure_url,
        documentUrl:
          result.secure_url,
        publicId:
          result.public_id,
        bytes: result.bytes,
        format: result.format,
      },
    });
  } catch (error: any) {
    console.log(
      "❌ DOCUMENT UPLOAD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ??
        "Document upload failed",
    });
  }
}