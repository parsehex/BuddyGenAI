# BuddyGenAI Dev Docs

This is the first installment of me documenting how this project is structured and works so that other developers can work on it.

> [!NOTE] I haven't actively worked with this codebase in a while, so I'm partially writing this to strengthen my own understanding of things.

## Other Pages

- [Database Info](./database-info.md)
- [Unifying BuddyGenAI Versions](./unifying-versions.md)

## Source Code / File Structure

This project has the following in terms of files and directories, starting at the root:

- `/.github/workflows/deploy.yml`: Builds and deploys new versions of the web app to GitHub Pages.
- `/assets/`: Static folder from which resources can be referenced with a URL such as `/assets/logo.png`.
- `/build/`: Directory used for Electron-Builder files.
  - `icon.{ico,png}`: The icon to be shown for this application in the Electron version.
  - `license.txt`: Shown for the user to accept when installing the Electron version.
- `/docs/`: The source for this docs site, made with Vitepress (**_to-do_**).
- `/electron/`: Source for the Electron version's backend / main process.
  - `background.ts`: Entrypoint for the Main process.
  - `dynamicRenderer.ts`: Module which handles loading the web app in the Renderer window.
- `/licenses/`: Directory containing LICENSE text files from the projects that we use.
- `/migrations/`: SQL files used to construct a fresh SQLite database (for use with Electron version).
- `/public/`
- `/scripts/`
- `/src/`: Source code for web app.
- `/app.vue`: The Vue entrypoint for the app.
- `/build.js`: Pain JS script to build Electron version.
- `/index.{html,ts}`: HTML & JS (compiled) entrypoints for the web app.
- `/typed-router.d.ts`: File defining the file-based routes, generated and managed by [unplugin-vue-router](https://github.com/posva/unplugin-vue-router) during compilation, should be committed to the git repo.

## Notes

- This is a link to the latest commit before I started removing unused code: <https://github.com/parsehex/BuddyGenAI/tree/a35ce00bcb885b9cd026e55e85fad5b36976e4ef>
