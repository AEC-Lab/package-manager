# Package Manager
*an AEC standard for tool deployment and management*

## Production Build
[![CircleCI](https://circleci.com/gh/AEC-Lab/package-manager/tree/master.svg?style=svg&circle-token=f5e6bedaa0c0dc652b1672d074e38090371780a5)](https://circleci.com/gh/AEC-Lab/package-manager)

## Overview
*important files*
```
├── .circleci               # configuration for automatic testing, build, and deployment 
├── .vscode                 # text editor settings
├── build                   # build assets (icon, etc.)
├── functions               # API, backend database management
│   ├── src                 # typescript source files
│   └── package.json        # necessary packages for API
├── src                     # source files for electron application
│   ├── components          # reusable Vue components
│   ├── integrations        # third-party integrations (firebase, etc.)
│   ├── plugins             # Vuetify configuration (colors, themes, etc.)
│   ├── store               # application state
│   ├── views               # container views used with routing
│   ├── router              # routing configuration
│   ├── App.vue             # entrance to application
│   └── background.ts       # handles electron's backend event handling (application open, close, etc.)
├── tests                   # end to end and unit tests
```

## Project Setup
*you will need a .env file in your root directory with the necessary environment variables*

#### 1. Install Packages
```
yarn setup
```

#### 2. Serve Application
```
yarn serve
```
## Deployment
*Package Manager uses Circle CI to automatically test, build, and release new versions on any commit to the master branch.*

## Testing

#### Unit
```
yarn test:unit
```

#### End To End
```
yarn test:e2e
```

## Resources
[Circle Ci](https://app.circleci.com/pipelines/github/AEC-Lab/package-manager)
[Firebase](https://console.firebase.google.com/u/0/project/package-manager-development/overview)
[GitHub Applications](https://github.com/organizations/AEC-Lab/settings/installations)