#!/usr/bin/env -S node --no-warnings --loader ts-node/esm
/**
 * Wechaty - Conversational RPA SDK for Chatbot Makers.
 *  - https://github.com/wechaty/wechaty
 */

import {
  Contact,
  Message,
  Room,
  ScanStatus,
  Wechaty,
  WechatyBuilder,
  log,
} from 'wechaty'

import qrcodeTerminal from 'qrcode-terminal'
// import QRCode from 'qrcode'
import { FileBox } from 'file-box'
import sqlite3 from 'sqlite3'
import path from 'path'
import os from 'os'
import { runCmd, forceRedeem, config } from './cmds.js'
import cron from 'cron'
import * as _ from 'lodash'
import schedule from 'node-schedule'

function onScan (qrcode: string, status: ScanStatus) {
  if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
    const qrcodeImageUrl = [
      'https://wechaty.js.org/qrcode/',
      encodeURIComponent(qrcode),
    ].join('')
    log.info('StarterBot', 'onScan: %s(%s) - %s', ScanStatus[status], status, qrcodeImageUrl)
    qrcodeTerminal.generate(qrcode, { small: true })  // show qrcode on console
  } else {
    log.info('StarterBot', 'onScan: %s(%s)', ScanStatus[status], status)
  }
}

function onLogin (user: Contact) {
  log.info('StarterBot', '%s login', user)
}

function onLogout (user: Contact) {
  log.info('StarterBot', '%s logout', user)
}

async function onMessage (msg: Message) {
  if (msg.talker().name() === '日拱一卒') {
    log.info('Self', msg.text())
    return
  }
  insertMsg.run(msg.talker().name(), msg.to() ? msg.to()!.name() : '', msg.room() ? await msg.room()!.topic() : '', msg.text(), this.Message.Type[msg.type()], '', msg.date().toLocaleString())
  const me = await this.Contact.find({ name: '黄宇' })
  const room = msg.room()
  if (me && room) {
    return handleRoom(this, me, room, msg)
  } else {
    if (msg.type() === this.Message.Type.Attachment) {
      const file = await msg.toFileBox()
      const name = `upload/${file.name}`
      log.info('Save file to: ' + name)
      await file.toFile(name)
    } else {
      log.info('Personal', msg.toString())
      if (msg.type() === this.Message.Type.Text) {
        log.info('Text', msg.text())
        await msg.forward(me)
        if (msg.text().startsWith('#')) {
          const cmdOutput = await runCmd(this, msg.text())
          await msg.say(cmdOutput)
        } else {
          const whitelist = ['黄宇', 'Zhong']
          if (whitelist.includes(msg.talker().name())) {
            const text = msg.text()
            if (text === '?reminders') {
              const scheduled = Object.entries(schedule.scheduledJobs).map((v, k) => v[0]).join('\n')
              log.info(scheduled)
              await msg.say(scheduled)
              return
            }
            if (text.startsWith('remind me') || text.startsWith('提醒我')) {
              let spec
              if (text.includes('every') || text.includes('每')) {
                const query = `extract a cron spec string from "${text}", give me just the spec string, no other words`
                spec = await runCmd(this, `#chatgpt ${query}`)
                log.info(spec)
              } else {
                const now = (new Date()).toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })
                const query = `give me a time string in format like 'Year-Month-Day Hour:Minite:Second' for "${text}", assuming now is "${now}", just the string, no other words`
                const cmdOutput = await runCmd(this, `#chatgpt ${query}`)
                spec = new Date(cmdOutput)
                log.info(spec.toLocaleString())
              }
              const fn = (msg) => {
                const text = msg.text().replace('remind me', '').replace('提醒我', '')
                log.info(`Remind ${msg.talker()}: ${text}`)
                void remind(msg.talker(), text)
                log.info('Reminder sent')
              }
              schedule.scheduleJob(text, spec, fn.bind(null, msg))
              await msg.say(`Reminder set as: ${spec}`)
            } else {
              const cmdOutput = await runCmd(this, `#chatgpt ${msg.text()}`)
              await msg.say(cmdOutput)
            }
          }
        }
      }
    }
  }
}

/*
async function roomQrcodeImage (room: Room) {
  const qrcode = await room.qrCode()
  const qrcodeDataUrl = await QRCode.toDataURL(qrcode)
  const imageFile = FileBox.fromDataURL(qrcodeDataUrl)
  // const imageFile = FileBox.fromQRCode(qrcode)
  return imageFile
}
*/

