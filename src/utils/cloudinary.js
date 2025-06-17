import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.error("No local file path provided for Cloudinary upload");
      return null;
    }

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // File uploaded successfully
    // console.log("File uploaded successfully:", response.url);
    fs.unlinkSync(localFilePath); // Remove the local file
    return response; // Return the full response object
  } catch (error) {
    console.error("Cloudinary upload error:", error.message);
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // Remove the local file on error
    }
    return null;
  }
};

export { uploadOnCloudinary };