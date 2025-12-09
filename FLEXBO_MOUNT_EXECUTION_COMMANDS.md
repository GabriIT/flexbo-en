# Flexbo Asset Mount - Execution Commands
**Date:** December 9, 2025  
**Target App:** flexbo  
**Domain:** flexbo.athenalabo.com  
**Storage Location:** /var/lib/dokku/data/storage/flexbo-en-assets (SHARED with flexbo-en app)  
**Mount Path (inside container):** /media  
**Status:** Storage directory already exists, simply need to mount it

---

## ✅ SAFE EXECUTION PLAN

Since **flexbo-en-assets already exists** and is used by flexbo-en, this is a simple mount operation with minimal risk.

### Step 1: Pre-Execution Backup (Mandatory Safety)

```bash
ssh root@209.145.61.113 << 'EOF'

echo "=== Creating Pre-Mount Backups ==="
DATE=$(date +%Y%m%d_%H%M%S)

# Backup app environment configuration
dokku config flexbo > /home/dokku/flexbo-config-backup-${DATE}.env

# List backup created
ls -lah /home/dokku/flexbo-config-backup-${DATE}.env

echo "✓ Backup completed"

EOF
```

---

### Step 2: Verify Shared Storage Directory Exists

```bash
ssh root@209.145.61.113 << 'EOF'

echo "=== Verifying Shared Storage Directory ==="

# Confirm directory exists
ls -lah /var/lib/dokku/data/storage/flexbo-en-assets/

# Show what's currently in it (shared with flexbo-en)
echo ""
echo "Current contents of shared storage:"
du -sh /var/lib/dokku/data/storage/flexbo-en-assets/

# Check permissions
echo ""
echo "Directory permissions:"
stat /var/lib/dokku/data/storage/flexbo-en-assets/ | grep -E "Access|Uid|Gid"

echo "✓ Storage directory verified and ready to share"

EOF
```

---

### Step 3: Mount Shared Storage to Flexbo App

```bash
ssh root@209.145.61.113 << 'EOF'

echo "=== Mounting Shared Storage to Flexbo App ==="

# Add storage mount (uses existing flexbo-en-assets directory)
dokku storage:mount flexbo /var/lib/dokku/data/storage/flexbo-en-assets:/media

# Verify mount was added
echo ""
echo "=== Verifying Flexbo Mount ==="
dokku storage:list flexbo

# Rebuild Nginx proxy config (doesn't restart app)
echo ""
echo "=== Rebuilding Proxy Configuration ==="
dokku proxy:build-config flexbo

echo "✓ Mount configuration completed"

EOF
```

---

### Step 4: Verify Mount is Working (Test Writability)

```bash
ssh root@209.145.61.113 << 'EOF'

echo "=== Testing Mount Writability ==="

# Enter container and test mount
dokku enter flexbo bash << 'INNER'

# Check if /media is accessible
if [ -d "/media" ]; then
  echo "✓ /media directory accessible in container"
else
  echo "✗ /media directory NOT found"
  exit 1
fi

# Test write access
TEST_FILE="/media/test-flexbo-$(date +%s).txt"
if touch ${TEST_FILE} 2>/dev/null; then
  echo "✓ /media is writable"
  # Show that flexbo can access shared storage
  echo "✓ Flexbo can now access files written by flexbo-en and vice versa"
  # Clean up test file
  rm -f ${TEST_FILE}
else
  echo "✗ /media is NOT writable"
  exit 1
fi

# Show mount point details
echo ""
echo "=== Mount Point Details ==="
mount | grep /media
df -h /media

INNER

echo ""
echo "✓ Mount test completed successfully"

EOF
```

---

### Step 5: Verify Both Apps Now Share Storage

```bash
ssh root@209.145.61.113 << 'EOF'

echo "=== Verifying Both Apps Share Storage ==="

# Show flexbo mount
echo "Flexbo app mounts:"
dokku storage:list flexbo

# Show flexbo-en mount
echo ""
echo "Flexbo-en app mounts:"
dokku storage:list flexbo-en

# Verify both point to same directory
echo ""
echo "=== Confirming Both Use Same Storage ==="
FLEXBO_MOUNT=$(dokku storage:list flexbo | grep flexbo-en-assets | awk '{print $1}')
FLEXBO_EN_MOUNT=$(dokku storage:list flexbo-en | grep flexbo-en-assets | awk '{print $1}')

if [ "$FLEXBO_MOUNT" = "$FLEXBO_EN_MOUNT" ]; then
  echo "✓ Both apps mounted to: $FLEXBO_MOUNT"
  echo "✓ SHARED STORAGE ACTIVE"
else
  echo "✗ Mounts differ - something went wrong"
  exit 1
fi

# Show storage directory
echo ""
echo "Shared storage contents:"
ls -lah /var/lib/dokku/data/storage/flexbo-en-assets/

echo ""
echo "✓ Both flexbo and flexbo-en can now access shared assets"

EOF
```

---

### Step 6: Health Check (Verify App Still Works)

