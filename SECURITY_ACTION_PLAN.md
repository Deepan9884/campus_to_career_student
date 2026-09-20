# Security & Feature Improvement Action Plan
## Campus to Career Platform

**Based on Comprehensive Audit Report**  
**Timeline:** 4-week implementation plan

---

## Week 1: Critical Security Fixes (Days 1-7)

### Day 1-2: JWT Security Hardening
**Priority:** 🔴 CRITICAL  
**Effort:** 4 hours  
**Impact:** High

**Tasks:**
1. Add JWT secret strength validation
2. Implement token blacklist with Redis
3. Add token rotation on critical actions

**Implementation:**
```javascript
// backend/src/config/env.js
const JWT_SECRET = getVar("JWT_SECRET", true);

// Validate secret strength
if (JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters");
}

// backend/src/services/tokenBlacklist.service.js
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

async function blacklistToken(token, expirySeconds) {
  await redis.setex(`blacklist:${token}`, expirySeconds, '1');
}

async function isTokenBlacklisted(token) {
  return await redis.exists(`blacklist:${token}`);
}

// backend/src/middleware/auth.middleware.js
const { isTokenBlacklisted } = require('../services/tokenBlacklist.service');

const verifyJWT = async (req, _res, next) => {
  const token = extractBearerToken(req);
  
  if (await isTokenBlacklisted(token)) {
    throw ApiError.unauthorized("Token has been revoked");
  }
  // ... rest of verification
};
```

**Files to modify:**
- `backend/src/config/env.js`
- `backend/src/middleware/auth.middleware.js`
- Create: `backend/src/services/tokenBlacklist.service.js`

---

### Day 3-4: Code Execution Security
**Priority:** 🟠 HIGH  
**Effort:** 6 hours  
**Impact:** High

**Tasks:**
1. Replace exec() with execFile()
2. Add command injection protection
3. Implement stricter sandboxing

**Implementation:**
```javascript
// backend/src/services/compiler.service.js
const { execFile } = require('child_process');

// Before (UNSAFE):
// exec(`javac "${filePath}"`, ...);

// After (SAFE):
execFile('javac', [filePath], {
  cwd: tempDir,
  env: getSafeSubprocessEnv(),
  timeout: COMPILE_TIMEOUT_MS,
  maxBuffer: 1024 * 1024, // 1MB
}, (err, stdout, stderr) => {
  // Handle result
});

// Additional: Validate file paths
function validateFilePath(path) {
  const resolved = require('path').resolve(path);
  if (!resolved.startsWith(TEMP_DIR_BASE)) {
    throw new Error('Invalid file path');
  }
  return resolved;
}
```

**Files to modify:**
- `backend/src/services/compiler.service.js`

---

### Day 5-6: Email Verification Enforcement
**Priority:** 🟠 HIGH  
**Effort:** 6 hours  
**Impact:** Medium

**Tasks:**
1. Create email verification flow
2. Add verification middleware
3. Update registration process

**Implementation:**
```javascript
// backend/src/models/User.model.js - already has field:
// isEmailVerified: { type: Boolean, default: false }

// backend/src/controllers/auth.controller.js
async function sendVerificationEmail(user) {
  const token = jwt.sign(
    { userId: user._id, type: 'email_verification' },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  const verifyLink = `${env.CLIENT_URL}/verify-email?token=${token}`;
  await emailService.sendVerificationEmail(user.email, verifyLink);
}

async function verifyEmail(req, res) {
  const { token } = req.body;
  const decoded = jwt.verify(token, env.JWT_SECRET);
  
  if (decoded.type !== 'email_verification') {
    throw ApiError.badRequest('Invalid token');
  }
  
  await User.findByIdAndUpdate(decoded.userId, {
    isEmailVerified: true
  });
  
  res.json({ success: true, message: 'Email verified successfully' });
}

// backend/src/middleware/emailVerification.middleware.js
const requireEmailVerification = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return next(ApiError.forbidden(
      'Please verify your email before accessing this resource'
    ));
  }
  next();
};

// Apply to protected routes:
// router.post('/exams/submit', verifyJWT, requireEmailVerification, submitExam);
```

