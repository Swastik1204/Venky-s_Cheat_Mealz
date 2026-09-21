// Minimal SMTP sink for tests: accepts any AUTH, records each message's raw headers.
import net from 'node:net'
export function startSink() {
  const messages = []
  return new Promise((resolve) => {
    const server = net.createServer((s) => {
      let buf = '', data = false, body = ''
      const w = (l) => s.write(l + '\r\n'); w('220 sink')
      s.on('data', (c) => { buf += c; let i
        while ((i = buf.indexOf('\r\n')) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 2)
          if (data) { if (l === '.') { data = false; messages.push(body); body = ''; w('250 OK') } else body += l + '\n'; continue }
          const u = l.toUpperCase()
          if (u.startsWith('EHLO')) s.write('250-sink\r\n250 AUTH PLAIN\r\n')
          else if (u.startsWith('AUTH')) w('235 ok')
          else if (u === 'DATA') { data = true; w('354 go') }
          else if (u === 'QUIT') { w('221 bye'); s.end() }
          else w('250 OK') } })
    })
    server.listen(0, '127.0.0.1', () => resolve({ server, messages, port: server.address().port }))
  })
}
