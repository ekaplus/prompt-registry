# Custom Docker Build for Prompts.Chat

Production-ready Docker setup optimized for external PostgreSQL deployment.

## Features

- **Multi-stage build** - Optimized image size (~300-400MB)
- **External PostgreSQL** - Connects to shared database instance
- **Configuration externalization** - All settings via environment variables
- **Security** - Non-root user, minimal dependencies
- **Health checks** - Built-in container health monitoring
- **Idempotent operations** - Safe to run scripts multiple times

## Quick Start

### 1. Configure Environment

```bash
cd docker-custom
cp .env.docker.example .env.docker
# Edit .env.docker with your PostgreSQL connection and settings
```

**Required Configuration:**
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Generate with: `openssl rand -base64 32`

### 2. Build Docker Image

```bash
# From project root
bash scripts/docker-build.sh

# Or using Make
make build
```

### 3. Initialize Database

Run migrations (first time only):

```bash
bash scripts/docker-db-init.sh

# Or using Make
make db-init
```

### 4. Seed Database

Populate with initial data (first time only):

```bash
bash scripts/docker-db-seed.sh

# Or using Make
make db-seed
```

**Default credentials after seeding:**
- Email: `admin@prompts.chat`
- Password: `password123`

⚠️ **Change the admin password after first login!**

### 5. Start Application

```bash
bash scripts/docker-run.sh

# Or using Make
make run
```

Access the application at: http://localhost:3000

## Directory Structure

```
docker-custom/
├── Dockerfile              # Multi-stage build definition
├── docker-compose.yml      # Service orchestration
├── .env.docker.example     # Environment template
├── .dockerignore          # Build exclusions
└── README.md              # This file

scripts/
├── db-init.sh             # Database migration script
├── db-seed.sh             # Database seeding script
├── db-reset-admin.sh      # Admin password reset
├── docker-build.sh        # Build Docker image
├── docker-run.sh          # Start application
├── docker-db-init.sh      # Docker wrapper for db-init
└── docker-db-seed.sh      # Docker wrapper for db-seed
```

## Configuration

### Database Connection

The application requires an external PostgreSQL database. Configure in `.env.docker`:

```bash
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
```

For connection poolers (Neon, Supabase, PlanetScale), also set:

```bash
DIRECT_URL=postgresql://user:password@direct-host:5432/database?schema=public
```

### Branding & Theme

Customize your instance:

```bash
BRAND_NAME=My Prompt Library
BRAND_COLOR=#6366f1
THEME_RADIUS=sm
THEME_VARIANT=default
```

### Authentication

Enable authentication providers:

```bash
AUTH_PROVIDERS=credentials,github,google
ALLOW_REGISTRATION=true

# Required for Docker/reverse proxy deployments (NextAuth v5)
AUTH_TRUST_HOST=true

# OAuth credentials
AUTH_GITHUB_ID=your_github_client_id
AUTH_GITHUB_SECRET=your_github_client_secret
```

**Important:** `AUTH_TRUST_HOST=true` is required for NextAuth v5 in Docker environments to properly handle redirects after login. Without it, you may need to click the login button twice.

### Feature Flags

Enable/disable features:

```bash
FEATURE_PRIVATE_PROMPTS=true
FEATURE_AI_SEARCH=false
FEATURE_AI_GENERATION=false
```

### AI Features

Enable AI-powered features with OpenAI:

```bash
OPENAI_API_KEY=sk-...
FEATURE_AI_SEARCH=true
FEATURE_AI_GENERATION=true
```

## Common Operations

### View Logs

```bash
docker-compose -f docker-custom/docker-compose.yml --env-file docker-custom/.env.docker logs -f app

# Or using Make
make logs
```

### Restart Application

```bash
docker-compose -f docker-custom/docker-compose.yml --env-file docker-custom/.env.docker restart app

# Or using Make
make restart
```

### Stop Application

```bash
docker-compose -f docker-custom/docker-compose.yml --env-file docker-custom/.env.docker down

# Or using Make
make stop
```

### Access Container Shell

```bash
docker-compose -f docker-custom/docker-compose.yml --env-file docker-custom/.env.docker exec app /bin/bash

# Or using Make
make shell
```

### Reset Admin Password

```bash
bash scripts/docker-db-reset.sh

# Or using Make
make db-reset
```

### Clean Up

Remove containers and volumes:

```bash
docker-compose -f docker-custom/docker-compose.yml --env-file docker-custom/.env.docker down -v

# Or using Make
make clean
```

## Makefile Commands

For convenience, use the Makefile from the project root:

```bash
make help        # Show all commands
make build       # Build Docker image
make run         # Start application
make stop        # Stop application
make restart     # Restart application
make logs        # View logs
make shell       # Access container shell
make db-init     # Initialize database
make db-seed     # Seed database
make db-reset    # Reset admin password
make clean       # Remove containers and volumes
```

## Troubleshooting

### Database Connection Issues

**Problem:** Application can't connect to PostgreSQL

**Solutions:**
1. Verify `DATABASE_URL` is correct in `.env.docker`
2. Ensure PostgreSQL is accessible from Docker container
3. Check firewall rules allow connection
4. Test connection: `docker-compose run --rm app npx prisma db execute --stdin <<< "SELECT 1"`

### Build Failures

**Problem:** Docker build fails

**Solutions:**
1. Ensure you have enough disk space
2. Clear Docker cache: `docker system prune -a`
3. Check Node.js version matches (24.x)
4. Verify all source files are present

### Migration Errors

**Problem:** Database migrations fail

**Solutions:**
1. Check database user has CREATE/ALTER permissions
2. Ensure database exists
3. Verify schema name matches (default: `public`)
4. Run migrations manually: `docker-compose run --rm app npx prisma migrate deploy`

### Port Already in Use

**Problem:** Port 3000 already in use

**Solutions:**
1. Change `APP_PORT` in `.env.docker`
2. Stop conflicting service
3. Use different port: `APP_PORT=3001 bash scripts/docker-run.sh`

### Permission Denied on Scripts

**Problem:** Cannot execute shell scripts

**Solutions:**
1. Make scripts executable: `chmod +x scripts/*.sh`
2. Run with bash explicitly: `bash scripts/docker-build.sh`

## Architecture

### Multi-Stage Build

The Dockerfile uses three stages:

1. **deps** - Installs production dependencies
2. **builder** - Builds Next.js application
3. **runner** - Minimal production image

This approach reduces final image size and improves security.

### External Database

The application connects to an external PostgreSQL instance, allowing:
- Database sharing across multiple applications
- Independent database scaling
- Simplified backup and recovery
- Better resource management

### Health Checks

The container includes health checks that verify:
- Application is running
- HTTP server is responding
- Health endpoint returns 200 status

Docker automatically restarts unhealthy containers.

## Security Considerations

- Application runs as non-root user (`nextjs:nodejs`)
- Secrets managed via environment variables
- No credentials in Docker image layers
- Minimal runtime dependencies
- Regular security updates via base image

## Performance Tuning

### Resource Limits

Uncomment in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### Database Connection Pooling

For high-traffic deployments, use connection pooling:

```bash
DATABASE_URL=postgresql://user:password@pooler-host:5432/db?schema=public&connection_limit=10
DIRECT_URL=postgresql://user:password@direct-host:5432/db?schema=public
```

## Support

For issues and questions:
- Check existing issues on GitHub
- Review application logs: `make logs`
- Verify configuration in `.env.docker`
- Consult main project documentation

## License

Same as the main prompts.chat project (MIT).
