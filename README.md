# fiestaboard.github.io

The GitHub Pages site for the **Fiestaboard** organization, hosted at <https://fiestaboard.github.io>.

## Publishing docs from another repo

There are two common approaches:

### Option A – Deploy directly to this repo (recommended)

In your source repo, add a GitHub Actions workflow that builds the docs and pushes the output to this repo (e.g., into a `docs/` subdirectory). The docs will then be available at `https://fiestaboard.github.io/docs/`.

### Option B – Use a project-level GitHub Pages site

Enable GitHub Pages on the source repo itself. The docs will be served at `https://fiestaboard.github.io/<repo-name>/`, and you can link to them from this landing page.