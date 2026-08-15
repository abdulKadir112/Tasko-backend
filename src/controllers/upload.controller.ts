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

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          console.log("❌ CLOUDINARY ERROR:", error);
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary returned no result"));
          return;
        }

        console.log("✅ CLOUDINARY UPLOAD SUCCESS");
        console.log("🔗 URL:", result.secure_url);
        console.log("🆔 Public ID:", result.public_id);

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
  console.log("==========================================");
  console.log("🔥 IMAGE CONTROLLER HIT");
  console.log("==========================================");

  try {
    const file = req.file;

    if (!file) {
      console.log("❌ IMAGE FILE NOT FOUND");

      return res.status(400).json({
        success: false,
        message: "No image selected",
      });
    }

    console.log("📦 IMAGE FILE RECEIVED");
    console.log("📄 Name:", file.originalname);
    console.log("🎵 MIME:", file.mimetype);
    console.log("📦 Size:", file.size);

    // -------------------------------------------------------
    // Cloudinary
    // -------------------------------------------------------

    const result = await uploadToCloudinary(
      file,
      "service-marketplace/images",
      "image"
    );

    const imageUrl = result.secure_url;

    console.log("🎉 IMAGE UPLOAD COMPLETE");
    console.log("🔗 Image URL:", imageUrl);

    return res.status(200).json({
      success: true,
      data: {
        url: imageUrl,
        imageUrl,
        publicId: result.public_id,
        width: result.width ?? null,
        height: result.height ?? null,
        format: result.format ?? null,
        bytes: result.bytes ?? null,
      },
    });
  } catch (error: any) {
    console.log("❌ IMAGE UPLOAD ERROR");
    console.log("Message:", error?.message);
    console.log("Error:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
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
  console.log("==========================================");
  console.log("🔥 VOICE CONTROLLER HIT");
  console.log("==========================================");

  try {
    const file = req.file;

    if (!file) {
      console.log("❌ VOICE FILE NOT FOUND");

      return res.status(400).json({
        success: false,
        message: "No voice selected",
      });
    }

    console.log("🎵 VOICE FILE RECEIVED");
    console.log("📄 Name:", file.originalname);
    console.log("🎵 MIME:", file.mimetype);
    console.log("📦 Size:", file.size);

    // -------------------------------------------------------
    // Cloudinary
    // -------------------------------------------------------

    const result = await uploadToCloudinary(
      file,
      "service-marketplace/voices",
      "auto"
    );

    const voiceUrl = result.secure_url;

    console.log("🎉 VOICE UPLOAD COMPLETE");
    console.log("🔗 Voice URL:", voiceUrl);

    return res.status(200).json({
      success: true,
      data: {
        url: voiceUrl,
        voiceUrl,
        publicId: result.public_id,
        duration: result.duration ?? null,
        bytes: result.bytes ?? null,
        format: result.format ?? null,
        resourceType:
          result.resource_type ?? null,
      },
    });
  } catch (error: any) {
    console.log("❌ VOICE UPLOAD ERROR");
    console.log("Message:", error?.message);
    console.log("Error:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
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
  console.log("==========================================");
  console.log("🔥 DOCUMENT CONTROLLER HIT");
  console.log("==========================================");

  try {
    const file = req.file;

    if (!file) {
      console.log("❌ DOCUMENT FILE NOT FOUND");

      return res.status(400).json({
        success: false,
        message: "No document selected",
      });
    }

    console.log("📄 DOCUMENT FILE RECEIVED");
    console.log("📄 Name:", file.originalname);
    console.log("🎵 MIME:", file.mimetype);
    console.log("📦 Size:", file.size);

    // -------------------------------------------------------
    // Cloudinary
    // -------------------------------------------------------

    const result = await uploadToCloudinary(
      file,
      "service-marketplace/documents",
      "raw"
    );

    const documentUrl = result.secure_url;

    console.log("🎉 DOCUMENT UPLOAD COMPLETE");
    console.log("🔗 Document URL:", documentUrl);

    return res.status(200).json({
      success: true,
      data: {
        url: documentUrl,
        documentUrl,
        publicId: result.public_id,
        bytes: result.bytes ?? null,
        format: result.format ?? null,
        resourceType:
          result.resource_type ?? null,
      },
    });
  } catch (error: any) {
    console.log("❌ DOCUMENT UPLOAD ERROR");
    console.log("Message:", error?.message);
    console.log("Error:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Document upload failed",
    });
  }
}