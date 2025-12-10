# HTTPS Setup for Flexbo on Dokku

After deployment, run these commands on the VPS (ssh into 209.145.61.113):

## Enable Let's Encrypt for the flexbo app

```bash
# SSH to VPS
ssh root@209.145.61.113

# Set Let's Encrypt email
dokku config:set --no-restart flexbo DOKKU_LETSENCRYPT_EMAIL=admin@athenalabo.com

# Enable Let's Encrypt plugin
dokku letsencrypt:enable flexbo

# Auto-renewal
dokku letsencrypt:auto-renew
```

## Verify HTTPS
```bash
curl -I https://flexbo.athenalabo.com/
```

## Force HTTPS redirect (optional)
```bash
dokku domains:enable-https flexbo
# or add to nginx config:
# return 301 https://$server_name$request_uri;
```
