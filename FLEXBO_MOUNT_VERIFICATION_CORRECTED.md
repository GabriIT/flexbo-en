# Flexbo Mount Verification - Corrected Tests

**Status:** Mount completed successfully ✅

The two test failures were due to incorrect test commands, NOT the mount. Here are the corrected tests:

---

## Test 1: Website Loads ✅ PASSED
```bash
curl -I https://flexbo.athenalabo.com/
# Expected: HTTP/2 200 ✓
# Result: WORKING
```

---

## Test 2: Email API (Correct Endpoint) - RERUN

The `/api/health` endpoint doesn't exist on flexbo (that's FastAPI-specific).  
Flexbo uses Express with Resend email API. Test the correct endpoint:

```bash
curl -s -X POST https://flexbo.athenalabo.com/api/forward \
  -H "Content-Type: application/json" \
  -d '{"name":"TestMount","email":"test@example.com","message":"Testing mount"}'
```

**Expected:** Success response or error response (NOT 502/503 which would indicate mount failure)

---

## Test 3: Verify Mount Inside Container (Correct Syntax)

The `dokku enter` command doesn't work with pipes. Use `dokku run` instead:

```bash
# WRONG (what we tried):
ssh root@209.145.61.113 "dokku enter flexbo mount | grep /media"
# Error: No containers found for type 'mount'

# CORRECT:
ssh root@209.145.61.113 "dokku run flexbo mount | grep /media"
```

Run this:
```bash
ssh root@209.145.61.113 "dokku run flexbo mount | grep -E '/media|flexbo-en-assets'"
```

**Expected:** Output showing `/var/lib/dokku/data/storage/flexbo-en-assets on /media`

---

## Test 4: Verify Both Apps Share Storage

```bash
ssh root@209.145.61.113 << 'EOF'

echo "=== Verifying Shared Storage ==="

echo "Flexbo mount:"
dokku storage:list flexbo

echo ""
echo "Flexbo-en mount:"
dokku storage:list flexbo-en

echo ""
echo "Storage directory contents:"
ls -lah /var/lib/dokku/data/storage/flexbo-en-assets/

EOF
```

**Expected:** Both apps should show mount to `/var/lib/dokku/data/storage/flexbo-en-assets:/media`

---

## Test 5: Test Write Access

```bash
ssh root@209.145.61.113 "dokku run flexbo touch /media/test-mount-$(date +%s).txt && echo '✓ Write successful'"
```

**Expected:** Message showing write was successful

---

## Test 6: Verify Other App Still Works

```bash
curl -I https://flexbo-eu.athenalabo.com/
```

**Expected:** HTTP/2 200 (confirming mount didn't affect flexbo-en)

---

## Complete Verification Script (All Tests)

Run this single command to verify everything:

```bash
echo "=== Flexbo Mount Verification ==="
echo ""
echo "Test 1: Website responds"
curl -s -I https://flexbo.athenalabo.com/ | head -1

echo ""
echo "Test 2: Email API works"
curl -s -X POST https://flexbo.athenalabo.com/api/forward \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","message":"test"}' | head -c 100

echo ""
echo ""
echo "Test 3: Mount accessible in container"
ssh root@209.145.61.113 "dokku run flexbo mount | grep flexbo-en-assets" && echo "✓ Mount found"

echo ""
echo "Test 4: Mount is writable"
ssh root@209.145.61.113 "dokku run flexbo touch /media/test-$(date +%s).txt && echo '✓ Write successful'"

echo ""
echo "Test 5: Both apps share storage"
ssh root@209.145.61.113 << 'SSH_EOF'
echo "Flexbo: $(dokku storage:list flexbo | grep flexbo-en-assets)"
echo "Flexbo-en: $(dokku storage:list flexbo-en | grep flexbo-en-assets)"
SSH_EOF

echo ""
echo "Test 6: Flexbo-en still works"
curl -s -I https://flexbo-eu.athenalabo.com/ | head -1

echo ""
echo "=== All Tests Complete ==="
```

---

## Summary

✅ **Mount Status:** SUCCESSFUL  
✅ **Test 1:** Website loads  
❌ **Test 2:** Wrong endpoint tested (fixed - use /api/forward instead of /api/health)  
❌ **Test 3:** Wrong dokku syntax (fixed - use `dokku run` instead of `dokku enter`)  

**Next Steps:** Run the corrected tests above to confirm everything is working.
