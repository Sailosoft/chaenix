This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3090](http://localhost:3090) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


ENV
```yaml
NEXTAUTH_SECRET=replace-with-a-long-random-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me

# OpenAI-compatible chat provider configuration
# Defaults target local Ollama when these are not set.
AI_BASE_URL=http://127.0.0.1:11434/v1
AI_API_KEY=ollama
AI_MODEL=gemma4:31b-cloud

# Supabase Storage file manager (/admin/drive) — server-side service role
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-or-sb_secret-key>
SUPABASE_DB_SCHEMA=chaenix
SUPABASE_STORAGE_BUCKET=drive
```

### Supabase Storage setup (one-time)

1. Apply `db/sql/0001_chaenix_drive.sql` by hand in the shared project's SQL editor. This repo is **not** linked to that project: never run `supabase link` or `supabase db push`. Check that the `chaenix` schema is free before running it.
2. Expose the `chaenix` schema to PostgREST: **Project Settings → API → Exposed schemas**.
3. **Storage → New bucket** → name `drive`, **public = off**. No storage policies are needed; only the server-side service-role client touches it. Raise the bucket's file size limit if the proxied upload path needs more than the project default.
4. Set the env vars above. `SUPABASE_SERVICE_ROLE_KEY` accepts either the legacy `service_role` JWT or the newer `sb_secret_…` key.

Step-by-step guides, including where to find each value in the Supabase dashboard:
[docs/Guides/supabase-dashboard-setup.md](docs/Guides/supabase-dashboard-setup.md) and
[docs/Guides/supabase-env-vars.md](docs/Guides/supabase-env-vars.md).

Notes (v1): uploads are proxied through the route handler, so they are bounded by the host body limit (~4.5 MB on Vercel). Downloads are streamed server-side through a short-lived signed URL. Deletes are soft deletes — items move to the Trash view, where they can be restored or permanently deleted. On Vercel, make sure `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set so the admin session cookie works on preview/prod domains.