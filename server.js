const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // استخدام منفذ البيئة للنشر

// إعداد قاعدة البيانات
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('خطأ أثناء إنشاء قاعدة البيانات:', err.message);
    process.exit(1);
  }
  console.log('تم الاتصال بقاعدة البيانات بنجاح.');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `, (err) => {
    if (err) console.error('خطأ أثناء إنشاء جدول المستخدمين:', err.message);
  });
});

// إعدادات الخادم
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// إنشاء حساب
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [email, hashedPassword], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ message: 'البريد الإلكتروني مسجل بالفعل.' });
        }
        return res.status(500).json({ message: 'خطأ أثناء إنشاء الحساب.' });
      }
      res.status(201).json({ message: 'تم إنشاء الحساب بنجاح!' });
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء إنشاء الحساب.' });
  }
});

// تسجيل الدخول
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (isValid) {
      res.status(200).json({ message: 'تم تسجيل الدخول بنجاح!' });
    } else {
      res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
    }
  });
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`الخادم يعمل على http://localhost:${PORT}`);
});
