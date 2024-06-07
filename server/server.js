const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const port = 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));

// Password (hashed for security)
const PASSWORD_HASH = bcrypt.hashSync('amy', 10);

// CORS middleware to dynamically allow specific origin
const allowedOrigins = [
  'http://localhost:8080',  // Local development
  /\.ngrok-free\.app$/,  // Client ngrok URL with wildcard subdomains
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.some(allowedOrigin => {
    if (typeof allowedOrigin === 'string') {
      return allowedOrigin === origin;
    }
    return allowedOrigin.test(origin);
  })) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,X-CSRF-Token');
  next();
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const { password } = req.body;
  if (bcrypt.compareSync(password, PASSWORD_HASH)) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

app.post('/videos', authenticate, (req, res) => {
  const videoDir = path.join(__dirname, 'videos');
  fs.readdir(videoDir, (err, files) => {
    if (err) {
      return res.status(500).json({ message: 'Unable to read video directory' });
    }
    const videoFiles = files.filter(file => file.endsWith('.mp4'));
    res.json(videoFiles);
  });
});

// Stream video
app.get('/video/:filename', (req, res) => {
  const videoPath = path.join(__dirname, 'videos', req.params.filename);
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  res.setHeader('Access-Control-Allow-Origin', "*");
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'origin,authorization,accept,X-Requested-With,Content-Type,X-CSRF-Token');

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
