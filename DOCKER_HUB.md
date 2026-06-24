# Docker Hub Deployment Notes

Docker Hub stores your built app image. It does not replace Supabase. Supabase still handles authentication and database services.

## 1. Prepare Environment Variables

Create `.env.local` for local development:

```txt
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

For Docker Compose, create `.env` with the same values:

```txt
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Do not commit `.env` or `.env.local`.

## 2. Build Locally

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-publishable-key" \
  -t split-payment:latest .
```

Because these variables start with `NEXT_PUBLIC_`, Next.js includes them in the browser bundle at build time. Rebuild the image when these values change.

## 3. Run Locally

```bash
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co" \
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-publishable-key" \
  split-payment:latest
```

Open:

```txt
http://localhost:3000/auth/login
```

## 4. Push To Docker Hub

Log in:

```bash
docker login
```

Tag your image:

```bash
docker tag split-payment:latest your-dockerhub-username/split-payment:latest
```

Push it:

```bash
docker push your-dockerhub-username/split-payment:latest
```

## 5. Pull And Run From Docker Hub

```bash
docker pull your-dockerhub-username/split-payment:latest
```

```bash
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co" \
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-publishable-key" \
  your-dockerhub-username/split-payment:latest
```

## 6. Important Supabase Auth Settings

In Supabase, configure the Site URL and redirect URLs for wherever the Docker image runs.

Local:

```txt
http://localhost:3000
http://localhost:3000/auth/update-password
```

Production example:

```txt
https://your-domain.com
https://your-domain.com/auth/update-password
```

If these URLs are not configured, signup confirmation and password reset links may fail.
