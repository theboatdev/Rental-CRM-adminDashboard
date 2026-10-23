# Admin dashboard

Super admin console for the platform. From here you:

- provision tenants (rental companies);
- edit or upload each tenant's JSON config;
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

## How it's put together

| Path | Purpose |
|---|---|
| `src/proxy.ts` | Clerk middleware (Next 16 calls middleware "proxy"). Redirects signed-out users to `/sign-in` and non-super-admins to `/unauthorized` |
| `src/lib/dal.ts` | Data access layer. Every read and Server Action calls `requireSuperAdmin()` before calling the backend, which checks the session again |
| `src/lib/platform-api/` | HTTP client for `/api/platform`; sends the user's Clerk session token |
| `src/lib/contract.ts` | TypeScript types for the backend's responses. The backend owns the schema; keep these in step with it |
| `src/lib/actions/` | Server Actions: create tenant, change status, retry provisioning, validate, publish or restore config |
| `src/app/(platform)/` | Overview, tenants, create wizard, tenant detail, config editor, config history, audit log |
| `src/components/config/` | Config editor: form sections, Monaco raw JSON editor, upload/download, diff and publish dialog |

**Config validation happens on the backend.** The editor sends each change (debounced) and each uploaded file to `POST /api/platform/tenants/:id/config/validate`. It shows the issues and diff that come back, and only enables publishing once the latest draft has been checked. Module labels, templates and the JSON Schema for autocomplete all come from `GET /api/platform/meta`.

**Cache Components.** This Next version prerenders a static shell and streams request-time data in. Anything that reads the session or the URL (`auth()`, `params`, `usePathname()`) has to sit inside a `<Suspense>` boundary; the build fails otherwise.

**Monaco is self-hosted.** `scripts/copy-monaco.mjs` runs before `dev` and `build`. It copies `monaco-editor/min/vs` into `public/monaco/` (gitignored), so the editor never loads code from a CDN.

**Creating a tenant is real.** The backend creates a Clerk organization, the tenant's database and config v1, and emails the admin an invitation before it responds. If a step fails, the result page and the tenant page show the error on that step, and **Retry provisioning** resumes from there. See the backend's `docs/clerk-setup.md` (step 7).
