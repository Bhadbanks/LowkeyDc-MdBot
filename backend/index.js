const express = require('express');
const { Boom } = require('@hapi/boom');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/generate-session', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID required' });

  const { state, saveCreds } = await useMultiFileAuthState(`./auth_info/${id}`);
  const sock = makeWASocket({ auth: state });

  sock.ev.on('connection.update', async ({ connection, qr }) => {
    if (qr) {
      const qrImg = await qrcode.toDataURL(qr);
      res.json({ status: 'scan', qr: qrImg });
    }
    if (connection === 'open') {
      const sessionId = Buffer.from(id).toString('base64');
      await sock.sendMessage(sock.user.id, {
        text: `✅ Your bot is connected!

🔐 *Session ID:* \`${sessionId}\`

📞 Contact Dev: wa.me/2348082591190`
      });
      await sock.logout();
    }
  });

  sock.ev.on('creds.update', saveCreds);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
