import multer from "multer";

const storageCustom = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./src/assets");
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + "_" + file.originalname;
    req.filepath = "./src/assets/" + filename;
    console.log(req.filepath);
    cb(null, filename);
  },
});

export const upload = multer({ storage: storageCustom });
