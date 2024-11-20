import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
const uploadFileonCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const normalizedPath = path.normalize(localFilePath).replace(/\\/g, "/");
    console.log("Attempting to upload file:", normalizedPath);

    const response = await cloudinary.uploader.upload(normalizedPath, {
      resource_type: "auto",
    });
    console.log("Cloudinary upload response:", response);

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export { uploadFileonCloudinary };
