import { v2 as cloudinary } from "cloudinary";

async function uploadToCloud(filepath) {
  try {
    cloudinary.config({
      cloud_name: String(process.env.CLOUD_NAME),
      api_key: String(process.env.CLOUD_API_KEY),
      api_secret: String(process.env.CLOUD_API_SECRET),
    });
    console.log(process.env.CLOUD_API_KEY);
    const uploadFile = await cloudinary.uploader.upload(filepath);
    const url = await cloudinary.url(uploadFile.public_id, {
      fetch_format: "auto",
      quality: "auto",
    });
    return url; // uploaded file url <optemized>
  } catch (error) {
    console.log("Uploading to cloud error!");
    throw error;
  }
}

export default uploadToCloud;
