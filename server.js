// Serves the built React app (dist/) and a read-only JSON API from SQLite.
// No packages needed: node:http and node:sqlite ship with Node 22.5+.
//
// Run:  node server.js 3001     (Nebari runs: node server.js {port})
//
// The database is data.db next to this file. The server creates and seeds it
// on first start, then opens it read-only. Visitors come from the open
// internet, so there is no route that writes. Add rows from a terminal:
//   node -e "new (require('node:sqlite').DatabaseSync)('data.db').prepare('insert into quotes (text, author, topic) values (?, ?, ?)').run('Hello', 'Me', 'demo')"

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { statSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { join, extname, normalize } from 'node:path'

const here = import.meta.dirname
const DB = join(here, 'data.db')
const DIST = join(here, 'dist')
const port = Number(process.argv[2] || 3001)

const SEED = [
  ['All models are wrong, but some are useful.', 'George E. P. Box', 'statistics'],
  ['Far better an approximate answer to the right question than an exact answer to the wrong question.', 'John Tukey', 'statistics'],
  ["The best thing about being a statistician is that you get to play in everyone's backyard.", 'John Tukey', 'statistics'],
  ['To consult the statistician after an experiment is finished is often merely to ask him to conduct a post mortem examination.', 'R. A. Fisher', 'statistics'],
  ['No causation without manipulation.', 'Paul Holland', 'causal inference'],
  ['Premature optimization is the root of all evil.', 'Donald Knuth', 'programming'],
  ['Programs must be written for people to read, and only incidentally for machines to execute.', 'Abelson and Sussman', 'programming'],
  ['Debugging is twice as hard as writing the code in the first place.', 'Brian Kernighan', 'programming'],
  ['There are only two hard things in computer science: cache invalidation and naming things.', 'Phil Karlton', 'programming'],
  ['Simple things should be simple, complex things should be possible.', 'Alan Kay', 'programming'],
]

// Create and seed once, then reopen read-only.
const setup = new DatabaseSync(DB)
setup.exec('create table if not exists quotes (id integer primary key, text text not null, author text not null, topic text not null)')
if (setup.prepare('select count(*) as n from quotes').get().n === 0) {
  const insert = setup.prepare('insert into quotes (text, author, topic) values (?, ?, ?)')
  for (const row of SEED) insert.run(...row)
}
setup.close()
const db = new DatabaseSync(DB, { readOnly: true })

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' }

createServer(async (req, res) => {
  if (req.method !== 'GET') {
    res.writeHead(405).end()
    return
  }
  const path = new URL(req.url, 'http://x').pathname

  if (path === '/api/quotes') {
    const rows = db.prepare('select id, text, author, topic from quotes order by id').all()
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(rows))
    return
  }

  // Static files from dist/. normalize() plus the prefix check blocks ../ tricks.
  const file = normalize(join(DIST, path === '/' ? 'index.html' : path))
  if (!file.startsWith(DIST) || !statSync(file, { throwIfNoEntry: false })?.isFile()) {
    res.writeHead(404).end('not found')
    return
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' })
  res.end(await readFile(file))
}).listen(port, '0.0.0.0', () => console.log(`listening on http://localhost:${port}`))
