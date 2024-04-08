import fs from 'fs/promises'
import path from 'path'

/** The path to the directory containing the `app.asar` or the root of the project, where the *.cpp project folders are expected to be. */
async function findResourcesPath() {
  let resPath = ''
  let dir = __dirname
  let absPath = path.resolve(dir)
  dir = path.dirname(absPath)
  while (dir !== path.parse(dir).root) {
    const dirs = await fs.readdir(dir)
    if (dirs.includes('resources')) {
      resPath = path.join(dir, 'resources')
      break
    } else if (dirs.includes('.output')) {
      resPath = dir
      break
    }
    dir = path.dirname(dir)
  }
  return resPath
}

type ProjectName = 'llama.cpp' | 'stable-diffusion.cpp' | 'whisper.cpp' // bark.cpp?
type Binaries = {
  'llama.cpp': 'main' | 'server'
  'stable-diffusion.cpp': 'sd'
  'whisper.cpp': 'main' | 'server'
}
type BinaryName<T extends ProjectName> = Binaries[T]
export async function findBinaryPath<T extends ProjectName>(projectName: T, binaryName: BinaryName<T>) {
  let exe = binaryName
  // @ts-ignore
  if (process.platform === 'win32') exe += '.exe'

  let resPath = await findResourcesPath()
  let binPath = path.join(resPath, projectName, exe)
  console.log('binPath', binPath, exe)

  // look for the binary in the following directories relative to the resources path:
  const directories = ['', 'build', 'build/Release', 'build/bin']

  for (let i = 0; i < directories.length; i++) {
    try {
      binPath = path.join(resPath, projectName, directories[i], exe)
      console.log('checking', binPath)
      await fs.access(binPath)
      return binPath
    } catch (error) {}
  }
  try {
    await fs.access(binPath)
    return binPath
  } catch (error) {
    throw new Error(`Binary ${exe} not found for project ${projectName}`)
  }
}
