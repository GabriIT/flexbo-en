# Flexbo Shared Asset Mount - Quick Summary

**Date:** December 9, 2025  
**Complexity:** MINIMAL (just one mount command)  
**Risk Level:** Very Low (existing storage, no creation needed)  
**Downtime:** None (app stays running during mount)

---

## What's Happening

You're creating a **shared persistent storage** between two apps:

```
┌─────────────────────────────────────────────────────┐
│  /var/lib/dokku/data/storage/flexbo-en-assets       │
│  (Shared persistent directory)                      │
└──────────┬──────────────────────────────────┬────────┘
           │                                  │
           ↓                                  ↓
    ┌─────────────┐                  ┌──────────────┐
    │   flexbo    │                  │   flexbo-en  │
    │ app (/media)│                  │ app (/media) │
    └─────────────┘                  └──────────────┘
    flexbo.athenalabo.com            flexbo-eu.athenalabo.com
```

Both apps can now:
- ✅ Read files uploaded by the other app
- ✅ Write files that the other app can access
- ✅ Share product images, PDFs, media assets
- ✅ Access the same persistent `/media` directory

---

## The ONE Command That Does Everything

```bash
dokku storage:mount flexbo /var/lib/dokku/data/storage/flexbo-en-assets:/media
```

That's it! This command:
1. Takes the existing `/var/lib/dokku/data/storage/flexbo-en-assets` directory (already used by flexbo-en)
2. Mounts it inside the flexbo container at `/media`
3. Makes it accessible via Express.js (`app.use('/media', express.static('/media'))`)

---

## Complete Execution (Copy-Paste One Block)

```bash
ssh root@209.145.61.113 << 'EOF'

# Backup (safety first)
DATE=$(date +%Y%m%d_%H%M%S)
dokku config flexbo > /home/dokku/flexbo-config-backup-${DATE}.env

# Mount the shared storage
dokku storage:mount flexbo /var/lib/dokku/data/storage/flexbo-en-assets:/media

# Rebuild Nginx config (instant, no restart)
dokku proxy:build-config flexbo

# Verify both apps use same storage
echo "=== Both Apps Now Share Storage ==="
echo "Flexbo mounts:"
dokku storage:list flexbo
echo ""
echo "Flexbo-en mounts:"
dokku storage:list flexbo-en
echo ""
echo "✓ Mount complete - shared assets active"

EOF
```

---

## Verification (Run After)

```bash
# Test 1: Website still works
curl -I https://flexbo.athenalabo.com/

# Test 2: API health
curl https://flexbo.athenalabo.com/api/health

# Test 3: Verify mount from inside container
ssh root@209.145.61.113 "dokku enter flexbo mount | grep /media"

# Test 4: Both apps can access shared files
ssh root@209.145.61.113 "ls -la /var/lib/dokku/data/storage/flexbo-en-assets/"
```

---

## That's All!

- ✅ No directory creation (exists already)
- ✅ No permission changes (already correct)
- ✅ No app restart (just proxy rebuild)
- ✅ No downtime
- ✅ Instantly reversible (unmount keeps data intact)

**Status:** Ready to execute whenever you are.

See **FLEXBO_MOUNT_EXECUTION_COMMANDS.md** for detailed step-by-step with backups and health checks.
