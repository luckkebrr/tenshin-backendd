import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const PORT = process.env.PORT || 3000;
const GUILDS_SETTINGS = {}; // Simples persistência na memória

app.get('/api/auth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  const data = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI
  });

  const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: data
  });
  const tokenJson = await tokenRes.json();
  const access_token = tokenJson.access_token;

  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  const user = await userRes.json();

  res.json({ access_token, ...user });
});

app.get('/api/user/guilds', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const guildRes = await fetch('https://discord.com/api/users/@me/guilds', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const guilds = await guildRes.json();
  res.json(guilds);
});

app.get('/api/guilds/:guildId/settings', (req, res) => {
  const cfg = GUILDS_SETTINGS[req.params.guildId] || {};
  res.json(cfg);
});

app.post('/api/guilds/:guildId/settings', (req, res) => {
  GUILDS_SETTINGS[req.params.guildId] = req.body;
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});
