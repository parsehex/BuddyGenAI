// eslint-disable-next-line @typescript-eslint/no-var-requires
const builder = require('electron-builder')
const Platform = builder.Platform

/**
 * @type {import('electron-builder').Configuration}
 */
const options = {
  appId: 'com.buddygenai',
  productName: 'buddygenai',
  // protocols: {
  // name: 'Your deeplink',
  // - Don't forget to set `MimeType: "x-scheme-handler/deeplink"` for `linux.desktop` entry!
  // schemes: ['deeplink']
  // },
  // - Electron auto-updater config
  // publish: [
  //   {
  //     provider: 'github',
  //     owner: 'eternalc0der',
  //     repo: 'electron-nuxt3',
  //     releaseType: 'release'
  //   }
  // ],

  // "store" | "normal" | "maximum" - For testing builds, use 'store' to reduce build time significantly.
  compression: 'maximum',
  removePackageScripts: true,

  nodeGypRebuild: false,
  buildDependenciesFromSource: false,

  directories: {
    output: 'electron-dist'
  },
  extraResources: [
    './llama.cpp/build/bin/**/main*',
    './llama.cpp/build/bin/**/server*',
    './stable-diffusion.cpp/build/bin/**/*',
    './whisper.cpp/**/main*',
    './whisper.cpp/**/server*',
    './.output/server/**/*',
    './.output/public/**/*',
    './server/database/migrations/**/*',
  ],
  // asar: false,

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
      MimeType: 'x-scheme-handler/deeplink',
      Icon: './assets/icon-256x.png'
    },
    target: ['dir']
    // target: ['AppImage']
    // target: ['AppImage', 'rpm', 'deb']
  }
}

 // "MAC" | "LINUX" | "WINDOWS"
// const platform = 'WINDOWS'
const platform = 'LINUX'
// const platform = 'MAC'

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
