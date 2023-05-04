// lint will complain about this, adding '/' to the end works in tests
// given the explicit file name also works
// Can also try --experimental-specifier-resolution
import punycode from 'punycode/punycode.js'

// Following works in prod
// import punycode from 'punycode'
import fs from 'fs'
import { FileBox } from 'file-box'
import { execSync } from 'child_process'
import * as dotenv from 'dotenv'

import {
  Contact,
  Wechaty,
} from 'wechaty'

import { Configuration, OpenAIApi } from 'openai'
import HttpsProxyAgent from 'https-proxy-agent'

const commands = new Map<string, Function>([
  [ 'punyencode', punyencode ],
  [ 'ls', ls ],
  [ 'download', download ],
  [ 'forceRedeem', forceRedeem ],
  [ 'chatgpt', chatgpt ],
  [ 'contact', findContact ],
])

export const config = dotenv.config({ path: '~/.env' }).parsed ?? {}
const configuration = new Configuration({ apiKey: config['CHATGPT'] ?? '' })
const openai = new OpenAIApi(configuration)
const agent = new HttpsProxyAgent('http://rgyzxtz:3128')

async function chatgpt (mybot: Wechaty, args: string[]): Promise<string> {
  // return 'Use http://chatgpt.rgyzxtz.tk'
  const completion = await openai.createCompletion(
    { model: 'text-davinci-003', prompt: args.join(' ') },
    { httpAgent: agent, httpsAgent: agent })
  return completion.data.choices[0].text
}

async function punyencode (mybot: Wechaty, args: string[]): Promise<string> {
  return punycode.encode(args.join(' '))
}

async function findContact (mybot: Wechaty, args: string[]): Promise<Contact|string> {
  const query = args[0]
  let result = await mybot.Contact.find({ name: query })
  if (result) {
    return result
  }
  result = await mybot.Contact.find({ alias: query })
  if (result) {
    return result
  }
  return 'Not found'
}

async function ls (mybot: Wechaty, args: string[]): Promise<string> {
  if (args.length > 0) {
    return fs.readdirSync('__tests__').join('\r\n')
  }
  return fs.readdirSync('upload').join('\r\n')
}

async function download (mybot: Wechaty, file: string): Promise<FileBox> {
  return FileBox.fromFile(`upload/${file}`)
}

export async function forceRedeem (mybot: Wechaty, args: string[]): Promise<string|FileBox> {
  if (args.length > 0) {
    return execSync('python __tests__/test.py').toString()
  }
  const file = execSync('python examples/jsl.py').toString()
  return FileBox.fromFile(`${file}`)
}

export async function runCmd (mybot: Wechaty, msg: string): Promise<string|FileBox|Contact|null> {
  const args = msg.split(' ')
  if (args.length > 0) {
    const cmd = args[0]!.substring(1)
    if (commands.get(cmd)) {
      return commands.get(cmd)!(mybot, args.slice(1))
    } else {
      return `Unknown command: ${cmd}`
    }
  } else {
    return `Bad input: ${msg}`
  }
}
