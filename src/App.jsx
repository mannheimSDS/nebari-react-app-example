import { useEffect, useMemo, useState } from 'react'

// Relative URL ("api/quotes", not "/api/quotes"): Nebari serves the app under /user/NAME/APP/.
const API = 'api/quotes'

const SORTS = {
  author: (a, b) => a.author.localeCompare(b.author),
  topic: (a, b) => a.topic.localeCompare(b.topic) || a.author.localeCompare(b.author),
  shortest: (a, b) => a.text.length - b.text.length,
  longest: (a, b) => b.text.length - a.text.length,
}

function shuffled(list) {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

export default function App() {
  const [quotes, setQuotes] = useState([])
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [topic, setTopic] = useState('all')
  const [sort, setSort] = useState('author')
  const [order, setOrder] = useState(null) // ids in shuffled order, or null
  const [featured, setFeatured] = useState(null)

  useEffect(() => {
    fetch(API)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((rows) => {
        setQuotes(rows)
        setFeatured(pick(rows))
      })
      .catch((e) => setError(`Could not load quotes: ${e.message}`))
  }, [])

  const topics = useMemo(() => ['all', ...new Set(quotes.map((q) => q.topic))].sort(), [quotes])

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    let rows = quotes.filter(
      (q) =>
        (topic === 'all' || q.topic === topic) &&
        (!needle || `${q.text} ${q.author}`.toLowerCase().includes(needle)),
    )
    if (order) {
      const rank = new Map(order.map((id, i) => [id, i]))
      return rows.sort((a, b) => rank.get(a.id) - rank.get(b.id))
    }
    return rows.sort(SORTS[sort])
  }, [quotes, search, topic, sort, order])

  return (
    <main>
      <header>
        <p className="eyebrow">Nebari · React · SQLite</p>
        <h1>Quote board</h1>
        <p className="lede">
          React front end, built with Vite, reading a read-only SQLite database through a tiny Node server.
        </p>
      </header>

      {featured && (
        <section className="featured" key={featured.id}>
          <blockquote>“{featured.text}”</blockquote>
          <p className="by">{featured.author}</p>
          <button onClick={() => setFeatured(pick(quotes.filter((q) => q.id !== featured.id)))}>
            Another random quote
          </button>
        </section>
      )}

      <section className="controls">
        <input
          type="search"
          placeholder="Search quotes or authors"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={order ? 'shuffled' : sort}
          onChange={(e) => {
            setOrder(null)
            setSort(e.target.value)
          }}
        >
          {order && <option value="shuffled">Shuffled</option>}
          <option value="author">Sort by author</option>
          <option value="topic">Sort by topic</option>
          <option value="shortest">Shortest first</option>
          <option value="longest">Longest first</option>
        </select>
        <button onClick={() => setOrder(shuffled(quotes).map((q) => q.id))}>Shuffle</button>
        <button className="ghost" onClick={() => setTopic(pick(topics.filter((t) => t !== 'all' && t !== topic)))}>
          Random topic
        </button>
      </section>

      <nav className="chips">
        {topics.map((t) => (
          <button key={t} className={t === topic ? 'chip on' : 'chip'} onClick={() => setTopic(t)}>
            {t}
          </button>
        ))}
      </nav>

      {error && <p className="error">{error}</p>}
      <p className="count">
        {visible.length} of {quotes.length} quotes
      </p>

      <section className="grid">
        {visible.map((q) => (
          <article key={q.id} className="card" data-topic={q.topic}>
            <span className="tag">{q.topic}</span>
            <p>{q.text}</p>
            <footer>{q.author}</footer>
          </article>
        ))}
      </section>
    </main>
  )
}
