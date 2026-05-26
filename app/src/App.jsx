import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import {
  BarChart3,
  Check,
  ChevronDown,
  Gamepad2,
  Grid2X2,
  Home,
  List,
  LogOut,
  Plus,
  Save,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import './App.css'
import {
  PLATFORMS,
  RAWG_KEY,
  STATUS_LABELS,
  STATUS_OPTIONS,
  TAG_LABELS,
  TAGS,
  findKnownGame,
  getFallbackIcon,
  mapRawgGenres,
  mapRawgPlatform,
  starText,
} from './data/catalog'
import { auth, db, gamesCollection, googleProvider } from './lib/firebase'

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [gamesLoading, setGamesLoading] = useState(false)
  const [games, setGames] = useState([])
  const [screen, setScreen] = useState('home')
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('הכל')
  const [tagFilters, setTagFilters] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('list')
  const [addOpen, setAddOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setGamesLoading(true)
      setUser(currentUser)
      setAuthLoading(false)
      if (!currentUser) {
        setGames([])
        setGamesLoading(false)
      }
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!user) return undefined

    const gamesQuery = query(collection(db, gamesCollection), where('userId', '==', user.uid))
    const unsubscribe = onSnapshot(
      gamesQuery,
      (snapshot) => {
        const nextGames = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        nextGames.sort((a, b) => a.name.localeCompare(b.name, 'he'))
        setGames(nextGames)
        setGamesLoading(false)
      },
      (error) => {
        console.error(error)
        setGamesLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  const filteredGames = useMemo(() => {
    const q = search.trim().toLowerCase()
    return games.filter((game) => {
      const bySearch =
        !q ||
        game.name?.toLowerCase().includes(q) ||
        game.dev?.toLowerCase().includes(q)
      const byPlatform = platformFilter === 'הכל' || game.platform === platformFilter
      const byTags =
        tagFilters.length === 0 || tagFilters.some((tag) => game.tags?.includes(tag))
      const byStatus = statusFilter === 'all' || game.status === statusFilter
      return bySearch && byPlatform && byTags && byStatus
    })
  }, [games, platformFilter, search, statusFilter, tagFilters])

  const selectedGame = useMemo(
    () => games.find((game) => game.id === selectedId) || null,
    [games, selectedId],
  )

  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      alert(`שגיאה בהתחברות: ${error.message}`)
    }
  }

  const logout = async () => {
    if (confirm('להתנתק?')) await signOut(auth)
  }

  const saveNewGame = async (game) => {
    await addDoc(collection(db, gamesCollection), {
      ...game,
      userId: user.uid,
      createdAt: Date.now(),
      stars: 0,
      note: '',
    })
    showToast('נוסף לקטלוג')
  }

  const saveGame = async (gameId, data) => {
    await updateDoc(doc(db, gamesCollection, gameId), data)
    setSelectedId(null)
    showToast('נשמר')
  }

  const removeGame = async (gameId) => {
    if (!confirm('למחוק מהקטלוג?')) return
    await deleteDoc(doc(db, gamesCollection, gameId))
    setSelectedId(null)
    showToast('נמחק')
  }

  if (authLoading || gamesLoading) {
    return <Splash />
  }

  if (!user) {
    return <LoginScreen onLogin={login} />
  }

  return (
    <main className="app-shell">
      {screen === 'home' ? (
        <HomeScreen
          games={games}
          filteredGames={filteredGames}
          onLogout={logout}
          onOpenAdd={() => setAddOpen(true)}
          onOpenGame={setSelectedId}
          platformFilter={platformFilter}
          search={search}
          setPlatformFilter={setPlatformFilter}
          setSearch={setSearch}
          setStatusFilter={setStatusFilter}
          setTagFilters={setTagFilters}
          setViewMode={setViewMode}
          statusFilter={statusFilter}
          tagFilters={tagFilters}
          user={user}
          viewMode={viewMode}
        />
      ) : (
        <StatsScreen games={games} onOpenGame={setSelectedId} />
      )}

      <BottomNav screen={screen} setScreen={setScreen} />

      {addOpen ? (
        <AddGameSheet onClose={() => setAddOpen(false)} onSave={saveNewGame} />
      ) : null}

      {selectedGame ? (
        <GameSheet
          key={selectedGame.id}
          game={selectedGame}
          onClose={() => setSelectedId(null)}
          onDelete={removeGame}
          onSave={saveGame}
        />
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </main>
  )
}

function Splash() {
  return (
    <main className="splash">
      <Logo size="large" />
      <div className="loading-dots" aria-label="טוען">
        <span />
        <span />
        <span />
      </div>
    </main>
  )
}

function LoginScreen({ onLogin }) {
  return (
    <main className="login-screen">
      <img className="login-logo-img" src="/egz.png" alt="" />
      <Logo size="large" />
      <p>הקטלוג האישי שלך</p>
      <button className="google-btn" type="button" onClick={onLogin}>
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          width="22"
          height="22"
          alt=""
        />
        התחבר עם Google
      </button>
    </main>
  )
}

function HomeScreen({
  games,
  filteredGames,
  onLogout,
  onOpenAdd,
  onOpenGame,
  platformFilter,
  search,
  setPlatformFilter,
  setSearch,
  setStatusFilter,
  setTagFilters,
  setViewMode,
  statusFilter,
  tagFilters,
  user,
  viewMode,
}) {
  const owned = games.filter((game) => game.status === 'own' || game.status === 'done').length
  const want = games.filter((game) => game.status === 'want').length
  const firstName = user.displayName?.split(' ')[0] || ''

  return (
    <section className="screen">
      <header className="topbar">
        <div className="brand-row">
          <img className="brand-icon" src="/egz.png" alt="" />
          <div>
            <Logo />
            <p className="brand-sub">
              {owned} בבעלותי · {want} ברשימת רצונות{firstName ? ` · ${firstName}` : ''}
            </p>
          </div>
        </div>
        <button className="icon-btn" type="button" onClick={onLogout} title="יציאה">
          <LogOut size={20} />
        </button>
      </header>

      <div className="search-box">
        <Search size={18} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="חפש משחק..."
          autoComplete="off"
          spellCheck="false"
        />
        {search ? (
          <button className="plain-icon" type="button" onClick={() => setSearch('')} title="נקה">
            <X size={17} />
          </button>
        ) : null}
      </div>

      <ChipRow>
        {['הכל', ...PLATFORMS].map((platform) => (
          <button
            key={platform}
            className={platformFilter === platform ? 'chip active' : 'chip'}
            type="button"
            onClick={() => setPlatformFilter(platform)}
          >
            {platform}
          </button>
        ))}
      </ChipRow>

      <ChipRow>
        {TAGS.map((tag) => {
          const active = tagFilters.includes(tag)
          return (
            <button
              key={tag}
              className={active ? 'chip active' : 'chip'}
              type="button"
              onClick={() =>
                setTagFilters((current) =>
                  active ? current.filter((item) => item !== tag) : [...current, tag],
                )
              }
            >
              {TAG_LABELS[tag]}
            </button>
          )
        })}
      </ChipRow>

      <ChipRow>
        <button
          className={statusFilter === 'all' ? 'chip active' : 'chip'}
          type="button"
          onClick={() => setStatusFilter('all')}
        >
          הכל
        </button>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.value}
            className={statusFilter === status.value ? 'chip active' : 'chip'}
            type="button"
            onClick={() => setStatusFilter(status.value)}
          >
            {status.label}
          </button>
        ))}
      </ChipRow>

      <div className="toolbar">
        <span>{filteredGames.length} משחקים</span>
        <div className="toolbar-actions">
          <div className="segmented" aria-label="תצוגה">
            <button
              className={viewMode === 'list' ? 'active' : ''}
              type="button"
              onClick={() => setViewMode('list')}
              title="רשימה"
            >
              <List size={18} />
            </button>
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              type="button"
              onClick={() => setViewMode('grid')}
              title="גריד"
            >
              <Grid2X2 size={18} />
            </button>
          </div>
          <button className="add-btn" type="button" onClick={onOpenAdd} title="הוסף משחק">
            <Plus size={22} />
          </button>
        </div>
      </div>

      {filteredGames.length ? (
        <div className={viewMode === 'grid' ? 'games-grid' : 'games-list'}>
          {filteredGames.map((game) =>
            viewMode === 'grid' ? (
              <GameCard key={game.id} game={game} onOpen={onOpenGame} />
            ) : (
              <GameRow key={game.id} game={game} onOpen={onOpenGame} />
            ),
          )}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  )
}

