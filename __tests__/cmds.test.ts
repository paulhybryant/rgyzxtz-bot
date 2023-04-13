import { runCmd } from '../examples/cmds.js'

describe('Test commands', () => {
  test('Unknown command', () => {
    expect(runCmd(null, '#yo')).toBe('Unknown command: yo');
  })

  test('punyencode', () => {
    expect(runCmd(null, '#punyencode 日拱一卒')).toBe('4gqp3kz1pn0c');
  })

  test('ls', () => {
    expect(runCmd(null, '#ls test')).toBe('cmds.test.ts\r\ntest.py');
  })

  test('forceRedeem', () => {
    expect(runCmd(null, '#forceRedeem test')).toBe('foo\n');
  })
});
