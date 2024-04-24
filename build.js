// eslint-disable-next-line @typescript-eslint/no-var-requires
const builder = require('electron-builder')
const Platform = builder.Platform




const platform = 'WINDOWS'
// const platform = 'LINUX'
// const platform = 'MAC'

/**
 * @type {import('electron-builder').Configuration}
 */
const options = {
  appId: 'com.buddygenai',
  productName: 'BuddyGenAI',

  // "store" | "normal" | "maximum" - For testing builds, use 'store' to reduce build time significantly.
  compression: 'maximum',
  removePackageScripts: true,

  nodeGypRebuild: false,
  buildDependenciesFromSource: false,

  directories: {
    output: 'electron-dist',

    app: '.output',
  },
  extraResources: [
    './llama.cpp/build/bin/**/main*',
    './llama.cpp/build/bin/**/server*',
    './stable-diffusion.cpp/build/bin/**/*',
    './whisper.cpp/**/main*',
    './whisper.cpp/**/server*',
    './migrations/**/*',
  ],

  win: {
    // eslint-disable-next-line no-template-curly-in-string
    artifactName: '${productName}-Setup-${version}.${ext}',
    target: [
      {
        target: 'nsis',
        arch: ['x64']
        // arch: ['x64', 'ia32']
      }
    ]
  },
  nsis: {
    deleteAppDataOnUninstall: true
  },
  mac: {
    category: 'public.app-category.entertainment',
    hardenedRuntime: false,
    gatekeeperAssess: false,
    target: [
      {
        target: 'default',
        arch: ['x64', 'arm64']
      }
    ]
  },
  linux: {
    maintainer: 'Your Name',
    desktop: {
      StartupNotify: 'false',
      Encoding: 'UTF-8',
      MimeType: 'x-scheme-handler/deeplink'
    },
    target: ['dir']
    // target: ['AppImage']
    // target: ['AppImage', 'rpm', 'deb']
  }
}

const fs = require('fs-extra')

let source = './package.json'
let dest = './.output/package.json'
fs.copyFileSync(source, dest)

// TODO how can we install deps programmatically?
source = './node_modules'
dest = './.output/node_modules'
fs.copySync(source, dest)

builder
  .build({
    targets: Platform[platform].createTarget(),
    config: options
  })
  .then((result) => {
    console.log('----------------------------')
    console.log('Platform:', platform)
    console.log('Output:', JSON.stringify(result, null, 2))
  })
