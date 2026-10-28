# Admin dashboard

Super admin console for the platform. From here you:

- provision tenants (rental companies);
- edit or upload each tenant's JSON config, including its logo;
- connect each tenant's WhatsApp Business number for its digest;
- suspend or archive tenants.

Only Clerk users with `publicMetadata.platformRole = "super_admin"` can use it.

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind 4 · shadcn/ui · Clerk. All data and rules come from the **backend** repo's `/api/platform`. This app has no business logic of its own.

## Run

The backend must be running (see its README).

```sh
npm install
cp .env.example .env.local   # Clerk keys + PLATFORM_API_URL — see the backend repo's docs/clerk-setup.md
npm run dev                  # http://localhost:3001
```

`npm run lint`, `npm run typecheck`, `npm run build`.

## Netlify

Use `npm run build` as the build command and `.next` as the publish directory. If deploying from a parent repository, set the base directory to `adminDashboard`.

Set the variables from `.env.example` in Netlify's **Project configuration → Environment variables**, using the deployed backend's platform API URL for `PLATFORM_API_URL`. Create `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` without **Contains secret values**; these are public browser configuration. Keep `CLERK_SECRET_KEY` marked as secret.

`netlify.toml` excludes only those two public Clerk variables from secret scanning, including when they were previously marked as secrets in Netlify. All other secret scanning remains enabled. Commit the configuration and trigger a new deploy to apply it.

## How it's put together

| Path | Purpose |
|---|---|
| `src/proxy.ts` | Clerk middleware (Next 16 calls middleware "proxy"). Redirects signed-out users to `/sign-in` and non-super-admins to `/unauthorized` |
| `src/lib/dal.ts` | Data access layer. Every read and Server Action calls `requireSuperAdmin()` before calling the backend, which checks the session again |
| `src/lib/platform-api/` | HTTP client for `/api/platform`; sends the user's Clerk session token |
| `src/lib/contract.ts` | TypeScript types for the backend's responses. The backend owns the schema; keep these in step with it |
| `src/lib/actions/` | Server Actions: create tenant, change status, retry provisioning, validate, publish or restore config, sign a logo upload, set or remove the WhatsApp connection |
| `src/app/(platform)/` | Overview, tenants, create wizard, tenant detail, tenant users, config editor, config history, audit log |
| `src/components/config/` | Config editor: form sections, Monaco raw JSON editor, upload/download, diff and publish dialog |

**Config validation happens on the backend.** The editor sends each change (debounced) and each uploaded file to `POST /api/platform/tenants/:id/config/validate`. It shows the issues and diff that come back, and only enables publishing once the latest draft has been checked. Module labels, templates and the JSON Schema for autocomplete all come from `GET /api/platform/meta`.

**Cache Components.** This Next version prerenders a static shell and streams request-time data in. Anything that reads the session or the URL (`auth()`, `params`, `usePathname()`) has to sit inside a `<Suspense>` boundary; the build fails otherwise.

**Monaco is self-hosted.** `scripts/copy-monaco.mjs` runs before `dev` and `build`. It copies `monaco-editor/min/vs` into `public/monaco/` (gitignored), so the editor never loads code from a CDN.

**Logos go straight to Cloudinary.** The branding section's **Upload logo** asks the backend to sign the upload (a Server Action), posts the file to Cloudinary from the browser, and puts the public URL in the draft. It's live once the config is published.

**WhatsApp connection.** The tenant page's **WhatsApp digest** card stores the tenant's phone number ID, access token and optional message template on the backend, encrypted. The token is never shown again, only its last 4 characters. Without a template, WhatsApp only delivers the digest to recipients who wrote to the number in the last 24 hours. The template's body takes `{{1}}` (the company name) and `{{2}}` (the digest on one line).

**Creating a tenant is real.** The backend creates a Clerk organization, the tenant's database and config v1, and emails the admin an invitation before it responds. If a step fails, the result page and the tenant page show the error on that step, and **Retry provisioning** resumes from there. See the backend's `docs/clerk-setup.md` (step 7).
