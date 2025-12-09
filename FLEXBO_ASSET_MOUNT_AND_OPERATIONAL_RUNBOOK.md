# Flexbo Asset Mount & Operational Runbook
**Dokku Version:** 0.35.20  
**App Name:** flexbo  
**Domain:** flexbo.athenalabo.com  
**Server IP:** 209.145.61.113  
**Date Created:** December 9, 2025

---

## Part 1: Asset Mount Configuration (Safe Commands)

### Step 1: Verify Current Mount Status (Non-Invasive)

SSH into Dokku server and check what's currently mounted:

```bash
# Step 1a: List all storage mounts for flexbo app
ssh root@209.145.61.113
dokku storage:list flexbo

# Expected output (if configured):
# /var/lib/dokku/data/storage/flexbo-assets:/media

# Step 1b: Check if storage directory exists
ls -la /var/lib/dokku/data/storage/ | grep flexbo

# Step 1c: Check what's inside storage directory
ls -la /var/lib/dokku/data/storage/flexbo-assets/ 2>/dev/null || echo "Directory may not exist yet"

# Step 1d: Check mounts inside running container
dokku enter flexbo
mount | grep /media
df -h /media
exit
```

---

### Step 2: Create Storage Directory (If Not Exists)

**Only run if directory doesn't exist:**

```bash
ssh root@209.145.61.113

# Create storage directory with proper permissions
mkdir -p /var/lib/dokku/data/storage/flexbo-assets/

# Set ownership to dokku:dokku (standard Dokku practice)
chown dokku:dokku /var/lib/dokku/data/storage/flexbo-assets/

# Set permissions (755 = rwxr-xr-x)
chmod 755 /var/lib/dokku/data/storage/flexbo-assets/

# Verify
ls -la /var/lib/dokku/data/storage/ | grep flexbo-assets
```

---

### Step 3: Mount Storage to Flexbo App

**Choose ONE approach based on your current setup:**

#### Option A: Storage Directory DOESN'T Exist Yet (Safe First Mount)

```bash
ssh root@209.145.61.113

# This command creates the mount WITHOUT restarting the app
dokku storage:mount flexbo /var/lib/dokku/data/storage/flexbo-assets:/media

# Rebuild Nginx proxy configuration (doesn't restart app container)
dokku proxy:build-config flexbo

# Verify mount was added
dokku storage:list flexbo
# Should show: /var/lib/dokku/data/storage/flexbo-assets:/media

# Test mount is writable (inside container)
dokku enter flexbo
touch /media/test-write.txt
ls -la /media/test-write.txt
rm /media/test-write.txt
exit

# Verify on host
ls -la /var/lib/dokku/data/storage/flexbo-assets/
```

#### Option B: Storage Already Mounted (Verify Only)

```bash
ssh root@209.145.61.113

# Check current configuration
dokku storage:list flexbo

# If output shows /var/lib/dokku/data/storage/flexbo-assets:/media then it's already mounted
# Proceed to Part 2 (Operational Runbook)
```

---

### Step 4: Backup Current State (Before Using Mount)

**Critical: Always backup before allowing apps to write to storage:**

```bash
ssh root@209.145.61.113

# Create timestamped backup
DATE=$(date +%Y%m%d_%H%M%S)

# Backup entire app container state
dokku enter flexbo tar -czf - . 2>/dev/null | \
  gzip > /home/dokku/flexbo-app-state-${DATE}.tar.gz

# Backup environment configuration
dokku config flexbo > /home/dokku/flexbo-config-${DATE}.env

# Backup current storage (if any files exist)
tar -czf /home/dokku/flexbo-assets-backup-${DATE}.tar.gz \
  /var/lib/dokku/data/storage/flexbo-assets/ 2>/dev/null || true

# List backups created
ls -lah /home/dokku/flexbo-*-${DATE}.*

echo "✓ Backups created successfully"
```

---

### Step 5: Verify App Still Works (Health Check)

**After mounting, verify nothing broke:**

```bash
# Test from local machine (or SSH to server and curl locally)

# 1. Check website loads
curl -I https://flexbo.athenalabo.com/
# Expected: HTTP/2 200

# 2. Check FastAPI health endpoint
curl https://flexbo.athenalabo.com/api/health
# Expected: {"status": "ok"} or similar

# 3. Check Express is proxying correctly
curl -X POST https://flexbo.athenalabo.com/api/forward \
  -H "Content-Type: application/json" \
  -d '{"name":"HealthTest","email":"test@test.com","message":"Testing"}'
# Expected: Either success or error response (not 502/503)

# 4. Check logs for errors
ssh root@209.145.61.113 "dokku logs flexbo -n 20"
# Look for "ERROR", "CRITICAL", or "502" messages
```

