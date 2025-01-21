const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const Imap = require('imap');
const inspect = require('util').inspect;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// تسجيل الدخول
app.post('/login', async (req, res) => {
  const { email, password, imapHost, smtpHost, imapPort, smtpPort } = req.body;

  if (!email || !password || !imapHost || !smtpHost) {
    return res.status(400).json({ message: 'يرجى إدخال جميع الحقول المطلوبة.' });
  }

  // التحقق من IMAP
  const imap = new Imap({
    user: email,
    password: password,
    host: imapHost,
    port: imapPort || 993,
    tls: true,
  });

  imap.once('ready', () => {
    console.log('تم تسجيل الدخول إلى IMAP بنجاح.');
    imap.end();
    res.status(200).json({ message: 'تم تسجيل الدخول بنجاح!' });
  });

  imap.once('error', (err) => {
    console.error('خطأ أثناء تسجيل الدخول إلى IMAP:', err.message);
    res.status(401).json({ message: 'فشل تسجيل الدخول! تحقق من البريد الإلكتروني أو كلمة المرور.' });
  });

  imap.connect();
});

// إرسال بريد إلكتروني
app.post('/send-email', async (req, res) => {
  const { email, password, smtpHost, smtpPort, to, subject, text } = req.body;

  if (!email || !password || !smtpHost || !to || !subject || !text) {
    return res.status(400).json({ message: 'يرجى إدخال جميع الحقول المطلوبة.' });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort || 465,
    secure: true, // استخدام TLS
    auth: {
      user: email,
      pass: password,
    },
  });

  try {
    await transporter.sendMail({
      from: email,
      to,
      subject,
      text,
    });
    res.status(200).json({ message: 'تم إرسال البريد الإلكتروني بنجاح!' });
  } catch (error) {
    console.error('خطأ أثناء إرسال البريد الإلكتروني:', error.message);
    res.status(500).json({ message: 'فشل في إرسال البريد الإلكتروني.' });
  }
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`الخادم يعمل على http://localhost:${PORT}`);
});
