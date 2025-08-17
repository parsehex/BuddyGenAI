# Unifying BuddyGenAI Versions

## Background

One of the intentions behind BuddyGenAI was to have an application that could introduce people to using AI which they have control and ownership of. I'm often impressed by the kinds of models that I can run on my PC at home + I appreciate interfaces which are purpose-built but still manage to be versatile, so a pillar of my direction with this app has been to support using it in various ways. I'd rather the app meet the user where they are rather than the user needing to meet the app.

For the first iteration, I used embedded software (llama.cpp and others) with an Electron wrapper, which means that you need to run the app and the AI on a single machine. Sometime after that, my setup changed and I wanted to be able to access the app from my laptop, so I threw together a single-page web app (accessible at <https://app.buddygenai.com/>).

As of more recently, my desire is to be able to install BuddyGenAI as a standalone server on my desktop and connect it to AI API(s) running on the same machine. Essentially, I want to use BGAI as my own self-hosted AI frontend.

## The Problem(s)

There are a number of differences and issues between these to-be 3 "form factors" of the app.

- I think the use cases are different even.
  - **Electron:** Everything besides the models is self-contained. You'll use the app from (e.g.) your gaming PC and nowhere else.
  - **SPA:** You don't have a gaming or otherwise powerful PC or don't want to use it, so you just use the hosted web app and hook it up to a service or a local API.
  - **Server (_new/to-do_):** You have a powerful PC to run AI on, but you want to access the same instance from other machines (ideally on the same LAN).
- We use different DBs for the different versions & access them differently.
  - Electron version uses an SQLite DB, with the schema is stored in `/migrations/`, and SQL statements are actually constructed on the client/renderer and sent along with parameters to the main process to run.
    - I did the SQL statements this way to keep as much logic as I could within `/src/`. Though I know that needs to be re-worked, it made converting to an SPA / using Dexie easier.
  - The SPA uses Dexie, with the schema found at `/src/lib/db/schema.ts`.
  - [More info here - Database Info][1]
- Calling the AI / Running inference isn't the same.
  - **SPA** has to make HTTP calls to an API (ignoring projects using WASM/WebGPU).
  - Both **Electron** and **Server** versions could use APIs **or** local inference by calling binaries directly.
  - Separate but related note: This would be a QoL thing, but it would be nice to allow pointing the (Electron and Server) app to your own binaries, so that you can supply your own e.g. `llama-server`.
  - There are UI differences depending on how much we an control the AI that we're using.
    - KoboldCpp now has hot-swappable models via switching configs, so we can add support for that. Still, I think we'd want alternate components for different AI providers.
- There's also much messiness around the `AppSettings.ts` file(s). It's meant to be an interface to access the DB-persisted settings that you can access via the UI.
  - At some point I noticed buggy behavior surrounding boolean and number values being cast unexpectedly when pulling from the DB. I wasn't able to pinpoint the issue and now there are several places with extra checks and conditional operations to guard against this. SQLite only supports storing booleans as 0 or 1, which I don't think helps the situation.
  - As mentioned in [Database Info][1], I think I want to use Dexie for all the app's versions, which should fix these issues.
- Finally, a point that I would explicitly mention is that overall, the app isn't well-designed to handle conditional features (e.g. if you don't hook up image generation, it still presents the option to generate a profile image when creating a Buddy). This would apply to using KoboldCpp with the SPA but also the Electron version since the user still needs to provide a model.

## Future

Eventually I want to explore having the electron version be its own repo, just for the electron-specific parts.

[1]: ./database-info.md