**Files to create:**
- `backend/src/middleware/emailVerification.middleware.js`
- `backend/src/services/email.service.js` (add verification template)

**Files to modify:**
- `backend/src/controllers/auth.controller.js`
- `backend/src/routes/*.routes.js` (add middleware)

---

### Day 7: Testing & Documentation
**Priority:** 🟠 HIGH  
**Effort:** 4 hours

**Tasks:**
1. Write unit tests for new security features
2. Update API documentation
3. Update .env.example
4. Create security configuration guide

---

## Week 2: Data Protection & Encryption (Days 8-14)

### Day 8-10: PII Encryption at Rest
**Priority:** 🟠 HIGH  
**Effort:** 12 hours  
**Impact:** High

**Tasks:**
1. Install encryption library
2. Implement field-level encryption
3. Migrate existing data

**Implementation:**
```javascript
// Install
npm install mongoose-field-encryption crypto

// backend/src/models/User.model.js
const encrypt = require('mongoose-field-encryption').fieldEncryption;

// Add encryption plugin BEFORE model export
userSchema.plugin(encrypt, {
  fields: ['email', 'registerNumber', 'linkedinUrl', 'bio'],
  secret: env.ENCRYPTION_KEY, // Add to .env
  saltGenerator: (secret) => {
    return crypto.createHash('sha256').update(secret).digest('hex').substring(0, 16);
  }
});

// backend/.env.example
ENCRYPTION_KEY=your-32-character-encryption-key-here

// Migration script: backend/scripts/encryptExistingData.js
const User = require('../src/models/User.model');

async function encryptExistingData() {
  const users = await User.find({}).select('+email +registerNumber');
  
  for (const user of users) {
    // Re-save to trigger encryption
    user.markModified('email');
    user.markModified('registerNumber');
    await user.save();
  }
  
  console.log(`Encrypted ${users.length} user records`);
}

// Run: node backend/scripts/encryptExistingData.js
```

**Files to modify:**
- `backend/src/models/User.model.js`
- `backend/.env.example`

**Files to create:**
- `backend/scripts/encryptExistingData.js`

---

### Day 11-12: Resume File Encryption
**Priority:** 🟡 MEDIUM  
**Effort:** 8 hours  
**Impact:** Medium

**Implementation:**
```javascript
// backend/src/services/resumeEncryption.service.js
const crypto = require('crypto');
const fs = require('fs').promises;

const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.scryptSync(env.ENCRYPTION_KEY, 'salt', 32);

async function encryptFile(inputPath, outputPath) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  const input = await fs.readFile(inputPath);
  const encrypted = Buffer.concat([
    cipher.update(input),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  // Store: iv + authTag + encrypted
  const result = Buffer.concat([iv, authTag, encrypted]);
  await fs.writeFile(outputPath, result);
}

async function decryptFile(inputPath, outputPath) {
  const data = await fs.readFile(inputPath);
  
  const iv = data.slice(0, 16);
  const authTag = data.slice(16, 32);
  const encrypted = data.slice(32);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  await fs.writeFile(outputPath, decrypted);
}

// Modify resume upload controller
// backend/src/controllers/resume.controller.js
const { encryptFile } = require('../services/resumeEncryption.service');

async function uploadResume(req, res) {
  const tempPath = req.file.path;
  const encryptedPath = `${tempPath}.enc`;
  
  await encryptFile(tempPath, encryptedPath);
  await fs.unlink(tempPath); // Delete unencrypted file
  
  // Store encryptedPath in database
  // ...
}
```

**Files to create:**
- `backend/src/services/resumeEncryption.service.js`

**Files to modify:**
- `backend/src/controllers/resume.controller.js`

---

### Day 13-14: Database Security Hardening
**Priority:** 🟡 MEDIUM  
**Effort:** 8 hours

**Tasks:**
1. Configure connection pooling
2. Add query timeout limits
3. Implement prepared statements where needed

