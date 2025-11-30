# 📝 Commit Message Guidelines

## Commit Message Format

All commits should follow this format:

```
<type>: <subject>

<body>

<footer>
```

## Commit Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, build scripts, etc.
- **perf**: Performance improvements
- **ci**: CI/CD changes

## Examples

### Feature Addition
```
feat: Add MongoDB backup and restore scripts

- Add backup-mongodb.sh: Automated MongoDB backup script
- Add restore-mongodb.sh: Restore MongoDB from backup
- Automatic backup retention (keeps last 10 backups)
- Compressed backups using mongodump with gzip

All scripts include error handling and logging.
```

### Bug Fix
```
fix: OTP verification accepts both code and otpCode parameters

- Fix OTP verification to accept both 'code' and 'otpCode' parameters
- Improve code normalization for OTP comparison
- Add enhanced logging for OTP verification debugging

Fixes operator panel login issues with OTP verification.
```

### Documentation
```
docs: Add comprehensive data persistence guide

- DATA_PERSISTENCE_GUIDE.md: Complete guide on MongoDB data persistence
- MONGODB_VOLUME_GUIDE.md: MongoDB volume configuration
- Includes safe update procedures and backup recommendations
```

### Configuration Change
```
chore: Update docker-compose.yml for admin panel environment variables

- Add VITE_API_URL build argument to admin-panel service
- Pass VITE_API_URL as environment variable at runtime
- Update admin-panel Dockerfile to accept build arguments
```

## Auto-Commit Script

Use the provided script to automatically commit changes:

```bash
# Auto-generate commit message
./scripts/commit-changes.sh

# Or provide your own message
./scripts/commit-changes.sh "fix: Update OTP verification logic"
```

## Manual Commit Template

The repository includes a `.gitmessage` template. When you commit, use:

```bash
git commit
```

This will open your editor with the template.

## Best Practices

1. **Commit Often**: Commit small, logical changes
2. **Clear Messages**: Write clear, descriptive commit messages
3. **One Change Per Commit**: Each commit should represent one logical change
4. **Include Context**: Explain WHY the change was made, not just WHAT
5. **Reference Issues**: If fixing an issue, reference it in the commit message

## Commit Workflow

1. Make your changes
2. Stage changes: `git add <files>`
3. Review changes: `git status` and `git diff --cached`
4. Commit with message: `./scripts/commit-changes.sh` or `git commit -m "message"`
5. Push to GitHub: `git push origin main`

## Example Workflow

```bash
# Make changes to backend
vim backend/routes/auth.js

# Stage changes
git add backend/routes/auth.js

# Commit with auto-generated message
./scripts/commit-changes.sh

# Or commit manually
git commit -m "fix: OTP verification accepts both code and otpCode

- Fix parameter mismatch between frontend and backend
- Add code normalization for better OTP comparison
- Improve error logging for debugging

Fixes operator panel login issues."

# Push to GitHub
git push origin main
```

## Commit Message Checklist

- [ ] Type is correct (feat, fix, docs, etc.)
- [ ] Subject is clear and concise (50 chars or less)
- [ ] Body explains what and why
- [ ] Includes affected files/components
- [ ] References related issues if applicable
- [ ] Follows the template format

---

**Remember**: Good commit messages help you and your team understand the project history!

