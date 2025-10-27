import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/etudiants/');
  },
  filename: function (req, file, cb) {
    // Get file extension
    const ext = file.originalname.split('.').pop();
    
    // For updates (PUT), use existing student ID
    if (req.params.id) {
      cb(null, `${req.params.id}-photo.${ext}`);
      return;
    }
    
    // For creation (POST), use temporary name with timestamp
    const timestamp = Date.now();
    cb(null, `temp-${timestamp}-photo.${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter });

export default upload;