**Implementation:**
```javascript
// backend/src/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      // Connection pooling
      maxPoolSize: 50,
      minPoolSize: 10,
      
      // Timeouts
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      
      // Retry logic
      retryWrites: true,
      retryReads: true,
      
      // Buffer commands
      bufferCommands: false,
      
      // Compression
      compressors: 'zlib',
    });
    
    console.log('[DB] Connected to MongoDB with pooling');
  } catch (error) {
    console.error('[DB] Connection error:', error);
    throw error;
  }
};

// Add query timeout middleware
mongoose.plugin((schema) => {
  schema.pre(/^find/, function() {
    this.maxTimeMS(10000); // 10 second timeout
  });
});
```

**Files to modify:**
- `backend/src/config/db.js`

---

## Week 3: AI Security & Performance (Days 15-21)

### Day 15-17: AI Prompt Injection Defense
**Priority:** 🟠 HIGH  
**Effort:** 12 hours  
**Impact:** Medium

**Implementation:**
```javascript
// backend/src/services/promptSecurity.service.js
const BLOCKED_PHRASES = [
  'ignore previous instructions',
  'ignore all previous',
  'disregard',
  'new instruction',
  'system:',
  'you are now',
  'forget everything',
  'override',
  'admin mode',
  '<script>',
  'javascript:',
];

function sanitizePrompt(input) {
  const lower = input.toLowerCase();
  
  for (const phrase of BLOCKED_PHRASES) {
    if (lower.includes(phrase)) {
      throw new Error('Invalid input detected. Please rephrase your request.');
    }
  }
  
  // Remove excessive newlines/spaces that might hide injection
  const normalized = input
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{3,}/g, ' ')
    .trim();
  
  // Limit length to prevent token exhaustion attacks
  if (normalized.length > 10000) {
    throw new Error('Input too long. Please reduce to under 10,000 characters.');
  }
  
  return normalized;
}

function sanitizeAIResponse(response) {
  // Remove potential script tags
  return response
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
}

// backend/src/services/ai.service.js
const { sanitizePrompt, sanitizeAIResponse } = require('./promptSecurity.service');

async function generateContent({ prompt, ... }) {
  const sanitizedPrompt = sanitizePrompt(prompt);
  
  // ... AI call ...
  
  const sanitizedResponse = sanitizeAIResponse(response);
  return sanitizedResponse;
}
```

**Files to create:**
- `backend/src/services/promptSecurity.service.js`

**Files to modify:**
- `backend/src/services/ai.service.js`

---

### Day 18-19: AI Cost Tracking
**Priority:** 🟡 MEDIUM  
**Effort:** 8 hours  
**Impact:** Medium

**Implementation:**
```javascript
// backend/src/models/AICostLog.model.js
const mongoose = require('mongoose');

const aiCostLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  feature: { type: String, required: true },
  model: { type: String, required: true },
  
  // Token usage
  promptTokens: { type: Number, default: 0 },
  completionTokens: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0 },
  
  // Cost calculation
  costUSD: { type: Number, default: 0 },
  
  // Metadata
  success: { type: Boolean, default: true },
  latencyMs: { type: Number },
  createdAt: { type: Date, default: Date.now, index: true }
});

// TTL: auto-delete after 90 days
aiCostLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('AICostLog', aiCostLogSchema);

// backend/src/services/aiCostTracker.service.js
const COST_PER_1K_TOKENS = {
  'gemini-flash': { input: 0.000075, output: 0.0003 },
  'gemini-pro': { input: 0.00125, output: 0.005 },
  'nemotron': { input: 0, output: 0 }, // Free via NVIDIA
};

function calculateCost(model, promptTokens, completionTokens) {
  const rates = COST_PER_1K_TOKENS[model] || { input: 0, output: 0 };
  
  const inputCost = (promptTokens / 1000) * rates.input;
  const outputCost = (completionTokens / 1000) * rates.output;
  
  return inputCost + outputCost;
}

async function logAICost({ userId, feature, model, promptTokens, completionTokens, latencyMs }) {
  const totalTokens = promptTokens + completionTokens;
  const costUSD = calculateCost(model, promptTokens, completionTokens);
  
  await AICostLog.create({
    userId,
    feature,
    model,
    promptTokens,
    completionTokens,
    totalTokens,
    costUSD,
    latencyMs
  });
}

// Dashboard endpoint
async function getAICostAnalytics(startDate, endDate) {
  return await AICostLog.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { feature: '$feature', model: '$model' },
        totalCost: { $sum: '$costUSD' },
        totalTokens: { $sum: '$totalTokens' },
        requestCount: { $sum: 1 },
        avgLatency: { $avg: '$latencyMs' }
      }
    },
    { $sort: { totalCost: -1 } }
  ]);
}
```