---

## Part 2: Operational Runbook & Monitoring

### 2.1 Daily Monitoring Checklist

**Run weekly or set up automated checks:**

```bash
#!/bin/bash
# Save as: /home/dokku/flexbo-health-check.sh

APP_NAME="flexbo"
DOMAIN="flexbo.athenalabo.com"
DOKKU_SERVER="209.145.61.113"
ALERT_EMAIL="your-email@example.com"

echo "=== Flexbo Health Check - $(date) ==="

# Check 1: Website responds
if curl -s -I https://${DOMAIN}/ | grep -q "200\|301\|302"; then
  echo "✓ Website responding (HTTP 200)"
else
  echo "✗ Website NOT responding - ALERT"
fi

# Check 2: API health endpoint
if curl -s https://${DOMAIN}/api/health | grep -q "ok"; then
  echo "✓ API health check passed"
else
  echo "✗ API health check failed - ALERT"
fi

# Check 3: Storage mount exists
if ssh root@${DOKKU_SERVER} "dokku storage:list ${APP_NAME}" | grep -q "/media"; then
  echo "✓ Storage mount configured"
else
  echo "✗ Storage mount missing - ALERT"
fi

# Check 4: Storage is writable
if ssh root@${DOKKU_SERVER} "dokku enter ${APP_NAME} test -w /media"; then
  echo "✓ Storage is writable"
else
  echo "✗ Storage is NOT writable - ALERT"
fi

# Check 5: Disk space
DISK_USAGE=$(ssh root@${DOKKU_SERVER} "df /var/lib/dokku/data/storage/ | tail -1 | awk '{print \$5}' | sed 's/%//'")
echo "✓ Disk usage: ${DISK_USAGE}%"

if [ ${DISK_USAGE} -gt 80 ]; then
  echo "✗ Disk usage critical (>80%) - ALERT"
fi

# Check 6: Recent app restarts
RECENT_RESTARTS=$(ssh root@${DOKKU_SERVER} "dokku logs ${APP_NAME} -n 100 | grep -c 'process exited'")
if [ ${RECENT_RESTARTS} -gt 5 ]; then
  echo "✗ ${RECENT_RESTARTS} process exits detected in recent logs - ALERT"
else
  echo "✓ App stability normal (${RECENT_RESTARTS} recent exits)"
fi

echo "=== End Health Check ==="
```

**Install as cron job:**

```bash
ssh root@209.145.61.113

# Create health check script
cat > /home/dokku/flexbo-health-check.sh << 'EOF'
#!/bin/bash
# [Script content from above]
EOF

chmod +x /home/dokku/flexbo-health-check.sh

# Run daily at 2 AM
echo "0 2 * * * /home/dokku/flexbo-health-check.sh >> /home/dokku/flexbo-health-check.log 2>&1" | \
  crontab -

# View cron jobs
crontab -l | grep flexbo
```

---

### 2.2 Log Management

**Flexbo generates logs from Express + FastAPI:**

```bash
ssh root@209.145.61.113

# View real-time logs (last 50 lines)
dokku logs flexbo -n 50

# View logs with timestamps
dokku logs flexbo -n 100 --tail

# Search logs for errors
dokku logs flexbo -n 500 | grep -i "error\|exception\|502"

# Persistent log location (if configured)
ls -lah /var/log/dokku/flexbo.log* 2>/dev/null || echo "Logs not persisted to disk"
```

**Enable persistent logging (optional, prevents log loss):**

```bash
ssh root@209.145.61.113

# Check current log driver
dokku config flexbo | grep LOG

# Set to syslog (recommended for stability)
dokku config:set flexbo DOKKU_LOGS_DRIVER=syslog

# Or keep in-memory but increase buffer
dokku config:set flexbo DOKKU_LOGS_VECTOR_BUFFER_SIZE=10000

# Rebuild to apply
dokku rebuild flexbo
```

---

### 2.3 Storage Monitoring

**Track /media directory usage:**

```bash
ssh root@209.145.61.113

# Check current size
du -sh /var/lib/dokku/data/storage/flexbo-assets/

# List files by size
du -sh /var/lib/dokku/data/storage/flexbo-assets/* | sort -h

# Monitor in real-time (if uploading files)
watch -n 1 'du -sh /var/lib/dokku/data/storage/flexbo-assets/'

# Set up quota (if disk space is limited)
# Note: Requires filesystem support, check first
df -i /var/lib/dokku/data/storage/
```

---

### 2.4 Backup Strategy

**Automated daily backups:**

