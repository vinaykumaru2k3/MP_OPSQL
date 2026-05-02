# Phase 4 Production Deployment Plan: Cloud Hosting

*This document is our operational reference for deploying the SchemaForge to a fully live, publicly accessible cloud environment using 100% free-tier services.*

---

## Architecture Overview

```
GitHub Repo
     │
     ├─── Vercel (Frontend)
     │         React + Vite build
     │         Auto-deploy on push to main
     │         Calls backend via VITE_API_URL env var
     │
     ├─── Railway (Backend)
     │         Spring Boot JAR (via Dockerfile)
     │         Env vars: DB_URL, DB_USER, DB_PASS, PORT, FRONTEND_URL
     │         Flyway runs V1 + V2 migrations automatically on startup
     │
     └─── Neon (Database)
               Serverless PostgreSQL 15
               Connection string injected into Railway env vars
               Flyway manages schema (V1, V2 scripts)
```

| Service | Platform | Cost |
| :--- | :--- | :--- |
| React Frontend | Vercel | Free |
| Spring Boot API | Railway | Free (500 hrs/mo) |
| PostgreSQL | Neon | Free (0.5 GB) |
| CI/CD | GitHub Actions | Free |
| Domain | `your-app.vercel.app` | Free |

---

## Codebase Changes Required Before Deployment

### 1. Parameterise `application.properties`
Remove all hardcoded credentials. Railway injects environment variables at runtime. The `:default` fallback ensures local development still works without changes.

```properties
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASS}
server.port=${PORT:8080}
```

### 2. Configurable Frontend API URL
The existing relative path (`/api/v1/migrations`) only works when the frontend and backend share the same host. On Vercel + Railway they are on separate domains, so `migrationApi.ts` must read from the Vite environment:

```typescript
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1/migrations`;
```

Set `VITE_API_URL=https://your-app.railway.app` in Vercel's environment settings dashboard.

### 3. CORS Configuration (WebConfig.java)
Extend your CORS allowed origins to include the Vercel production domain. Inject it as an environment variable so the value never touches source control:

```java
@Bean
public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/api/**")
                .allowedOrigins(
                    "http://localhost:5173",
                    System.getenv().getOrDefault("FRONTEND_URL", "")
                );
        }
    };
}
```

Set `FRONTEND_URL=https://your-app.vercel.app` in Railway's environment settings.

### 4. Add a Dockerfile to `/backend`
Railway can auto-detect Maven, but a multi-stage Dockerfile gives faster builds and critical memory control. The `-Xmx400m` heap cap is mandatory — without it the JVM grabs 1GB+ and Railway's free tier terminates the process.

```dockerfile
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn clean package -DskipTests -q

# Stage 2: Run
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx400m", "-jar", "app.jar"]
```

---

## Deployment Steps (Execute in Order)

### Step 1 — Neon (Do this first — you need the connection string)
1. Sign up at [neon.tech](https://neon.tech)
2. Create project → `schema-forge`
3. Copy the connection string:
   ```
   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Save this — it becomes `DB_URL` in Railway.

### Step 2 — Railway (Backend)
1. Sign up at [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
2. Point it at your repo, set root directory to `/backend`
3. Add environment variables in the Railway dashboard:
   - `DB_URL` = Neon connection string
   - `DB_USER` = Neon username
   - `DB_PASS` = Neon password
   - `FRONTEND_URL` = *(set this after Vercel step below)*
4. Railway builds the Dockerfile. Flyway automatically runs `V1` and `V2` migrations on first boot.
5. Note your Railway public URL (e.g., `https://schema-forge-xxxx.railway.app`)

### Step 3 — Vercel (Frontend)
1. Sign up at [vercel.com](https://vercel.com) → **New Project → Import GitHub repo**
2. Set root directory to `/frontend`
3. Set build command: `npm run build`, output directory: `dist`
4. Add environment variable: `VITE_API_URL` = your Railway URL
5. Deploy → note your Vercel URL (e.g., `https://schema-forge.vercel.app`)

### Step 4 — Loop Back to Railway
Set `FRONTEND_URL` = your Vercel URL in the Railway env vars dashboard.
This closes the CORS loop — the backend now trusts requests from the deployed frontend.

---

## CI/CD — Automated Deploy on Push to `main`

Extend the existing `ci.yml` workflow with deploy steps that only fire on pushes to `main`. Store `RAILWAY_TOKEN` and `VERCEL_TOKEN` as GitHub Actions repository secrets — both platforms issue these tokens from their dashboards.

```yaml
deploy-backend:
  runs-on: ubuntu-latest
  needs: backend-build
  if: github.ref == 'refs/heads/main'
  steps:
    - uses: actions/checkout@v4
    - name: Deploy to Railway
      run: railway up
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

deploy-frontend:
  runs-on: ubuntu-latest
  needs: frontend-build
  if: github.ref == 'refs/heads/main'
  steps:
    - uses: actions/checkout@v4
    - name: Deploy to Vercel
      run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## Free Tier Limits Reference

| Service | Limit | Implications |
| :--- | :--- | :--- |
| Railway | 500 hrs/month, 512 MB RAM | Use `-Xmx400m`; sufficient for demos and stakeholder reviews |
| Neon | 0.5 GB storage, 1 compute unit | Fine for schema metadata — not designed for bulk data workloads |
| Vercel | 100 GB bandwidth/month | Far exceeds any realistic demo load |

---

## Phase 3 Compatibility Note (Live Oracle Extraction)
When Phase 3 is built, no cloud Oracle instance is required. The Live Extraction feature is architecturally designed to consume a JDBC connection string provided directly by the end-user at runtime — pointing at their own local or network Oracle instance. The Railway-hosted backend simply establishes an outbound socket connection using the credentials provided. No Oracle infrastructure is required on Railway's side.