function StatsScreen({ games, onOpenGame }) {
  const owned = games.filter((game) => game.status === 'own' || game.status === 'done')
  const want = games.filter((game) => game.status === 'want')
  const done = games.filter((game) => game.status === 'done')
  const rated = games.filter((game) => game.stars > 0)
  const spent = owned.reduce((sum, game) => sum + (Number(game.price) || 0), 0)
  const average = rated.length
    ? Math.round((rated.reduce((sum, game) => sum + game.stars, 0) / rated.length) * 10) / 10
    : 0
  const maxPlatform = Math.max(...PLATFORMS.map((platform) => games.filter((game) => game.platform === platform).length), 1)
  const topRated = [...rated].sort((a, b) => b.stars - a.stars).slice(0, 3)

  return (
    <section className="screen">
      <header className="topbar compact">
        <div className="brand-row">
          <img className="brand-icon" src="/egz.png" alt="" />
          <Logo />
        </div>
      </header>

      <div className="stats-stack">
        <section className="panel">
          <h2>סיכום כללי</h2>
          <div className="stat-grid">
            <StatCard value={owned.length} label="בבעלותי" />
            <StatCard value={done.length} label="סיימתי לשחק" />
            <StatCard value={want.length} label="רשימת רצונות" />
            <StatCard value={`₪${spent.toLocaleString('he-IL')}`} label="סה״כ הוצאות" />
            <StatCard value={average ? `${average} ★` : '—'} label="ממוצע דירוג" wide />
          </div>
        </section>

        <section className="panel">
          <h2>לפי קונסולה</h2>
          <div className="bars">
            {PLATFORMS.map((platform) => {
              const count = games.filter((game) => game.platform === platform).length
              return (
                <div className="bar-row" key={platform}>
                  <span>{platform}</span>
                  <div className="bar-track">
                    <div style={{ width: `${Math.round((count / maxPlatform) * 100)}%` }} />
                  </div>
                  <strong>{count}</strong>
                </div>
              )
            })}
          </div>
        </section>

        {topRated.length ? (
          <section className="panel">
            <h2>הדירוגים הגבוהים שלי</h2>
            <div className="top-list">
              {topRated.map((game) => (
                <button className="top-row" key={game.id} type="button" onClick={() => onOpenGame(game.id)}>
                  <GameThumb game={game} compact />
                  <span>
                    <strong>{game.name}</strong>
                    <small>{starText(game.stars)}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  )
}

function AddGameSheet({ onClose, onSave }) {
  const [form, setForm] = useState(createEmptyForm)
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const name = form.name.trim()
    if (name.length < 2) return undefined

    const timer = window.setTimeout(async () => {
      setSearching(true)
      try {
        const response = await fetch(
          `https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${encodeURIComponent(name)}&page_size=6`,
        )
        const data = await response.json()
        setResults(data.results || [])
      } catch (error) {
        console.error(error)
      } finally {
        setSearching(false)
      }
    }, 550)

    return () => window.clearTimeout(timer)
  }, [form.name])

  const update = (field, value) => {
    if (field === 'name' && value.trim().length < 2) setResults([])
    setForm((current) => ({ ...current, [field]: value }))
  }

  const pickGame = (game) => {
    const known = findKnownGame(game.name)
    setForm((current) => ({
      ...current,
      name: game.name,
      platform: mapRawgPlatform(game.platforms) || current.platform,
      image: game.background_image || '',
      dev: known?.dev || current.dev,
      tags: mapRawgGenres(game.genres).length ? mapRawgGenres(game.genres) : known?.tags || current.tags,
      icon: known?.icon || current.icon,
      bg: known?.bg || current.bg,
    }))
    setResults([])
  }

  const smartFill = () => {
    const known = findKnownGame(form.name)
    if (!known) return
    setForm((current) => ({ ...current, ...known }))
  }

  const submit = async () => {
    if (!form.name.trim() || !form.platform) {
      alert('נא למלא שם ופלטפורמה')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: form.name.trim(),
        platform: form.platform,
        price: Number(form.price) || 0,
        status: form.status,
        dev: form.dev || 'לא ידוע',
        tags: form.tags.length ? form.tags : ['action'],
        icon: form.icon,
        bg: form.bg,
        image: form.image,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet title="הוסף משחק" onClose={onClose}>
      <label className="field">
        <span>שם המשחק</span>
        <input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="למשל: Elden Ring" />
      </label>

      {results.length ? (
        <div className="rawg-results">
          {results.map((game) => (
            <button type="button" key={game.id} onClick={() => pickGame(game)}>
              {game.background_image ? <img src={game.background_image} alt="" /> : <Gamepad2 size={22} />}
              <span>
                <strong>{game.name}</strong>
                <small>{(game.platforms || []).map((item) => item.platform.name).slice(0, 3).join(', ')}</small>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <button className="secondary-btn" type="button" onClick={smartFill} disabled={!findKnownGame(form.name)}>
        <Sparkles size={18} />
        מלא פרטים אוטומטית
      </button>
      {searching ? <p className="muted">מחפש...</p> : null}

      <div className="form-grid">
        <label className="field">
          <span>מחיר</span>
          <input value={form.price} onChange={(event) => update('price', event.target.value)} type="number" inputMode="numeric" placeholder="₪" />
        </label>
        <label className="field">
          <span>פלטפורמה</span>
          <select value={form.platform} onChange={(event) => update('platform', event.target.value)}>
            <option value="">בחר...</option>
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </label>
      </div>

      <StatusButtons value={form.status} onChange={(status) => update('status', status)} />

      <button className="primary-btn" type="button" onClick={submit} disabled={saving}>
        <Plus size={18} />
        הוסף לקטלוג
      </button>
    </BottomSheet>
  )
}

function GameSheet({ game, onClose, onDelete, onSave }) {
  const [form, setForm] = useState(() => ({
      stars: game.stars || 0,
      status: game.status || 'own',
      tags: [...(game.tags || [])],
      note: game.note || '',
      price: game.price || '',
      platform: game.platform || '',
  }))

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const toggleTag = (tag) =>
    update(
      'tags',
      form.tags.includes(tag) ? form.tags.filter((item) => item !== tag) : [...form.tags, tag],
    )

  const submit = () =>
    onSave(game.id, {
      stars: form.stars,
      status: form.status,
      tags: form.tags,
      note: form.note,
      price: Number(form.price) || 0,
      platform: form.platform,
    })

  return (
    <BottomSheet title={game.name} subtitle={game.dev || ''} media={<GameThumb game={game} large />} onClose={onClose}>
      <StatusButtons value={form.status} onChange={(status) => update('status', status)} />

      <div className="stars-row" aria-label="דירוג">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => update('stars', star)} className={form.stars >= star ? 'active' : ''}>
            <Star size={28} fill="currentColor" />
          </button>
        ))}
      </div>

      <ChipRow className="wrap">
        {TAGS.map((tag) => (
          <button
            key={tag}
            className={form.tags.includes(tag) ? 'chip active' : 'chip'}
            type="button"
            onClick={() => toggleTag(tag)}
          >
            {TAG_LABELS[tag]}
          </button>
        ))}
      </ChipRow>

      <label className="field">
        <span>הערות</span>
        <input value={form.note} onChange={(event) => update('note', event.target.value)} placeholder="הערות אישיות..." />
      </label>

      <div className="form-grid">
        <label className="field">
          <span>מחיר ששילמת</span>
          <input value={form.price} onChange={(event) => update('price', event.target.value)} type="number" inputMode="numeric" placeholder="₪" />
        </label>
        <label className="field">
          <span>פלטפורמה</span>
          <select value={form.platform} onChange={(event) => update('platform', event.target.value)}>
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button className="primary-btn" type="button" onClick={submit}>
        <Save size={18} />
        שמור
      </button>
      <button className="danger-btn" type="button" onClick={() => onDelete(game.id)}>
        <Trash2 size={18} />
        הסר מהקטלוג
      </button>
    </BottomSheet>
  )
}

function BottomSheet({ children, media, onClose, subtitle, title }) {
  return (
    <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="bottom-sheet">
        <div className="sheet-handle" />
        <header className="sheet-title-row">
          {media}
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="icon-btn ghost" type="button" onClick={onClose} title="סגור">
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}

function BottomNav({ screen, setScreen }) {
  return (
    <nav className="bottom-nav">
      <button className={screen === 'home' ? 'active' : ''} type="button" onClick={() => setScreen('home')}>
        <Home size={22} />
        <span>בית</span>
      </button>
      <button className={screen === 'stats' ? 'active' : ''} type="button" onClick={() => setScreen('stats')}>
        <BarChart3 size={22} />
        <span>סיכום</span>
      </button>
    </nav>
  )
}

function GameRow({ game, onOpen }) {
  return (
    <button className="game-row" type="button" onClick={() => onOpen(game.id)}>
      <GameThumb game={game} />
      <span className="game-info">
        <strong>{game.name}</strong>
        <small>
          {game.platform} · {game.dev || 'לא ידוע'}
        </small>
        <span className="tag-line">
          {(game.tags || []).slice(0, 3).map((tag) => (
            <span key={tag}>{TAG_LABELS[tag] || tag}</span>
          ))}
        </span>
      </span>
      <span className="game-side">
        <StatusBadge status={game.status} />
        {game.stars ? <small className="stars-text">{starText(game.stars)}</small> : null}
        {game.price ? <small>₪{game.price}</small> : null}
      </span>
    </button>
  )
}

function GameCard({ game, onOpen }) {
  return (
    <button className="game-card" type="button" onClick={() => onOpen(game.id)}>
      <GameThumb game={game} large />
      <strong>{game.name}</strong>
      <small>{game.platform}</small>
      <StatusBadge status={game.status} />
    </button>
  )
}

function GameThumb({ compact, game, large }) {
  const className = ['game-thumb', compact ? 'compact' : '', large ? 'large' : '', game.bg || 'bg-purple']
    .filter(Boolean)
    .join(' ')

  if (game.image) {
    return <img className={className} src={game.image} alt="" />
  }

  return <span className={className}>{game.icon || '🎮'}</span>
}

function StatusBadge({ status }) {
  return <span className={`status-badge ${status || 'own'}`}>{STATUS_LABELS[status] || 'יש לי'}</span>
}

function StatusButtons({ onChange, value }) {
  return (
    <div className="status-row">
      {STATUS_OPTIONS.map((status) => (
        <button
          key={status.value}
          className={value === status.value ? 'active' : ''}
          type="button"
          onClick={() => onChange(status.value)}
        >
          {value === status.value ? <Check size={16} /> : <ChevronDown size={16} />}
          {status.label}
        </button>
      ))}
    </div>
  )
}

function ChipRow({ children, className = '' }) {
  return <div className={`chip-row ${className}`}>{children}</div>
}

function StatCard({ label, value, wide }) {
  return (
    <div className={wide ? 'stat-card wide' : 'stat-card'}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="empty-state">
      <Gamepad2 size={42} />
      <strong>אין משחקים להצגה</strong>
      <span>לחץ על + כדי להוסיף משחק</span>
    </div>
  )
}

function Logo({ size = 'normal' }) {
  return (
    <div className={size === 'large' ? 'logo large' : 'logo'}>
      Eran<span>Game</span><em>Zone</em>
    </div>
  )
}

function createEmptyForm() {
  const fallback = getFallbackIcon()
  return {
    name: '',
    platform: '',
    price: '',
    status: 'own',
    dev: 'לא ידוע',
    tags: ['action'],
    image: '',
    icon: fallback.icon,
    bg: fallback.bg,
  }
}

export default App