```bash
ssh root@209.145.61.113

# Create backup script
cat > /home/dokku/flexbo-backup.sh << 'EOF'
#!/bin/bash
APP_NAME="flexbo"
BACKUP_DIR="/home/dokku/backups"
RETENTION_DAYS=7

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Timestamp
DATE=$(date +%Y%m%d_%H%M%S)

# Backup 1: App configuration
dokku config ${APP_NAME} > ${BACKUP_DIR}/${APP_NAME}-config-${DATE}.env

# Backup 2: Asset storage
tar -czf ${BACKUP_DIR}/${APP_NAME}-assets-${DATE}.tar.gz \
  /var/lib/dokku/data/storage/${APP_NAME}-assets/ 2>/dev/null || true

# Backup 3: Database (if using PostgreSQL)
# dokku postgres:export flexbo-db > ${BACKUP_DIR}/${APP_NAME}-db-${DATE}.sql

# Clean up old backups (keep last 7 days)
find ${BACKUP_DIR} -name "${APP_NAME}-*" -mtime +${RETENTION_DAYS} -delete

# Log result
echo "$(date): Flexbo backup completed" >> ${BACKUP_DIR}/backup.log

echo "Backups created:"
ls -lah ${BACKUP_DIR}/${APP_NAME}-*-${DATE}.*
EOF

chmod +x /home/dokku/flexbo-backup.sh

# Schedule daily at 3 AM
echo "0 3 * * * /home/dokku/flexbo-backup.sh" | crontab -

# View backups
ls -lah /home/dokku/backups/flexbo-*
```

---

### 2.5 Disaster Recovery Procedures

**If app crashes or storage becomes corrupted:**

#### **Scenario A: App Container Crashed (Express/FastAPI not responding)**

```bash
ssh root@209.145.61.113

# Check app status
dokku ps:report flexbo

# View crash logs
dokku logs flexbo -n 100 | tail -20

# Option 1: Simple restart (usually fixes temporary issues)
dokku ps:restart flexbo

# Wait 10 seconds
sleep 10

# Test if responsive
curl -I https://flexbo.athenalabo.com/ && echo "✓ App recovered"

# Option 2: Full rebuild (if restart doesn't work)
dokku rebuild flexbo

# Option 3: Rollback to previous git commit
# (if recent code deploy caused crash)
ssh root@209.145.61.113 "cd /home/dokku/flexbo && git log --oneline -n 5"
# Then redeploy previous commit
git push dokku <commit-hash>:main --force
```

#### **Scenario B: Storage Corrupted or Files Missing**

```bash
ssh root@209.145.61.113

# Restore from latest backup
DATE=$(ls -t /home/dokku/backups/flexbo-assets-*.tar.gz | head -1 | grep -oE '[0-9]{8}_[0-9]{6}')

# Stop app to prevent conflicts
dokku ps:stop flexbo

# Clear corrupted storage
rm -rf /var/lib/dokku/data/storage/flexbo-assets/*

# Restore from backup
tar -xzf /home/dokku/backups/flexbo-assets-${DATE}.tar.gz \
  -C /var/lib/dokku/data/storage/flexbo-assets/ \
  --strip-components=5

# Restart app
dokku ps:start flexbo

# Verify
curl -I https://flexbo.athenalabo.com/
```

#### **Scenario C: Need to Unmount Storage (Reversible)**

```bash
ssh root@209.145.61.113

# BEFORE unmounting, backup all data
tar -czf /home/dokku/flexbo-assets-final-backup-$(date +%s).tar.gz \
  /var/lib/dokku/data/storage/flexbo-assets/

# Unmount (doesn't delete data, just disconnects)
dokku storage:unmount flexbo /var/lib/dokku/data/storage/flexbo-assets:/media

# Verify unmounted
dokku storage:list flexbo

# Data still exists at /var/lib/dokku/data/storage/flexbo-assets/
# Can be remounted later with same mount command
```

---

### 2.6 Performance Monitoring

**Track app resource usage:**

```bash
ssh root@209.145.61.113

# Current resource usage
dokku ps:report flexbo | grep -E "Running|Restarts|Port"

# Container memory/CPU
docker stats $(dokku ps:report flexbo | grep "Docker Container ID" | awk '{print $NF}')

# Network traffic
docker exec $(dokku ps:report flexbo | grep "Docker Container ID" | awk '{print $NF}') \
  ifstat -i eth0 1 5

# Disk I/O
iostat -x 1 5
```

**Set resource limits (if needed):**

```bash
ssh root@209.145.61.113

# Limit memory to 512MB
dokku config:set flexbo DOKKU_MEMORY_LIMIT=512m

# Limit CPU to 1 core
dokku config:set flexbo DOKKU_CPU_LIMIT=1

# Rebuild to apply
dokku rebuild flexbo
```

