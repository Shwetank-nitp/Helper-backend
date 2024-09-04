import multer from "multer";
import path from "path";

const __dirname = path.dirname("");

// Convert the relative path to an absolute path
const relativePath = "src/assets";
const absolutePath = path.resolve(__dirname, relativePath);

const storageCustom = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, absolutePath); // Save files to the absolute path
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + "_" + file.originalname.replace(/\s+/g, "");
    req.filepath = path.join(absolutePath, filename); // Use path.join for correct file path
    console.log(req.filepath); // Log the filepath for debugging
    cb(null, filename);
  },
});

export const upload = multer({ storage: storageCustom });
