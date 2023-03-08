import { runCmd } from '../examples/cmds.js'

describe('Test commands', () => {
  test('Unknown command', () => {
    expect(runCmd('#yo')).toBe('Unknown command: yo');
  })

  test('punyencode', () => {
    expect(runCmd('#punyencode 日拱一卒')).toBe('4gqp3kz1pn0c');
  })

  test('ls', () => {
    expect(runCmd('#ls test')).toBe('cmds.test.ts\r\ntest.py');
  })

  test('forceRedeem', () => {
    expect(runCmd('#forceRedeem test')).toBe('foo\n');
  })

  test('runTs', () => {
    expect(runCmd('#runTs 2+2')).toBe('4');
  })
});