---

### 2.7 Security Checklist

**After mounting assets, verify security:**

```bash
ssh root@209.145.61.113

# Check file permissions (should not be world-writable)
ls -la /var/lib/dokku/data/storage/flexbo-assets/
# Should NOT show: drwxrwxrwx

# Check for executable files in storage (potential risk)
find /var/lib/dokku/data/storage/flexbo-assets/ -type f -executable

# Check ownership
stat /var/lib/dokku/data/storage/flexbo-assets/
# Owner should be: dokku:dokku

# Verify SSL certificate is valid
curl -vI https://flexbo.athenalabo.com/ 2>&1 | grep -A 2 "certificate"

# Check for exposed environment variables
dokku config flexbo | grep -v "^DATABASE_URL\|^RESEND_API_KEY"
# Should only show public config
```

---

### 2.8 Scaling Considerations

**If app grows and needs more resources:**

```bash
ssh root@209.145.61.113

# Current app formation (how many processes)
dokku ps:report flexbo

# If you hit limits, options:
# 1. Scale horizontally (add more app instances - requires load balancer)
dokku ps:scale flexbo web=2

# 2. Increase storage
# Move to larger disk or add secondary storage mount

# 3. Optimize start.sh
# Currently runs FastAPI in background + Express in foreground
# Can be improved with process manager (Supervisor, Honcho)
```

---

## Part 3: Runbook Reference Commands

### Quick Reference (Copy & Paste)

```bash
# ===== CHECK STATUS =====
ssh root@209.145.61.113 "dokku storage:list flexbo"
ssh root@209.145.61.113 "dokku logs flexbo -n 50"
ssh root@209.145.61.113 "curl -I https://flexbo.athenalabo.com/"

# ===== CREATE MOUNT (if not exists) =====
ssh root@209.145.61.113 << 'EOF'
mkdir -p /var/lib/dokku/data/storage/flexbo-assets/
chown dokku:dokku /var/lib/dokku/data/storage/flexbo-assets/
chmod 755 /var/lib/dokku/data/storage/flexbo-assets/
dokku storage:mount flexbo /var/lib/dokku/data/storage/flexbo-assets:/media
dokku proxy:build-config flexbo
EOF

# ===== BACKUP BEFORE CHANGES =====
ssh root@209.145.61.113 << 'EOF'
DATE=$(date +%Y%m%d_%H%M%S)
dokku config flexbo > /home/dokku/flexbo-config-${DATE}.env
tar -czf /home/dokku/flexbo-assets-backup-${DATE}.tar.gz \
  /var/lib/dokku/data/storage/flexbo-assets/ 2>/dev/null || true
EOF

# ===== MONITOR DISK =====
ssh root@209.145.61.113 "df -h /var/lib/dokku/data/storage/"
ssh root@209.145.61.113 "du -sh /var/lib/dokku/data/storage/flexbo-assets/"

# ===== RESTART IF NEEDED =====
ssh root@209.145.61.113 "dokku ps:restart flexbo"

# ===== VIEW RECENT ERRORS =====
ssh root@209.145.61.113 "dokku logs flexbo -n 200 | grep -i error"
```

---

## Part 4: Integration with Express Server

**How assets are served by Express:**

```javascript
// In server_resend/server.js
app.use('/media', express.static('/media'));

// This means:
// http://flexbo.athenalabo.com/media/file.jpg
// → /var/lib/dokku/data/storage/flexbo-assets/file.jpg

// Upload handler (if implemented):
// POST /api/upload → saves to /media/
// GET /media/:filename → serves from /media/
```

**To enable uploads, you'd add to Express:**

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/media/');  // Save to mounted volume
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
  res.json({ url: `/media/${req.file.filename}` });
});
```

---

## Summary Checklist

- [ ] **Verify current mount**: Run `dokku storage:list flexbo`
- [ ] **Create storage dir**: `mkdir -p /var/lib/dokku/data/storage/flexbo-assets/`
- [ ] **Mount storage**: Run `dokku storage:mount flexbo ...` command
- [ ] **Test mount**: Upload test file to `/media` via SSH
- [ ] **Backup state**: Run backup script before enabling uploads
- [ ] **Health check**: Verify website, API, and email still work
- [ ] **Schedule monitoring**: Set up cron job for daily health checks
- [ ] **Enable logging**: Configure persistent logs with `dokku config:set`
- [ ] **Document backups**: List backup files and test restore procedure
- [ ] **Security audit**: Check file permissions and SSL certificate

---

**Questions or issues? Check logs:**
```bash
ssh root@209.145.61.113 "dokku logs flexbo -n 100"
```

**Last Updated:** December 9, 2025
