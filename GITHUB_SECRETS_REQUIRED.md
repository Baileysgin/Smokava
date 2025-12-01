# 🔐 GITHUB SECRETS - COMPLETE REFERENCE

## Required Secrets Table

| Secret Name | Required For | Description | Example Value | Status |
|------------|--------------|-------------|---------------|--------|
| **SSH_PRIVATE_KEY** | All workflows | SSH private key for server access (full key including headers) | `-----BEGIN OPENSSH PRIVATE KEY-----...` | ✅ **REQUIRED** |
| **SERVER_IP** | All workflows | Server IP address | `91.107.241.245` | ✅ **REQUIRED** |
| **SSH_USER** | All workflows | SSH username (defaults to 'root' if not set) | `root` | ⚠️ **OPTIONAL** (defaults to root) |
| **SSH_PORT** | All workflows | SSH port (defaults to '22' if not set) | `22` | ⚠️ **OPTIONAL** (defaults to 22) |
| **SSH_HOST** | backup.yml, deploy.yml (fallback) | Alternative format: `user@host` (can use SERVER_IP instead) | `root@91.107.241.245` | ⚠️ **OPTIONAL** (use SERVER_IP instead) |
| **API_URL** | deploy.yml | API base URL for health checks (optional) | `https://api.smokava.com` | ⚠️ **OPTIONAL** |
| **NEXT_PUBLIC_API_URL** | deploy-frontend.yml, sync-env.yml | Frontend API URL (optional, has default) | `https://api.smokava.com/api` | ⚠️ **OPTIONAL** |
| **NEXT_PUBLIC_MAPBOX_TOKEN** | deploy-frontend.yml, sync-env.yml | Mapbox API token for maps (optional) | `pk.eyJ1Ijoi...` | ⚠️ **OPTIONAL** |
| **VITE_API_URL** | deploy-admin-panel.yml, sync-env.yml | Admin panel API URL (optional, has default) | `https://api.smokava.com/api` | ⚠️ **OPTIONAL** |

## Summary

### ✅ **MUST HAVE** (Required):
1. **SSH_PRIVATE_KEY** - SSH private key for server access
2. **SERVER_IP** - Server IP address (91.107.241.245)

### ⚠️ **NICE TO HAVE** (Optional with defaults):
- **SSH_USER** - Defaults to 'root' if not set
- **SSH_PORT** - Defaults to '22' if not set
- **API_URL** - Defaults to 'https://api.smokava.com' if not set
- **NEXT_PUBLIC_API_URL** - Defaults to 'https://api.smokava.com/api' if not set
- **VITE_API_URL** - Defaults to 'https://api.smokava.com/api' if not set
- **NEXT_PUBLIC_MAPBOX_TOKEN** - Only needed if using Mapbox maps

## Workflow-Specific Requirements

### deploy.yml (Main Deployment)
- ✅ SSH_PRIVATE_KEY
- ✅ SERVER_IP (or SSH_HOST)
- ⚠️ SSH_USER (defaults to root)
- ⚠️ SSH_PORT (defaults to 22)
- ⚠️ API_URL (optional)

### deploy-backend.yml
- ✅ SSH_PRIVATE_KEY
- ✅ SERVER_IP
- ⚠️ SSH_USER (defaults to root)
- ⚠️ SSH_PORT (defaults to 22)

### deploy-frontend.yml
- ✅ SSH_PRIVATE_KEY
- ✅ SERVER_IP
- ⚠️ SSH_USER (defaults to root)
- ⚠️ SSH_PORT (defaults to 22)
- ⚠️ NEXT_PUBLIC_API_URL (optional)
- ⚠️ NEXT_PUBLIC_MAPBOX_TOKEN (optional)

### deploy-admin-panel.yml
- ✅ SSH_PRIVATE_KEY
- ✅ SERVER_IP
- ⚠️ SSH_USER (defaults to root)
- ⚠️ SSH_PORT (defaults to 22)
- ⚠️ VITE_API_URL (optional)

### backup.yml
- ✅ SSH_PRIVATE_KEY
- ✅ SSH_HOST (or SERVER_IP)

### sync-env.yml
- ✅ SSH_PRIVATE_KEY
- ✅ SERVER_IP
- ⚠️ SSH_USER (defaults to root)
- ⚠️ SSH_PORT (defaults to 22)
- ⚠️ NEXT_PUBLIC_API_URL (optional)
- ⚠️ NEXT_PUBLIC_MAPBOX_TOKEN (optional)
- ⚠️ VITE_API_URL (optional)