// handle room messages
async function handleRoom (mybot: Wechaty, me: Contact, room: Room, msg: Message) {
  try {
    const contact = msg.talker()
    const topic = await room.topic()
    if (msg.type() === mybot.Message.Type.RedEnvelope) {
      await me.say(`在"${topic}"里有红包`)
      if (topic.includes('昌乐')) {
        const zhong = await mybot.Contact.find({ name: 'Zhong' })
        if (zhong) {
          await zhong.say(`在"${topic}"里有红包`)
        }
        const laozhongjia = await mybot.Room.find({ topic: '老钟家' })
        if (laozhongjia) {
          await laozhongjia.say(`在"${topic}"里有红包`)
        }
      }
      return
    }
    if (await msg.mentionSelf()) {
      // 直接@我或者@所有人
      await me.say(`${contact.name()}在"${topic}"里@了我：${msg.text()}`)
      return
    }
    const contacts = ['持有封基', '布衣书生', '站在Ju人肩上', '闲大']
    if (contacts.includes(contact.name())) {
      log.info('Contact', contact.name())
      if (msg.type() === mybot.Message.Type.Text) {
        await me.say(`"${contact.name()}"在"${topic}"说：${msg.text()}`)
      } else {
        await me.say(`"${contact.name()}"在"${topic}"发了一条消息`)
        await msg.forward(me)
      }
    } else {
      log.info('Room', '%s: %s', topic, msg.toString())
    }
  } catch (error) {
    log.error('onMessage:', '%s', error)
  }
}

async function onReady () {
  const me = await this.Contact.find({ name: '黄宇' })
  if (!me) {
    await this.say('Fatal: 没有找到自己.')
    process.exit(1)
  }
  await me.say('微信助手就绪')
  // const app = express()
  // app.use(bodyParser.json())
  // const port = 8080 // default port to listen

  // app.post('/', (req: Request, res: Response) => {
  // log.info('Post request: ', req.body.msg)
  // res.send(req.body.msg)
  // me.say(req.body.msg)
  // })

  // app.listen(port, () => {
  // log.info(`onReady: server started at http://localhost:${port}`)
  // })
}

const dbfile = path.join(os.homedir(), '.rgyzxtz.db')
const db = new sqlite3.Database(dbfile)

await db.run('CREATE TABLE IF NOT EXISTS messages ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "talker" VARCHAR(50), "to" VARCHAR(50), "room" VARCHAR(50), "text" TEXT, "type" VARCHAR(20) NOT NULL, "mention" VARCHAR(100), "date" VARCHAR(50) NOT NULL)')
const insertMsg = db.prepare('INSERT INTO messages ("talker","to","room","text","type","mention","date") VALUES (?,?,?,?,?,?,?)')

const bot = WechatyBuilder.build({
  name: 'rgyzxtz',
  puppet: 'wechaty-puppet-padlocal',
  puppetOptions: {
    token: config['WECHATY_PADLOCAL'] ?? '',
  },
  /**
   * How to set Wechaty Puppet Provider:
   *
   *  1. Specify a `puppet` option when instantiating Wechaty. (like `{ puppet: 'wechaty-puppet-whatsapp' }`, see below)
   *  1. Set the `WECHATY_PUPPET` environment variable to the puppet NPM module name. (like `wechaty-puppet-whatsapp`)
   *
   * You can use the following providers locally:
   *  - wechaty-puppet-wechat (web protocol, no token required)
   *  - wechaty-puppet-whatsapp (web protocol, no token required)
   *  - wechaty-puppet-padlocal (pad protocol, token required)
   *  - etc. see: <https://wechaty.js.org/docs/puppet-providers/>
   */
  // puppet: 'wechaty-puppet-whatsapp'

  /**
   * You can use wechaty puppet provider 'wechaty-puppet-service'
   *   which can connect to remote Wechaty Puppet Services
   *   for using more powerful protocol.
   * Learn more about services (and TOKEN) from https://wechaty.js.org/docs/puppet-services/
   */
  // puppet: 'wechaty-puppet-service'
  // puppetOptions: {
  //   token: 'xxx',
  // }
})

bot.on('scan', onScan)
bot.on('login', onLogin)
bot.on('logout', onLogout)
bot.on('message', onMessage)
bot.on('ready', onReady)

bot.start()
  .then(() => log.info('StarterBot', 'Starter Bot Started.'))
  .catch(e => log.error('StarterBot', e))

async function jsl () {
  const me = await bot.Contact.find({ name: '黄宇' })
  const now = new Date()
  await me.say(await forceRedeem(bot, []))
}

// TODO: Use node-schedule to replace this
// Monday to Friday at 9:00AM and 16:00PM
const cronjob = new cron.CronJob('01 00 9,16 * * 1-5', () => { void jsl() }, null, true, 'Asia/Shanghai')

async function remind (who: Contact, what: string) {
  await who.say(what)
}
