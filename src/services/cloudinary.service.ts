import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import streamifier from "streamifier";

interface CloudinaryUploadErrorOptions {
  statusCode: number;
  details?: string;
}

export class CloudinaryUploadError extends Error {
  public readonly statusCode: number;
  public readonly details?: string;

  constructor(message: string, options: CloudinaryUploadErrorOptions) {
    super(message);
    this.name = "CloudinaryUploadError";
    this.statusCode = options.statusCode;
    this.details = options.details;
  }
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  format?: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  publicId?: string;
}

const DEFAULT_FOLDER = "united-financial/comparison-results";

let isConfigured = false;

const configureCloudinary = (): void => {
  if (isConfigured) {
    return;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new CloudinaryUploadError("Cloudinary credentials are not configured", {
      statusCode: 500,
      details: "Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET"
    });
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });

  isConfigured = true;
};

export const uploadImageBufferToCloudinary = async (
  buffer: Buffer,
  options?: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult> => {
  configureCloudinary();

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options?.folder ?? DEFAULT_FOLDER,
        resource_type: "image",
        public_id: options?.publicId
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(
            new CloudinaryUploadError("Cloudinary upload failed", {
              statusCode: 502,
              details: error.message
            })
          );
          return;
        }

        if (!result?.secure_url) {
          reject(
            new CloudinaryUploadError("Cloudinary upload returned no secure_url", {
              statusCode: 502
            })
          );
          return;
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};
