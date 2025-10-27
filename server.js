require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const Track = require('./models/Track');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Serve static frontend files from /public folder
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// ✅ Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ✅ MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/musicdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Serve uploaded files
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));


// ✅ Routes
app.get('/tracks', async (req, res) => {
  const tracks = await Track.find().sort({ createdAt: -1 });
  res.json(tracks);
});

app.post('/upload', upload.single('track'), async (req, res) => {
  const track = new Track({
    title: req.body.title,
    filename: req.file.filename,
    path: req.file.path,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
  await track.save();
  res.json(track);
});

app.delete('/tracks/:id', async (req, res) => {
  const track = await Track.findById(req.params.id);
  if (!track) return res.status(404).end();

  const filePath = path.join(UPLOAD_DIR, track.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await track.deleteOne();
  res.json({ ok: true });
});

// ✅ Handle all other routes by serving frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
