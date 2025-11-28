const express = require('express');
const tmi = require('tmi.js');
const axios = require('axios');

const app = express();
app.use(express.json());

// Leggiamo i dati sensibili da variabili d'ambiente (li metterai su Render)
const BOT_USERNAME = process.env.BOT_USERNAME;
const BOT_OAUTH = process.env.BOT_OAUTH;
const CHANNEL_NAME = process.env.CHANNEL_NAME; // senza #
const TARGET_LANG = process.env.TARGET_LANG || 'en'; // lingua del canale

// Controllo minimo
if (!BOT_USERNAME || !BOT_OAUTH || !CHANNEL_NAME) {
  console.warn('ATTENZIONE: BOT_USERNAME, BOT_OAUTH o CHANNEL_NAME non sono settati!');
}

let translatedMessages = [];

// Client Twitch (tmi.js)
const client = new tmi.Client({
  identity: {
    username: BOT_USERNAME,
    password: BOT_OAUTH
  },
  channels: [ CHANNEL_NAME ]
});

// Connetti alla chat Twitch
client.connect().then(() => {
  console.log('✅ Connesso alla chat di Twitch come', BOT_USERNAME);
}).catch(err => {
  console.error('Errore di connessione a Twitch:', err);
});

// Quando arriva un messaggio in chat
client.on('message', async (channel, tags, message, self) => {
  if (self) return;

  // QUI metteremo la traduzione vera (EN -> IT ecc.)
  const translatedText = message; // per ora solo eco

  translatedMessages.push({
    user: tags['display-name'] || tags.username,
    text: translatedText,
    ts: Date.now()
  });

  // tieni solo gli ultimi 100
  if (translatedMessages.length > 100) {
    translatedMessages = translatedMessages.slice(-100);
  }
});

// Endpoint per l'estensione: leggere i messaggi tradotti
app.get('/messages', (req, res) => {
  res.json(translatedMessages);
});

// Endpoint per mandare messaggi in chat (IT -> lingua canale)
app.post('/send', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ ok: false, error: 'missing_text' });
  }

  // QUI metteremo la traduzione vera (IT -> TARGET_LANG)
  const translatedText = text; // per ora lo stesso testo

  try {
    await client.say('#' + CHANNEL_NAME, translatedText);
    res.json({ ok: true });
  } catch (err) {
    console.error('Errore nell\'invio del messaggio:', err);
    res.status(500).json({ ok: false, error: 'send_failed' });
  }
});

// Render passa la porta in process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🌐 Backend in ascolto sulla porta', PORT);
});
