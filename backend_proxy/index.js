const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SURF_CHAMP_API = 'http://localhost:8080/api';

// file upload
const storage = multer.diskStorage({
  destination: function(req, file, cb){ cb(null, path.join(__dirname,'uploads')) },
  filename: function(req, file, cb){ cb(null, Date.now() + '_' + file.originalname) }
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res)=>{
  // require Authorization header
  if(!req.headers['authorization']) return res.status(401).json({ error: 'Authorization header required' });
  if(!req.file) return res.status(400).json({ error: 'no file' });
  res.json({ filename: req.file.filename, path: '/uploads/' + req.file.filename });
});

// forward auth requests to backend
app.post('/proxy/auth/register', async (req,res)=>{
  try{
    const r = await axios.post(`${SURF_CHAMP_API}/auth/register`, req.body);
    res.json(r.data);
  }catch(e){ res.status(500).json({ error: 'backend error', details: e.toString() }) }
});

app.post('/proxy/auth/login', async (req,res)=>{
  try{
    const r = await axios.post(`${SURF_CHAMP_API}/auth/login`, req.body);
    res.json(r.data);
  }catch(e){ res.status(500).json({ error: 'backend error', details: e.toString() }) }
});

// proxy endpoints to Surf Champ backend - require passing Authorization header from client
app.post('/proxy/surfers/:name/maneuvers', async (req,res)=>{
  try{
    const headers = { Authorization: req.headers['authorization'] };
    const r = await axios.post(`${SURF_CHAMP_API}/surfers/${req.params.name}/maneuvers`, req.body, { headers });
    res.json(r.data);
  }catch(e){ res.status(500).json({ error: 'backend error', details: e.toString() }) }
});

app.get('/proxy/surfers/:name/final-score', async (req,res)=>{
  try{
    const headers = { Authorization: req.headers['authorization'] };
    const r = await axios.get(`${SURF_CHAMP_API}/surfers/${req.params.name}/final-score`, { headers });
    res.json(r.data);
  }catch(e){ res.status(500).json({ error: 'backend error', details: e.toString() }) }
});

app.get('/uploads/:file', (req,res)=>{
  const p = path.join(__dirname, 'uploads', req.params.file);
  if(fs.existsSync(p)) res.sendFile(p);
  else res.status(404).end();
});



// list uploads
app.get('/uploads-list', (req,res)=>{
  const dir = path.join(__dirname, 'uploads');
  fs.readdir(dir, (err, files) => {
    if(err) return res.status(500).json({ error: 'cannot list uploads' });
    res.json(files.map(f => ({ filename: f, url: `/uploads/${f}`})));
  });
});

// trigger processing - forwards to backend process endpoint (requires Authorization)
app.post('/proxy/process', async (req,res)=>{
  const { filename, surfer } = req.body || {};
  if(!filename || !surfer) return res.status(400).json({ error: 'filename and surfer required' });
  const headers = { Authorization: req.headers['authorization'] };
  try {
    const r = await axios.post(`${SURF_CHAMP_API}/process/start`, { filename, surfer }, { headers });
    res.status(r.status).json(r.data);
  } catch(e) {
    res.status(500).json({ error: 'processing failed', details: e.toString() });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, ()=>console.log('Proxy server running on', PORT));

// Forwarding endpoints for process results
app.get('/proxy/process/results/:surfer', async (req,res)=>{
  try{
    const headers = { Authorization: req.headers['authorization'] };
    const r = await axios.get(`${SURF_CHAMP_API}/process/results/${req.params.surfer}`, { headers });
    res.json(r.data);
  }catch(e){ res.status(500).json({ error: 'backend error', details: e.toString() }) }
});

app.get('/proxy/process/result/:id', async (req,res)=>{
  try{
    const headers = { Authorization: req.headers['authorization'] };
    const r = await axios.get(`${SURF_CHAMP_API}/process/result/${req.params.id}`, { headers });
    res.json(r.data);
  }catch(e){ res.status(500).json({ error: 'backend error', details: e.toString() }) }
});

app.post('/proxy/process/update', async (req,res)=>{
  try{
    const headers = { Authorization: req.headers['authorization'] };
    const r = await axios.post(`${SURF_CHAMP_API}/process/update`, req.body, { headers });
    res.json(r.data);
  }catch(e){ res.status(500).json({ error: 'backend error', details: e.toString() }) }
});
