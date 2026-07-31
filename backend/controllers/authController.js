const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabaseClient');

const SALT_ROUNDS = 10;
const VALID_ROLES = ['customer', 'delivery', 'picker', 'admin'];
const DEFAULT_JWT_SECRET = process.env.JWT_SECRET || 'quickfix_grocery_secret_jwt_key_2026';

// In-memory user fallback if Supabase table is unavailable or offline
const memoryUsers = [];

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    DEFAULT_JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function signup(req, res) {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'username, password, and role are required.' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    let newUser = null;

    try {
      const { data: existing, error: lookupError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (!lookupError && existing) {
        return res.status(409).json({ error: 'That username is already taken.' });
      }

      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert({ username, password_hash: passwordHash, role })
        .select('id, username, role')
        .single();

      if (!insertError && inserted) {
        newUser = inserted;
      }
    } catch (dbErr) {
      console.warn('[AUTH] Supabase users table query warning, utilizing memory store:', dbErr.message);
    }

    // In-memory fallback if DB insert didn't run or table doesn't exist
    if (!newUser) {
      const existingMem = memoryUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (existingMem) {
        return res.status(409).json({ error: 'That username is already taken.' });
      }

      newUser = {
        id: 'user-' + Math.floor(100000 + Math.random() * 900000),
        username,
        role,
        password_hash: passwordHash
      };
      memoryUsers.push(newUser);
    }

    const token = signToken(newUser);
    return res.status(201).json({
      token,
      user: { id: newUser.id, username: newUser.username, role: newUser.role }
    });

  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Something went wrong creating the account: ' + err.message });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required.' });
    }

    let user = null;

    try {
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('id, username, role, password_hash')
        .eq('username', username)
        .maybeSingle();

      if (!error && dbUser) {
        user = dbUser;
      }
    } catch (dbErr) {
      console.warn('[AUTH] Supabase user query warning:', dbErr.message);
    }

    // Memory fallback lookup
    if (!user) {
      user = memoryUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    }

    if (!user) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    const token = signToken(user);
    return res.status(200).json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Something went wrong logging in: ' + err.message });
  }
}

module.exports = { signup, login };