**Files to create:**
- `backend/src/models/AICostLog.model.js`
- `backend/src/services/aiCostTracker.service.js`

**Files to modify:**
- `backend/src/services/ai.service.js`

---

### Day 20-21: Redis Caching Implementation
**Priority:** 🟡 MEDIUM  
**Effort:** 12 hours  
**Impact:** High (10x performance improvement)

**Implementation:**
```javascript
// Install Redis
npm install ioredis

// backend/src/config/redis.js
const Redis = require('ioredis');

let redis = null;

function connectRedis() {
  if (redis) return redis;
  
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: false,
  });
  
  redis.on('connect', () => {
    console.log('[Redis] Connected');
  });
  
  redis.on('error', (err) => {
    console.error('[Redis] Error:', err);
  });
  
  return redis;
}

module.exports = { connectRedis, getRedis: () => redis };

// backend/src/services/cache.service.js
const { getRedis } = require('../config/redis');

async function get(key) {
  const redis = getRedis();
  if (!redis) return null;
  
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('[Cache] Get error:', err);
    return null;
  }
}

async function set(key, value, ttlSeconds = 300) {
  const redis = getRedis();
  if (!redis) return false;
  
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error('[Cache] Set error:', err);
    return false;
  }
}

async function del(key) {
  const redis = getRedis();
  if (!redis) return false;
  
  try {
    await redis.del(key);
    return true;
  } catch (err) {
    console.error('[Cache] Del error:', err);
    return false;
  }
}

// Cache middleware
function cacheMiddleware(ttl = 300) {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();
    
    const key = `cache:${req.originalUrl}:${req.user?._id || 'anon'}`;
    const cached = await get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    // Store original res.json
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      set(key, data, ttl);
      return originalJson(data);
    };
    
    next();
  };
}

module.exports = { get, set, del, cacheMiddleware };

// Use in routes:
// router.get('/dashboard', verifyJWT, cacheMiddleware(60), getDashboard);
```

**Files to create:**
- `backend/src/config/redis.js`
- `backend/src/services/cache.service.js`

**Files to modify:**
- `backend/server.js` (add Redis connection)
- `backend/src/routes/*.routes.js` (add caching)
- `backend/.env.example` (add REDIS_URL)

---

## Week 4: Audit Logging & Monitoring (Days 22-28)

### Day 22-24: Comprehensive Audit Logging
**Priority:** 🟠 HIGH  
**Effort:** 16 hours  
**Impact:** High

**Implementation:**
```javascript
// backend/src/models/AuditLog.model.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  action: { type: String, required: true, index: true },
  resource: { type: String, required: true },
  resourceId: { type: String },
  
  // Request details
  method: { type: String },
  endpoint: { type: String },
  ip: { type: String },
  userAgent: { type: String },
  
  // Change tracking
  before: { type: mongoose.Schema.Types.Mixed },
  after: { type: mongoose.Schema.Types.Mixed },
  
  // Status
  success: { type: Boolean, default: true },
  errorMessage: { type: String },
  
  createdAt: { type: Date, default: Date.now, index: true }
});

// TTL: 1 year retention
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

// backend/src/middleware/auditLog.middleware.js
const AuditLog = require('../models/AuditLog.model');

function auditLog(action, resource) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Log async (don't block response)
      AuditLog.create({
        userId: req.user?._id,
        action,
        resource,
        resourceId: req.params.id || req.body.id,
        method: req.method,
        endpoint: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        success: res.statusCode < 400,
        after: data
      }).catch(err => console.error('[Audit] Log error:', err));
      
      return originalJson(data);
    };
    
    next();
  };
}

// Use in routes:
// router.delete('/exams/:id', verifyJWT, verifyRole(['admin']), 
//   auditLog('delete_exam', 'exam'), deleteExam);
```

