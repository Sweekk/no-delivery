const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const jwt = require('jsonwebtoken');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

console.log('--- Testing Auth Middleware & JWT Verification ---');

// 1. JWT signing and verification check
const testUser = { id: '12345', username: 'testuser', role: 'admin' };
const secret = process.env.JWT_SECRET;
assert(secret, 'JWT_SECRET must be present in environment');

const token = jwt.sign(
  { sub: testUser.id, username: testUser.username, role: testUser.role },
  secret,
  { expiresIn: '7d' }
);
assert(token, 'Token should be signed successfully');

const decoded = jwt.verify(token, secret);
assert.strictEqual(decoded.sub, testUser.id);
assert.strictEqual(decoded.username, testUser.username);
assert.strictEqual(decoded.role, testUser.role);
console.log('✓ JWT sign and verify passed.');

// 2. Middleware test: requireAuth with missing token
let req = { headers: {} };
let res = {
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
};
let nextCalled = false;

requireAuth(req, res, () => { nextCalled = true; });
assert.strictEqual(res.statusCode, 401, 'Should return 401 when no token is provided');
assert.strictEqual(nextCalled, false);
console.log('✓ requireAuth missing token returns 401 passed.');

// 3. Middleware test: requireAuth with valid token
req = { headers: { authorization: `Bearer ${token}` } };
res = { status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
nextCalled = false;

requireAuth(req, res, () => { nextCalled = true; });
assert.strictEqual(nextCalled, true, 'Next should be called on valid token');
assert.strictEqual(req.user.sub, testUser.id);
console.log('✓ requireAuth valid token passed.');

// 4. Middleware test: requireRole matching role vs mismatched role
nextCalled = false;
requireRole('admin')(req, res, () => { nextCalled = true; });
assert.strictEqual(nextCalled, true, 'Admin role check should pass for admin user');

req.user.role = 'customer';
nextCalled = false;
res = { status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
requireRole('admin')(req, res, () => { nextCalled = true; });
assert.strictEqual(res.statusCode, 403, 'Admin role check should return 403 for customer user');
assert.strictEqual(nextCalled, false);
console.log('✓ requireRole access control passed.');

console.log('All auth unit tests passed successfully!');
