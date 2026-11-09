# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Installation

```bash
yarn
```

## Local Development

```bash
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Using SSH:

```bash
USE_SSH=true yarn deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

## App links (`/.well-known`)

`static/.well-known/` holds the files that let the FiestaBoard phone apps open
`https://fiestaboard.app/link/*` links (owner action O14). The fallback page those links show
when the app isn't installed lives in [Fiestaboard/link](https://github.com/Fiestaboard/link).

- `apple-app-site-association` (JSON, no extension): iOS Universal Links for
  `<Team ID>.com.fiestaboard.ios.draft`, paths `/link/*` except the `/link/` index.
- `assetlinks.json`: Android App Links (`delegate_permission/common.handle_all_urls`) for
  `com.fiestaboard.android`.

The deploy workflow uploads the Pages artifact with `include-hidden-files: true`; without it,
`actions/upload-pages-artifact` drops `.well-known` and both files 404. GitHub Pages serves the
extensionless `apple-app-site-association` as `application/octet-stream`, which Apple's CDN
accepts; Pages can't set headers.

**Placeholders the owner must fill:**

- `REPLACE_ME_APPLE_TEAM_ID` (in both `appIDs` and `appID`): the 10-character Team ID from
  Apple Developer › Membership details. If the shipping bundle ID isn't
  `com.fiestaboard.ios.draft`, change it too.
- `REPLACE_ME_PLAY_APP_SIGNING_SHA256`: the **App signing key** certificate's SHA-256
  fingerprint from Play Console › your app › Test and release › App integrity › App signing
  (colon-separated, upper case). Add the upload key's fingerprint too if you sideload builds
  signed with it.

`npm test` checks both files' shape (`tests/well-known.test.mjs`).
