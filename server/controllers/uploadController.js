const path = require('path');

const uploadImage = (req, res) => {
    console.log('Upload Controller: Request received');
    if (!req.file) {
        console.log('Upload Controller: No file in request');
        return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('Upload Controller: File received:', req.file.filename);

    // Return the relative path to be stored in the DB
    // We'll serve this from /uploads static path
    const filePath = `/uploads/${req.file.filename}`;
    res.json({
        message: 'File uploaded successfully',
        url: filePath
    });
};

module.exports = {
    uploadImage
};
