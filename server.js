const express = require('express');
const pool = require('./src/db');
const cors = require('cors');
const wordsRouter = require('./src/routes/words');
const authRouter = require('./src/routes/auth');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const app = express();
const PORT = 5000;

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    store: new pgSession({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);
app.get('/', (req, res) => {
  res.send('English Dictionary API is running!');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is working!',
  });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');

    res.json({
      message: 'Database connected!',
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error('Database connection error:', error);

    res.status(500).json({
      message: 'Database connection failed',
    });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/words', wordsRouter);

app.listen(PORT, () => {
  console.log(`English Dictionary API listening at http://localhost:${PORT}`);
});
