# Deployment Scripts

## push-to-git.sh

**Purpose**: Push code to GitHub only - does NOT deploy to server.

**Usage**:
```bash
# With custom commit message
./scripts/push-to-git.sh "feat: Add new feature"

# With default commit message
./scripts/push-to-git.sh
```

**What it does**:
- Stages all changes
- Commits with message
- Pushes to GitHub (main branch)
- Does NOT deploy to server

**When to use**:
- When you want to save code to GitHub
- Before deploying (push first, then deploy separately)
- For code backup

## deploy.sh

**Purpose**: Deploy to server (run this ON THE SERVER).

**Usage** (on server):
```bash
cd /opt/smokava
bash scripts/deploy.sh
```

**What it does**:
- Creates backup
- Pulls latest code from git
- Builds and deploys services
- Runs health checks

**When to use**:
- On production server
- After code is pushed to GitHub
- For safe deployment with backup

## Workflow

### Recommended Workflow:

1. **Make changes locally**
2. **Push to GitHub**:
   ```bash
   ./scripts/push-to-git.sh "feat: Description of changes"
   ```

3. **Deploy on server** (separate step):
   ```bash
   # SSH to server
   ssh user@server

   # Deploy
   cd /opt/smokava
   git pull origin main
   bash scripts/deploy.sh
   ```

### Or use CI/CD:

1. Push to GitHub (triggers automatic deployment)
2. GitHub Actions handles deployment automatically

## Important Notes

- **Never deploy directly from local machine to server**
- Always push to git first
- Deploy on server by pulling from git
- This ensures version control and rollback capability
