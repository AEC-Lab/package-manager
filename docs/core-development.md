[Go to Main Page](README.md)

# Core Development

Contribute to core product features and functionality.

## Overview

Package Manager is a desktop application bundled and deployed with [Electron](https://www.electronjs.org/). The front-end renderer process (browser window) serves a [Vue](https://vuejs.org/) application, supported by and connected to [Firebase](https://firebase.google.com/) back-end services. Front- and back-end code is written in TypeScript.

#### Vue Application Features

- **Vuex** for global state management
- **Vue** Router for route handling
- **Vuetify** for component styling

#### Firebase Services

- **Authentication** for sign-in method management and access
- **Firestore** as primary database to manage metadata for packages, authors, and users
- **Functions** for API endpoints and background events processing

#### Integrations

Third-party platforms closely integrated with core app functionality:

- **GitHub**
  - GitHub App (development and production versions) events trigger a webhook delivering a payload to a Firebase Cloud Functions API endpoint for processing
  - GitHub API used in back-end and front-end to read organization admins, repository releases and metadata, fetch release assets, etc.

Additional development and hosting platforms (e.g. Azure DevOps, static URL storage) may be integrated in future versions.

## Project directory structure and important files

```
├── .circleci               # configuration for automatic testing, build, and deployment
├── .vscode                 # text editor settings
├── build                   # build assets (icon, etc.)
├── functions               # API, backend database management
│   ├── src                 # typescript source files
│   │   ├── callables       # HTTPS callable functions
│   │   ├── config          # Firebase app admin config
│   │   ├── controllers     # HTTPS route functions
│   │   ├── fb-event-tri... # functions triggered by Firebase activity
│   │   ├── routes          # HTTPS route definitions
│   │   ├── scheduled       # Cron-job (scheduled) functions
│   │   ├── utils           # Utility (helper) functions
│   │   └── index.ts        # entry point for cloud function definitions
│   └── package.json        # necessary packages for API
├── src                     # source files for electron application
│   ├── components          # reusable Vue components
│   ├── integrations        # third-party integrations (Firebase, etc.)
│   ├── plugins             # Vuetify configuration (colors, themes, etc.)
│   ├── store               # application state
│   ├── views               # container views used with routing
│   ├── router              # routing configuration
│   ├── utils               # utility functions used throughout components
│   ├── App.vue             # entrance to Vue application
│   ├── main.ts             # entrance to renderer (browser) process
│   └── background.ts       # handles Electron's backend event handling (application open, close, etc.)
├── tests                   # end to end and unit tests
```

## Development + Production Environments

Separate environments are maintained for development and production, including distinct Firebase projects and GitHub Apps. Local development (including the `.env` specified under Project Setup) points to the development version of each of these. A Circle CI pipeline is configured with production environment variables and manages the deployment of app releases.

Current production build status:

[![CircleCI](https://circleci.com/gh/voyansi/package-manager/tree/master.svg?style=svg&circle-token=f5e6bedaa0c0dc652b1672d074e38090371780a5)](https://circleci.com/gh/voyansi/package-manager)

## Git Workflow

The latest development features will be consolidated in the `dev` branch. Repository admins will periodically issue new releases by merging `dev` into `master`.

To contribute changes, create a new branch from `dev`. **Please do not work directly on the `dev` or `master` branches.**

#### Branch Naming

For new features: `feature-<feature name>`, e.g. `feature-update-user-schema`

for bug fixes: `fix-<bug name>`, e.g. `fix-duplicate-login-credentials`

#### Pull Requests

All PRs are validated for linting and TypeScript errors by the Circle CI pipeline. Make sure to fix any warnings/errors you see in the development server console before submitting a pull request. PRs that fail the CI check cannot be approved until they pass.

When creating/submitting a PR, be sure to:

1. Give the PR a helpful name, and describe the changes made and the reasons for them
2. Reference any issues that were resolved using the `#` tag
3. Request a review from a repository admin

## Project Setup

Be sure you have **Yarn** (version 1) and the **Firebase CLI** installed globally.

_You will need a .env file in your root directory with the following environment variables_:

```
VUE_APP_APIKEY="XXXXX..."
VUE_APP_AUTHDOMAIN="your-project-name.firebaseapp.com"
VUE_APP_DATABASEURL="https://your-project-name.firebaseio.com"
VUE_APP_PROJECTID="your-project-name"
VUE_APP_STORAGEBUCKET="your-project-name.appspot.com"
VUE_APP_MESSAGINGSENDERID="XXXXX..."
VUE_APP_APPID="XXXXX..."
VUE_APP_MEASUREMENTID="XXXXX..."
VUE_APP_GOOGLECLIENTID="XXXXX....apps.googleusercontent.com"
VUE_APP_GOOGLECLIENTSECRET="XXXXX..."
VUE_APP_GITHUBCLIENTID="XXXXX..."
VUE_APP_GITHUBCLIENTSECRET="XXXXX..."
VUE_APP_GITHUBAPPLICATIONID="XXXXX..."
VUE_APP_GITHUBAPPLICATIONKEY="XXXXX..."
VUE_APP_GITHUBINSTALLATIONID="XXXXX..."
VUE_APP_API="https://your-region-your-project-name.cloudfunctions.net"
GH_TOKEN="XXXXX..."
FIREBASE_TOKEN="XXXXX..."
```

#### 1. Install Packages

```
yarn setup
```

#### 2. Serve Application

```
yarn serve
```

#### 3. Deploy Firebase Functions (development) Updates

Some cloud functions (e.g. those triggered by the GitHub App webhook deliveries) cannot be emulated, so they can be deployed to the development Firebase project using the Firebase CLI:

```
firebase deploy --only functions:someFunctionName
```

Please avoid deploying all functions at once unless you need to andare sure no one else is working on another function.

## Deployment

_Package Manager uses Circle CI to automatically test, build, and release new versions on any commit to the master branch._

## Testing

#### Unit

```
yarn test:unit
```

#### End To End

```
yarn test:e2e
```

#### Firebase

In separate terminals:

```
yarn emulate
```

```
yarn test:firebase
```

## Resources

[Circle Ci](https://app.circleci.com/pipelines/github/voyansi/package-manager)

[Firebase](https://console.firebase.google.com/u/0/project/package-manager-development/overview)

[GitHub Applications](https://github.com/organizations/voyansi/settings/installations)
