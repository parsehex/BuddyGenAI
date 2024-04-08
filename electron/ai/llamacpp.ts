import { spawn } from 'child_process'
import axios from 'axios'
import { findBinaryPath } from '../utils/binary-path'

// TODO: expose methods that use the server (and maybe expose listening url) to renderer
// TODO: manage spawned process

let model = ''
if (process.platform === 'win32') {
  model = 'F:/LLaMA/openchat-3.5-1210.Q5_K_M.gguf'
} else {
  model = '/media/user/ML/LLaMA/openchat-3.5-1210.Q5_K_M.gguf'
}

const args = ['--model', model, '--n-gpu-layers', '35']
// or -m and -ngl

async function startServer() {
  const serverPath = await findBinaryPath('llama.cpp', 'server')
  console.log('serverPath', serverPath)

  const command = spawn(serverPath, args, { stdio: 'inherit' })

  command.on('error', (error) => {
    console.error(`LCPP: ${error.message}`)
  })

  command.on('exit', (code, signal) => {
    if (code) console.log(`Process exited with code: ${code}`)
    if (signal) console.log(`Process killed with signal: ${signal}`)
  })

  process.on('exit', () => {
    command.kill()
  })
}

// TODO function to get health (+ types) -- https://github.com/ggerganov/llama.cpp/blob/master/examples/server/README.md#api-endpoints
const defaultEndponit = 'http://localhost:8080'
async function isServerRunning() {
  const endpoint = defaultEndponit + '/health'
  try {
    await axios.get(endpoint)
    return true
  } catch (error) {
    return false
  }
}

;(async () => {
  // TODO dont start server if one is already running

  if (await isServerRunning()) {
    console.log('LLaMA server already running')
  } else {
    // await startServer()
    console.log('LLaMA server started', '(not really)')
  }
})()