**Files to create:**
- `backend/src/models/AuditLog.model.js`
- `backend/src/middleware/auditLog.middleware.js`

**Files to modify:**
- All sensitive routes in `backend/src/routes/*.routes.js`

---

### Day 25-26: Security Monitoring Dashboard
**Priority:** 🟡 MEDIUM  
**Effort:** 12 hours

**Tasks:**
1. Create admin security dashboard
2. Add real-time violation alerts
3. Implement security metrics

---

### Day 27: Performance Testing
**Priority:** 🟡 MEDIUM  
**Effort:** 8 hours

**Tasks:**
1. Load testing with Artillery/k6
2. Database query optimization
3. API response time analysis

---

### Day 28: Documentation & Deployment
**Priority:** 🟠 HIGH  
**Effort:** 8 hours

**Tasks:**
1. Update security documentation
2. Create deployment checklist
3. Update environment variables guide
4. Create incident response plan

---

## Post-Implementation Checklist

### Security
- [ ] JWT secret validation implemented
- [ ] Token blacklist active
- [ ] execFile() replaces all exec() calls
- [ ] Email verification enforced
- [ ] PII encrypted at rest
- [ ] Resume files encrypted
- [ ] Prompt injection defense active
- [ ] Audit logging comprehensive

### Performance
- [ ] Redis caching implemented
- [ ] Database pooling configured
- [ ] Query timeouts set
- [ ] Load testing passed

### Monitoring
- [ ] AI cost tracking active
- [ ] Security dashboard deployed
- [ ] Audit logs searchable
- [ ] Alerts configured

### Documentation
- [ ] Security guide updated
- [ ] API docs current
- [ ] Deployment guide complete
- [ ] Incident response plan ready

---

## Estimated Total Effort

**Week 1:** 20 hours  
**Week 2:** 28 hours  
**Week 3:** 32 hours  
**Week 4:** 44 hours  

**Total:** ~124 hours (15-16 working days)

---

## Success Metrics

### Security Rating Improvement
- Current: B+ (85/100)
- Target: A+ (95/100)

### Performance Improvement
- Response time: -40% (with Redis)
- Concurrent users: 3x increase
- Database queries: -60% (with caching)

### Compliance
- GDPR: 90% → 100%
- FERPA: 85% → 100%
- Security best practices: 85% → 95%

---

## Risk Mitigation

### Deployment Risks
1. **Data migration failures**
   - Mitigation: Test on staging first
   - Rollback plan: Keep unencrypted backups for 30 days

2. **Redis downtime**
   - Mitigation: Graceful degradation (app works without cache)
   - Monitoring: Redis health checks

3. **Performance regression**
   - Mitigation: Load testing before production
   - Rollback: Feature flags for new code

---

## Budget Estimates

### Infrastructure Costs
- **Redis** (Upstash/Redis Cloud): $10-50/month
- **Increased MongoDB Atlas**: $0 (within current tier)
- **Monitoring** (Sentry/DataDog): $0-50/month

**Total:** ~$20-100/month additional

### Development Costs
- 124 hours × $50-150/hour = **$6,200-$18,600**

---

## Maintenance Plan

### Daily
- Monitor Redis health
- Check AI cost usage
- Review critical audit logs

### Weekly
- Review security audit logs
- Analyze performance metrics
- Check for failed encryption jobs

### Monthly
- Security vulnerability scan
- Update dependencies
- Review access controls

### Quarterly
- Full security audit
- Penetration testing
- Compliance review

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Next Review:** After Week 2 completion

