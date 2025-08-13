# BuddyGenAI Database Info

This is meant to explain how BGAI uses and handles a database across its versions.

## Electron version

> `main` branch
>
> Code found at `/migrations/*`, `/electron/modules/db.ts`, `/src/lib/sql.ts` and `/src/lib/api/*`.

- uses SQLite via [better-sqlite3](https://www.npmjs.com/package/better-sqlite3)
- Schema @ `/migrations/*.sql`
- IPC methods are exposed (in `/electron/modules/db.ts`) and used (in `/src/composables/useElectron.ts`) to run SQL (parameterized) queries constructed by the renderer process.
- Helper methods in `/src/lib/sql.ts` are used in `/src/lib/api/*` files to avoid writing statements directly.

## Single Page App version

> `spa-version` branch
>
> Code found at `/src/lib/db/schema.ts`, `/src/lib/sql.ts` and `/src/lib/api/*`.

- uses IndexedDB via [Dexie.js](https://dexie.org/)
- Schema @ `/src/lib/db/schema.ts`
- DB is queried in `/src/lib/api/*` files, with rewritten helper methods in `/src/lib/sql.ts` to construct equivalent Dexie statements/queries from the same arguments.
- The `useElectron` methods are modified to query Dexie directly and return the results.

## Eventual Goal

After some thinking, I think what I want to do overall is use Dexie for all versions and simply have different behavior for different versions:

- **SPA** remains the same.
- **Electron** version would use the same code as the SPA, and would save/load to file(s) when data changes and on app start.
- **Server** version could maintain a single (or multiple) set of DB files which would be used to hydrate a client's IndexedDB on load. I'm thinking that there would be controls for syncing to the server, essentially allowing you to use the app in SPA mode despite connecting to a Server instance.
