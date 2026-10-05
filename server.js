const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'tahkim_verify_2026';
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const GRAPH_VERSION = 'v20.0';

// 1. Verification pour Meta (Webhook GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK VERIFIED!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 2. Reception des messages (Webhook POST)
app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (messages && messages[0]) {
      const message = messages[0];
      const from = message.from; // numero de l'utilisateur
      const text = message.text?.body || '';
      const name = value.contacts?.[0]?.profile?.name || 'Cher utilisateur';

      console.log(`Message de ${from} (${name}): ${text}`);

      // Logique du Bot Tahkim
      let reply = '';

      if (text.toLowerCase().includes('salam') || text.toLowerCase().includes('bonjour') || text.toLowerCase().includes('marhba')) {
        reply = `وعليكم السلام ${name} 👋\n\nمرحبا بك في *بوت التحكيم التونسي* ⚖️\n\nأنا مساعدك القانوني للتحكيم. كيف يمكنني مساعدتك؟\n\n1️⃣ - ما هو التحكيم؟\n2️⃣ - كيف أبدأ قضية تحكيم؟\n3️⃣ - نموذج اتفاق تحكيم\n4️⃣ - التحدث مع محكم\n\nأرسل رقم الاختيار.`;
      } else if (text.trim() === '1') {
        reply = `*ما هو التحكيم؟*\n\nالتحكيم هو وسيلة بديلة لحل النزاعات خارج المحاكم، سريعة وسرية وملزمة، وفق مجلة التحكيم التونسية.\n\nميزاته:\n✅ سرعة الإجراءات\n✅ سرية تامة\n✅ اختيار المحكم\n✅ قرار نهائي وملزم`;
      } else if (text.trim() === '2') {
        reply = `*كيف أبدأ قضية تحكيم؟* 📝\n\n1. وجود اتفاق تحكيم (شرط في العقد)\n2. تقديم مطلب تحكيم إلى مركز التحكيم\n3. دفع الرسوم الأولية\n4. تعيين هيئة التحكيم\n\nهل تريد نموذج مطلب التحكيم؟ أرسل 3`;
      } else if (text.trim() === '3') {
        reply = `*نموذج اتفاق التحكيم* 📄\n\n"كل نزاع ينشأ عن تنفيذ أو تأويل هذا العقد يحال إلى التحكيم طبقا لمجلة التحكيم التونسية، ويتكون فريق التحكيم من محكم واحد/ثلاثة محكمين، ومقره تونس..."\n\nهل تريد أن أرسل لك النموذج الكامل PDF؟ أرسل كلمة PDF`;
      } else if (text.trim() === '4' || text.toLowerCase().includes('mohkem')) {
        reply = `سيتم توصيلك بأحد محكمينا قريبا 👨‍⚖️\n\nالرجاء ترك اسمك ورقم هاتفك وموضوع النزاع، وسيتصل بك فريقنا في أقل من 24 ساعة.\n\nأو اتصل مباشرة: +216 XX XXX XXX`;
      } else if (text.toLowerCase().includes('pdf')) {
        reply = `سأرسل لك النموذج قريبا. حاليا يمكنك تحميله من موقعنا:\nhttps://tahkim.tn/modele\n\nأو أرسل لي بريدك الإلكتروني.`;
      } else {
        reply = `شكرا لرسالتك: "${text}"\n\nأنا بوت التحكيم، أفهم أسئلة مثل:\n- ما هي تكلفة التحكيم؟\n- كم تدوم قضية التحكيم؟\n- هل قرار التحكيم قابل للطعن؟\n\nأرسل سؤالك أو أرسل *menu* للعودة للقائمة.`;
        if (text.toLowerCase() === 'menu') {
          reply = `*القائمة الرئيسية* ⚖️\n1️⃣ - ما هو التحكيم؟\n2️⃣ - كيف أبدأ قضية تحكيم؟\n3️⃣ - نموذج اتفاق تحكيم\n4️⃣ - التحدث مع محكم`;
        }
      }

      await sendWhatsAppMessage(from, reply);
    }

    res.sendStatus(200);
  } catch (e) {
    console.error('Webhook error', e.response?.data || e.message);
    res.sendStatus(200);
  }
});

async function sendWhatsAppMessage(to, body) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;
  await axios.post(url, {
    messaging_product: 'whatsapp',
    to: to,
    type: 'text',
    text: { body: body }
  }, {
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  console.log(`Reply sent to ${to}`);
}

app.get('/', (req, res) => {
  res.send('Tahkim Bot is running - Webhook ready at /webhook');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
