import multer from "multer";

const storage = multer.memoryStorage();

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

const VOICE_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/aac",
  "audio/x-m4a",
];

const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  ...VOICE_MIME_TYPES,
  ...DOCUMENT_MIME_TYPES,
];

const upload = multer({
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
    files: 1,
  },

  fileFilter: (req, file, cb) => {
    console.log("==========================================");
    console.log("📥 MULTER FILE RECEIVED");
    console.log("📂 Field name:", file.fieldname);
    console.log("📄 Original name:", file.originalname);
    console.log("🎵 MIME type:", file.mimetype);
    console.log("==========================================");

    if (!file.fieldname) {
      return cb(new Error("File field name is missing"));
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      console.log(
        "❌ Unsupported MIME type:",
        file.mimetype
      );

      return cb(
        new Error(
          `Unsupported file type: ${file.mimetype}`
        )
      );
    }

    cb(null, true);
  },
});

export default upload;