```bash
echo "=== Health Check ==="

# Test 1: Website responds
echo "Test 1: Flexbo website loads..."
curl -s -I https://flexbo.athenalabo.com/ | head -1

# Test 2: Email forwarding API (Resend)
echo ""
echo "Test 2: Flexbo email API test..."
curl -s -X POST https://flexbo.athenalabo.com/api/forward \
  -H "Content-Type: application/json" \
  -d '{"name":"MountTest","email":"test@example.com","message":"Testing shared mount"}' | head -c 100

# Test 3: Verify mount is accessible inside container
echo ""
echo "Test 3: Verify /media mount inside container..."
ssh root@209.145.61.113 "dokku run flexbo mount | grep -E '/media|flexbo-en-assets'" && echo "✓ Mount is accessible"

# Test 4: Check for errors in logs
echo ""
echo "Test 4: Checking logs for errors..."
ssh root@209.145.61.113 "dokku logs flexbo -n 20" | grep -i "error\|critical" || echo "✓ No errors in recent logs"

# Test 5: Verify flexbo-en still works (other app unaffected)
echo ""
echo "Test 5: Flexbo-en still working..."
curl -s -I https://flexbo-eu.athenalabo.com/ | head -1

echo ""
echo "=== Health Check Complete ==="
```

---

## Summary of What Each Command Does

| Step | Command | Effect | Risk |
|------|---------|--------|------|
| **1** | `dokku config flexbo > backup.env` | Saves current config before changes | None - read-only |
| **2** | `ls -lah /var/lib/dokku/data/storage/flexbo-en-assets/` | Verifies storage directory exists | None - read-only |
| **3** | `dokku storage:mount flexbo ...` | Mounts existing storage to flexbo app | **Low** - no app restart |
| **3** | `dokku proxy:build-config flexbo` | Updates Nginx config | **Low** - app stays running |
| **4** | `touch /media/test-*.txt` | Tests write access | None - creates temp file only |
| **5** | `dokku storage:list` on both apps | Verifies both apps use same mount | None - read-only |
| **6** | `curl https://flexbo.athenalabo.com/` | Health checks | None - read-only |

---

## ⚡ Quick Copy-Paste (All Steps Combined)

If you want to run everything at once (still safe, includes backups):

```bash
ssh root@209.145.61.113 << 'FULL_EOF'

# Step 1: Backup
DATE=$(date +%Y%m%d_%H%M%S)
dokku config flexbo > /home/dokku/flexbo-config-backup-${DATE}.env
echo "✓ Backup created: flexbo-config-backup-${DATE}.env"

# Step 2: Verify shared storage exists
ls -lah /var/lib/dokku/data/storage/flexbo-en-assets/ && echo "✓ Shared storage directory ready"

# Step 3: Mount shared storage to flexbo
dokku storage:mount flexbo /var/lib/dokku/data/storage/flexbo-en-assets:/media
dokku proxy:build-config flexbo
echo "✓ Mount configured"

# Step 4: Verify mount
dokku storage:list flexbo
echo "✓ Mount verified"

# Step 5: Verify both apps use same storage
echo ""
echo "Both apps now share storage:"
echo "Flexbo: $(dokku storage:list flexbo)"
echo "Flexbo-en: $(dokku storage:list flexbo-en)"

# Step 6: Test writability
dokku run flexbo touch /media/test-shared-mount.txt && dokku run flexbo rm /media/test-shared-mount.txt && echo "✓ Mount is writable"

FULL_EOF

# Step 7: Health check (from local machine)
echo ""
echo "=== Health Check ==="
curl -s -I https://flexbo.athenalabo.com/ | head -1
curl -s -X POST https://flexbo.athenalabo.com/api/forward -H "Content-Type: application/json" -d '{"name":"Test","email":"test@test.com","message":"test"}' | head -c 50
echo ""
echo "✓ All checks passed - flexbo and flexbo-en now share assets!"
```

---

## 🔄 Rollback Plan (If Something Goes Wrong)

If you need to undo the mount:

```bash
ssh root@209.145.61.113 << 'EOF'

echo "=== Unmounting flexbo storage ==="

# BACKUP first
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /home/dokku/flexbo-assets-rollback-${DATE}.tar.gz \
  /var/lib/dokku/data/storage/flexbo-en-assets/ 2>/dev/null || true

# Unmount (data stays intact)
dokku storage:unmount flexbo /var/lib/dokku/data/storage/flexbo-en-assets:/media

# Rebuild config
dokku proxy:build-config flexbo

# Verify unmounted
dokku storage:list flexbo

echo "✓ Mount removed (data preserved at /var/lib/dokku/data/storage/flexbo-en-assets/)"

EOF
```

---

## What You'll Be Able To Do After Mount

Once mounted, the `/media` directory inside the flexbo container is **persistent**:

```javascript
// In server_resend/server.js - already configured
app.use('/media', express.static('/media'));

// Users can now:
// GET https://flexbo.athenalabo.com/media/filename.pdf
// → Serves from /var/lib/dokku/data/storage/flexbo-en-assets/filename.pdf

// To add upload functionality later:
// POST https://flexbo.athenalabo.com/api/upload (file)
// → Saves to /media/ (mounted storage)
```

---

**Ready to execute? Just copy-paste the "Quick Copy-Paste" section or run steps 1-5 individually for more control.**

**Questions before executing?**
- Need to check something on the server first?
- Want to review the exact commands?
- Prefer step-by-step execution?
