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

# Google Drive file manager (/admin/drive) — service account auth
GDRIVE_CLIENT_EMAIL=drive-manager@your-project.iam.gserviceaccount.com
GDRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GDRIVE_FOLDER_ID=your-shared-folder-id
```

### Google Drive setup (one-time)

1. In Google Cloud Console, create a service account and enable the **Google Drive API** for the project. If you see "Google Drive API has not been used in project... or it is disabled", visit `https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=<YOUR_PROJECT_ID>` and click **Enable**. Wait a few minutes for propagation before retrying.
2. Under the service account, create a key (JSON) and copy `client_email` and `private_key` into the env vars above. Keep the `\n` escape sequences in the private key as literal `\n` text.
3. In Google Drive, share your target folder with the service account email as **Editor**.
4. Copy the folder ID from the folder URL (`https://drive.google.com/drive/folders/<FOLDER_ID>`) into `GDRIVE_FOLDER_ID`.

Notes (v1): uploads go directly from the browser to Google (resumable session handoff), so they work around serverless body-size limits. Downloads are proxied and limited by the function `maxDuration` — large downloads may time out on Vercel. Google-native files (Docs/Sheets/Slides) cannot be downloaded. On Vercel, make sure `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set so the admin session cookie works on preview/prod domains.