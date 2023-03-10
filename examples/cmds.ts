// lint will complain about this, adding '/' to the end works in tests
// import punycode from 'punycode/'

// Following works in prod
import punycode from 'punycode'
import fs from 'fs'
import { FileBox } from 'file-box'
import { execSync } from 'child_process'
import ChatGPT from 'chatgpt-official'
import * as dotenv from 'dotenv'

const commands = new Map<string, Function>([
  ['punyencode', punyencode],
  ['ls', ls],
  ['download', download],
  ['forceRedeem', forceRedeem],
  ['chatgpt', chatgpt],
])

export const config = dotenv.config({ path: '~/.env' }).parsed ?? {}
const gptBot = new ChatGPT(config['CHATGPT'] ?? '')

async function chatgpt (args: string[]): Promise<string> {
  return gptBot.ask(args.join(' '))
}

async function punyencode (args: string[]): Promise<string> {
  return punycode.encode(args.join(' '))
}

async function ls (args: string[]): Promise<string> {
  if (args.length > 0) {
    return fs.readdirSync('__tests__').join('\r\n')
  }
  return fs.readdirSync('upload').join('\r\n')
}

async function download (file: string): Promise<FileBox> {
  return FileBox.fromFile(`upload/${file}`)
}

export async function forceRedeem (args: string[]): Promise<string|FileBox> {
  if (args.length > 0) {
    return execSync('python __tests__/test.py').toString()
  }
  const file = execSync('python examples/jsl.py').toString()
  return FileBox.fromFile(`${file}`)
}

export async function runCmd (msg: string): Promise<string|FileBox> {
  const args = msg.split(' ')
  if (args.length > 0) {
    const cmd = args[0]!.substring(1)
    if (commands.get(cmd)) {
      return commands.get(cmd)!(args.slice(1))
    } else {
      return `Unknown command: ${cmd}`
    }
  } else {
    return `Bad input: ${msg}`
  }
}
