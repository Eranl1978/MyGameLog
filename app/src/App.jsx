import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  waitForPendingWrites,
  where,
  writeBatch,
} from 'firebase/firestore'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import {
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import {
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Gamepad2,
  Grid2X2,
  GripVertical,
  Home,
  Inbox,
  Info,
  List,
  LogOut,
  Plus,
  Save,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserPlus,
  UserRound,
  Users,
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

const APP_VERSION = '1.0.22'
const sharesCollection = 'shares'
const profilesCollection = 'profiles'
const friendshipsCollection = 'friendships'
const shareRequestsCollection = 'shareRequests'
const defaultPrivacy = {
  shareListWithFriends: false,
  shareBacklogWithFriends: false,
}
const PUBLIC_WEB_URL = 'https://mglog.netlify.app/'
const DEFAULT_LANGUAGE = 'he'
const languageOptions = [
  { value: 'he', label: 'עברית', dir: 'rtl', lang: 'he' },
  { value: 'en', label: 'English', dir: 'ltr', lang: 'en' },
  { value: 'ar', label: 'العربية', dir: 'rtl', lang: 'ar' },
]

const translations = {
  he: {
    account: 'חשבון',
    addGame: 'הוסף משחק',
    all: 'הכל',
    app: 'אפליקציה',
    backlog: 'בקלוג',
    backlogCount: ({ count }) => `${count} משחקים שמחכים לך`,
    backlogEmpty: 'אין משחקים בקלוג',
    backlogEmptyHint: 'סמן משחק כבקלוג מתוך עמוד המשחק.',
    backlogHeroBody: 'רשימת המשחקים לפי הסדר שאתה רוצה לשחק.',
    backlogHeroTitle: 'מה משחקים בהמשך?',
    catalogSubtitle: 'הקטלוג האישי שלך',
    deleteAccount: 'מחיקת חשבון',
    deleteAccountDescription: ({ count }) => `מוחק את החשבון ואת ${count} המשחקים שלך`,
    deletingAccount: 'מוחק חשבון...',
    discoverSubtitle: 'חפש משחקים חדשים והוסף אותם מהר',
    done: 'שוחקו',
    friends: 'חברים',
    general: 'כללי',
    grid: 'גריד',
    home: 'בית',
    games: 'משחקים',
    language: 'שפה',
    list: 'רשימה',
    loginGoogle: 'התחבר עם Google',
    logout: 'התנתקות',
    logoutDescription: 'יציאה מהחשבון במכשיר הזה',
    owned: 'בבעלותי',
    privacy: 'פרטיות',
    privacyAuth: 'ההתחברות מתבצעת דרך Google, בלי סיסמה באפליקציה.',
    privacyStorage: 'המשחקים נשמרים בחשבון Firebase שלך בלבד.',
    profileFallbackName: 'משתמש MyGameLog',
    search: 'חיפוש',
    searchHeroBody: 'מצא משחקים מהאינטרנט והוסף אותם לרשימה, לבקלוג או לרצונות.',
    searchHeroTitle: 'חיפוש',
    searchPlaceholder: 'חפש משחק...',
    settings: 'הגדרות',
    settingsSubtitle: 'הגדרות חשבון ופרטיות',
    shareBacklog: 'שתף בקלוג',
    shareList: 'שתף רשימה',
    summary: 'סיכום',
    summaryGeneral: 'סיכום כללי',
    version: ({ version }) => `גרסה ${version}`,
    want: 'רוצה',
  },
  en: {
    account: 'Account',
    addGame: 'Add game',
    all: 'All',
    app: 'App',
    backlog: 'Backlog',
    backlogCount: ({ count }) => `${count} games waiting`,
    backlogEmpty: 'No games in Backlog',
    backlogEmptyHint: 'Mark a game as Backlog from its game page.',
    backlogHeroBody: 'Your games in the order you want to play them.',
    backlogHeroTitle: 'What should you play next?',
    catalogSubtitle: 'Your personal game catalog',
    deleteAccount: 'Delete account',
    deleteAccountDescription: ({ count }) => `Deletes your account and ${count} games`,
    deletingAccount: 'Deleting account...',
    discoverSubtitle: 'Search new games and add them quickly',
    done: 'Played',
    friends: 'Friends',
    general: 'General',
    grid: 'Grid',
    home: 'Home',
    games: 'games',
    language: 'Language',
    list: 'List',
    loginGoogle: 'Sign in with Google',
    logout: 'Sign out',
    logoutDescription: 'Sign out on this device',
    owned: 'Owned',
    privacy: 'Privacy',
    privacyAuth: 'Sign-in uses Google, without an app password.',
    privacyStorage: 'Your games are stored only in your Firebase account.',
    profileFallbackName: 'MyGameLog user',
    search: 'Search',
    searchHeroBody: 'Find games online and add them to your list, Backlog, or wishlist.',
    searchHeroTitle: 'Search',
    searchPlaceholder: 'Search game...',
    settings: 'Settings',
    settingsSubtitle: 'Account and privacy settings',
    shareBacklog: 'Share Backlog',
    shareList: 'Share list',
    summary: 'Summary',
    summaryGeneral: 'Overview',
    version: ({ version }) => `Version ${version}`,
    want: 'Want',
  },
  ar: {
    account: 'الحساب',
    addGame: 'إضافة لعبة',
    all: 'الكل',
    app: 'التطبيق',
    backlog: 'قائمة الانتظار',
    backlogCount: ({ count }) => `${count} ألعاب بانتظارك`,
    backlogEmpty: 'لا توجد ألعاب في قائمة الانتظار',
    backlogEmptyHint: 'علّم لعبة كقائمة انتظار من صفحة اللعبة.',
    backlogHeroBody: 'قائمة الألعاب بالترتيب الذي تريد لعبها به.',
    backlogHeroTitle: 'ماذا ستلعب لاحقا؟',
    catalogSubtitle: 'كتالوج الألعاب الشخصي',
    deleteAccount: 'حذف الحساب',
    deleteAccountDescription: ({ count }) => `يحذف الحساب و ${count} ألعاب`,
    deletingAccount: 'جار حذف الحساب...',
    discoverSubtitle: 'ابحث عن ألعاب جديدة وأضفها بسرعة',
    done: 'تم لعبها',
    friends: 'الأصدقاء',
    general: 'عام',
    grid: 'شبكة',
    home: 'الرئيسية',
    games: 'ألعاب',
    language: 'اللغة',
    list: 'قائمة',
    loginGoogle: 'تسجيل الدخول عبر Google',
    logout: 'تسجيل الخروج',
    logoutDescription: 'الخروج من الحساب على هذا الجهاز',
    owned: 'أملكها',
    privacy: 'الخصوصية',
    privacyAuth: 'يتم تسجيل الدخول عبر Google بدون كلمة مرور داخل التطبيق.',
    privacyStorage: 'يتم حفظ ألعابك فقط في حساب Firebase الخاص بك.',
    profileFallbackName: 'مستخدم MyGameLog',
    search: 'بحث',
    searchHeroBody: 'ابحث عن ألعاب على الإنترنت وأضفها إلى قائمتك أو قائمة الانتظار أو الرغبات.',
    searchHeroTitle: 'بحث',
    searchPlaceholder: 'ابحث عن لعبة...',
    settings: 'الإعدادات',
    settingsSubtitle: 'إعدادات الحساب والخصوصية',
    shareBacklog: 'مشاركة قائمة الانتظار',
    shareList: 'مشاركة القائمة',
    summary: 'ملخص',
    summaryGeneral: 'ملخص عام',
    version: ({ version }) => `الإصدار ${version}`,
    want: 'أريدها',
  },
}

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [gamesLoading, setGamesLoading] = useState(false)
  const [games, setGames] = useState([])
  const [profile, setProfile] = useState(null)
  const [friendships, setFriendships] = useState([])
  const [friendProfiles, setFriendProfiles] = useState({})
  const [incomingShareRequests, setIncomingShareRequests] = useState([])
  const [outgoingShareRequests, setOutgoingShareRequests] = useState([])
  const [selectedFriendId, setSelectedFriendId] = useState('')
  const [friendGames, setFriendGames] = useState([])
  const [friendGamesLoading, setFriendGamesLoading] = useState(false)
  const [screen, setScreen] = useState('home')
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [tagFilters, setTagFilters] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('list')
  const [addOpen, setAddOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [toast, setToast] = useState('')
  const [appError, setAppError] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('mgl-language') || DEFAULT_LANGUAGE
    } catch {
      return DEFAULT_LANGUAGE
    }
  })
  const [shareRoute, setShareRoute] = useState(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareError, setShareError] = useState('')
  const t = useMemo(() => createTranslator(language), [language])

  useEffect(() => {
    const config = getLanguageConfig(language)
    document.documentElement.lang = config.lang
    document.documentElement.dir = config.dir
    try {
      localStorage.setItem('mgl-language', config.value)
    } catch {
      // localStorage can be unavailable in some embedded/private contexts.
    }
  }, [language])

  useEffect(() => {
    const reportError = (event) => {
      const message = getErrorMessage(event.error || event.message || event)
      console.error(event.error || event)
      setAppError(message)
    }
    const reportRejection = (event) => {
      const message = getErrorMessage(event.reason)
      console.error(event.reason)
      setAppError(message)
    }

    window.addEventListener('error', reportError)
    window.addEventListener('unhandledrejection', reportRejection)

    return () => {
      window.removeEventListener('error', reportError)
      window.removeEventListener('unhandledrejection', reportRejection)
    }
  }, [])

  useEffect(() => {
    const loadSharedContent = async () => {
      const params = new URLSearchParams(window.location.search)
      const shareId = params.get('share')
      const encodedHash = window.location.hash.startsWith('#share=')
        ? window.location.hash.slice('#share='.length)
        : ''

      if (!shareId && !encodedHash) return

      setShareLoading(true)
      try {
        if (encodedHash) {
          setShareRoute(parseEncodedShare(encodedHash))
          return
        }

        try {
          const snapshot = await getDoc(doc(db, sharesCollection, shareId))
          if (!snapshot.exists()) throw new Error('השיתוף לא נמצא')
          setShareRoute(snapshot.data())
        } catch (error) {
          if (!encodedHash) throw error
          setShareRoute(parseEncodedShare(encodedHash))
        }
      } catch (error) {
        console.error(error)
        setShareError(getErrorMessage(error))
      } finally {
        setShareLoading(false)
      }
    }

    loadSharedContent()
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setGamesLoading(true)
      setUser(currentUser)
      setAuthLoading(false)
      if (!currentUser) {
        setGames([])
        setProfile(null)
        setFriendships([])
        setFriendProfiles({})
        setIncomingShareRequests([])
        setOutgoingShareRequests([])
        setSelectedFriendId('')
        setFriendGames([])
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
        const nextGames = snapshot.docs.map(normalizeGame)
        nextGames.sort((a, b) => a.name.localeCompare(b.name, 'he'))
        setGames(nextGames)
        setAppError('')
        setGamesLoading(false)
      },
      (error) => {
        console.error(error)
        setAppError(getErrorMessage(error))
        setGamesLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  useEffect(() => {
    if (!user) return undefined

    const profileRef = doc(db, profilesCollection, user.uid)
    syncUserProfile(user).catch(console.error)

    const unsubscribe = onSnapshot(
      profileRef,
      (snapshot) => {
        setProfile(normalizeProfile(user.uid, snapshot.data(), user))
      },
      (error) => console.error(error),
    )

    return unsubscribe
  }, [user])

  useEffect(() => {
    if (!user) return undefined

    const profileRef = doc(db, profilesCollection, user.uid)
    const updatePresence = () => {
      setDoc(profileRef, { lastSeenAt: Date.now(), updatedAt: Date.now() }, { merge: true }).catch(console.error)
    }

    updatePresence()
    const interval = window.setInterval(updatePresence, 60000)
    return () => window.clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (!user) return undefined

    const friendshipsQuery = query(collection(db, friendshipsCollection), where('users', 'array-contains', user.uid))
    const unsubscribe = onSnapshot(
      friendshipsQuery,
      (snapshot) => {
        const nextFriendships = snapshot.docs.map(normalizeFriendship)
        setFriendships(nextFriendships)
        if (!nextFriendships.length) setFriendProfiles({})
      },
      (error) => console.error(error),
    )

    return unsubscribe
  }, [user])

  useEffect(() => {
    if (!user) return undefined

    const incomingQuery = query(collection(db, shareRequestsCollection), where('ownerId', '==', user.uid))
    const unsubscribeIncoming = onSnapshot(
      incomingQuery,
      (snapshot) => {
        setIncomingShareRequests(
          snapshot.docs.map(normalizeShareRequest).filter((request) => request.status === 'pending'),
        )
      },
      (error) => console.error(error),
    )

    const outgoingQuery = query(collection(db, shareRequestsCollection), where('requesterId', '==', user.uid))
    const unsubscribeOutgoing = onSnapshot(
      outgoingQuery,
      (snapshot) => {
        setOutgoingShareRequests(
          snapshot.docs.map(normalizeShareRequest).filter((request) => request.status === 'pending'),
        )
      },
      (error) => console.error(error),
    )

    return () => {
      unsubscribeIncoming()
      unsubscribeOutgoing()
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    const friendIds = [...new Set(friendships.map((friendship) => getOtherUserId(friendship, user.uid)).filter(Boolean))]
    if (!friendIds.length) {
      return
    }

    let cancelled = false
    Promise.all(
      friendIds.map(async (friendId) => {
        const snapshot = await getDoc(doc(db, profilesCollection, friendId))
        return normalizeProfile(friendId, snapshot.data())
      }),
    )
      .then((profiles) => {
        if (cancelled) return
        setFriendProfiles(Object.fromEntries(profiles.map((item) => [item.uid, item])))
      })
      .catch(console.error)

    return () => {
      cancelled = true
    }
  }, [friendships, user])

  useEffect(() => {
    if (!user) return

    const nextStats = {
      gamesCount: games.length,
      backlogCount: games.filter((game) => game.backlog).length,
      doneCount: games.filter((game) => game.status === 'done').length,
    }

    setDoc(
      doc(db, profilesCollection, user.uid),
      {
        displayName: user.displayName || user.email || 'MyGameLog',
        email: user.email || '',
        emailLower: (user.email || '').toLowerCase(),
        photoURL: user.photoURL || '',
        stats: nextStats,
        updatedAt: Date.now(),
      },
      { merge: true },
    ).catch(console.error)
  }, [games, user])

  const filteredGames = useMemo(() => {
    const q = search.trim().toLowerCase()
    return games.filter((game) => {
      const name = String(game.name || '').toLowerCase()
      const dev = String(game.dev || '').toLowerCase()
      const bySearch =
        !q ||
        name.includes(q) ||
        dev.includes(q)
      const byPlatform = platformFilter === 'all' || game.platform === platformFilter
      const byTags =
        tagFilters.length === 0 || tagFilters.some((tag) => game.tags?.includes(tag))
      const byStatus =
        statusFilter === 'all' ||
        (statusFilter === 'backlog' ? game.backlog : game.status === statusFilter)
      return bySearch && byPlatform && byTags && byStatus
    })
  }, [games, platformFilter, search, statusFilter, tagFilters])

  const selectedGame = useMemo(
    () => games.find((game) => game.id === selectedId) || null,
    [games, selectedId],
  )
  const selectedFriendship = useMemo(
    () => friendships.find((friendship) => getOtherUserId(friendship, user?.uid) === selectedFriendId) || null,
    [friendships, selectedFriendId, user],
  )
  const selectedFriendProfile = selectedFriendId ? friendProfiles[selectedFriendId] || null : null

  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const shareList = async () => {
    const payload = {
      kind: 'list',
      ownerName: user.displayName || user.email || 'MyGameLog',
      games: games.map(toShareGame),
      createdAt: Date.now(),
      appVersion: APP_VERSION,
    }
    const url = await createShareUrl(payload)
    await shareUrl({
      title: 'רשימת המשחקים שלי',
      text: `${payload.ownerName} שיתף איתך רשימת משחקים מ-MyGameLog`,
      url,
    })
    showToast('קישור שיתוף מוכן')
  }

  const shareGame = async (game) => {
    const payload = {
      kind: 'game',
      ownerName: user.displayName || user.email || 'MyGameLog',
      game: toShareGame(game),
      createdAt: Date.now(),
      appVersion: APP_VERSION,
    }
    const url = await createShareUrl(payload)
    await shareUrl({
      title: game.name,
      text: `${payload.ownerName} שיתף איתך משחק מ-MyGameLog`,
      url,
    })
    showToast('קישור שיתוף מוכן')
  }

  const shareBacklog = async () => {
    const backlogGames = sortBacklogGames(games.filter((game) => game.backlog))
    if (!backlogGames.length) {
      showToast('אין משחקים בקלוג לשיתוף')
      return
    }

    const payload = {
      kind: 'backlog',
      ownerName: user.displayName || user.email || 'MyGameLog',
      games: backlogGames.map((game, index) => ({
        ...toShareGame(game),
        backlogPosition: index + 1,
      })),
      createdAt: Date.now(),
      appVersion: APP_VERSION,
    }
    const url = await createShareUrl(payload)
    await shareUrl({
      title: 'הבקלוג שלי',
      text: `${payload.ownerName} שיתף איתך בקלוג מ-MyGameLog`,
      url,
    })
    showToast('קישור בקלוג מוכן')
  }

  const searchFriendByEmail = async (email) => {
    const emailLower = email.trim().toLowerCase()
    if (!emailLower) return null

    const profilesQuery = query(collection(db, profilesCollection), where('emailLower', '==', emailLower))
    const snapshot = await getDocs(profilesQuery)
    const match = snapshot.docs.map((item) => normalizeProfile(item.id, item.data()))[0] || null
    if (!match) return null
    if (match.uid === user.uid) throw new Error('זה החשבון שלך')
    return match
  }

  const sendFriendRequest = async (targetProfile) => {
    const friendship = friendships.find((item) => getOtherUserId(item, user.uid) === targetProfile.uid)
    if (friendship?.status === 'accepted') {
      showToast('אתם כבר חברים')
      return
    }
    if (friendship?.status === 'pending') {
      showToast('כבר קיימת בקשת חברות')
      return
    }

    const permissions = createFriendPermissions(user.uid, targetProfile.uid, profile)
    await setDoc(doc(db, friendshipsCollection, getFriendshipId(user.uid, targetProfile.uid)), {
      users: [user.uid, targetProfile.uid].sort(),
      requesterId: user.uid,
      recipientId: targetProfile.uid,
      status: 'pending',
      permissions,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    showToast('בקשת חברות נשלחה')
  }

  const acceptFriendRequest = async (friendship) => {
    const otherId = getOtherUserId(friendship, user.uid)
    const permissions = {
      ...(friendship.permissions || {}),
      [user.uid]: getProfilePrivacyPermissions(profile),
    }

    await updateDoc(doc(db, friendshipsCollection, friendship.id), {
      status: 'accepted',
      permissions,
      acceptedAt: Date.now(),
      updatedAt: Date.now(),
    })
    showToast('בקשת החברות אושרה')

    if (otherId) {
      setScreen('friends')
    }
  }

  const rejectFriendRequest = async (friendship) => {
    await deleteDoc(doc(db, friendshipsCollection, friendship.id))
    showToast('בקשת החברות נדחתה')
  }

  const removeFriend = async (friendship) => {
    if (!confirm('להסיר את החבר?')) return
    await deleteDoc(doc(db, friendshipsCollection, friendship.id))
    if (selectedFriendId === getOtherUserId(friendship, user.uid)) {
      setSelectedFriendId('')
      setFriendGames([])
    }
    showToast('החבר הוסר')
  }

  const openFriendLibrary = async (friendship) => {
    const friendId = getOtherUserId(friendship, user.uid)
    if (!friendId) return

    setSelectedFriendId(friendId)
    setFriendGames([])
    if (!canViewFriendScope(friendship, friendId, 'list') && !canViewFriendScope(friendship, friendId, 'backlog')) {
      return
    }

    setFriendGamesLoading(true)
    try {
      const friendGamesQuery = query(collection(db, gamesCollection), where('userId', '==', friendId))
      const snapshot = await getDocs(friendGamesQuery)
      const nextGames = snapshot.docs.map(normalizeGame)
      nextGames.sort((a, b) => a.name.localeCompare(b.name, 'he'))
      setFriendGames(nextGames)
    } catch (error) {
      console.error(error)
      alert(`לא הצלחתי לטעון את הרשימה של החבר: ${getErrorMessage(error)}`)
    } finally {
      setFriendGamesLoading(false)
    }
  }

  const requestFriendAccess = async (ownerId, scope) => {
    if (!ownerId || ownerId === user.uid) return
    const requestId = getShareRequestId(user.uid, ownerId, scope)
    await setDoc(doc(db, shareRequestsCollection, requestId), {
      requesterId: user.uid,
      ownerId,
      scope,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    showToast('בקשת שיתוף נשלחה')
  }

  const approveShareRequest = async (request) => {
    const friendshipId = getFriendshipId(user.uid, request.requesterId)
    const friendship = friendships.find((item) => item.id === friendshipId)
    if (!friendship || friendship.status !== 'accepted') {
      alert('צריך קודם להיות חברים כדי לאשר שיתוף')
      return
    }

    const nextPermissions = {
      ...(friendship.permissions || {}),
      [user.uid]: {
        ...getProfilePrivacyPermissions(profile),
        ...(friendship.permissions?.[user.uid] || {}),
        [request.scope]: true,
      },
    }

    const batch = writeBatch(db)
    batch.update(doc(db, friendshipsCollection, friendshipId), {
      permissions: nextPermissions,
      updatedAt: Date.now(),
    })
    batch.update(doc(db, shareRequestsCollection, request.id), {
      status: 'approved',
      resolvedAt: Date.now(),
      updatedAt: Date.now(),
    })
    await batch.commit()
    showToast('אישרת שיתוף')
  }

  const rejectShareRequest = async (request) => {
    await updateDoc(doc(db, shareRequestsCollection, request.id), {
      status: 'rejected',
      resolvedAt: Date.now(),
      updatedAt: Date.now(),
    })
    showToast('בקשת השיתוף נדחתה')
  }

  const updatePrivacySettings = async (nextPrivacy) => {
    const currentPrivacy = getProfilePrivacy(profile)
    const privacy = { ...currentPrivacy, ...nextPrivacy }
    const batch = writeBatch(db)

    batch.set(doc(db, profilesCollection, user.uid), {
      privacy,
      updatedAt: Date.now(),
    }, { merge: true })

    friendships
      .filter((friendship) => friendship.status === 'accepted')
      .forEach((friendship) => {
        batch.update(doc(db, friendshipsCollection, friendship.id), {
          permissions: {
            ...(friendship.permissions || {}),
            [user.uid]: getProfilePrivacyPermissions({ privacy }),
          },
          updatedAt: Date.now(),
        })
      })

    await batch.commit()
    showToast('הגדרות השיתוף נשמרו')
  }

  const login = async () => {
    try {
      if (isNativeApp()) {
        const result = await FirebaseAuthentication.signInWithGoogle({
          skipNativeAuth: true,
          useCredentialManager: false,
        })
        const idToken = result.credential?.idToken

        if (!idToken) {
          throw new Error('Google לא החזיר token לאפליקציה')
        }

        const credential = GoogleAuthProvider.credential(idToken)
        await signInWithCredential(auth, credential)
        return
      }

      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      alert(`שגיאה בהתחברות: ${error.message}`)
    }
  }

  const logout = async () => {
    if (!confirm('להתנתק?')) return
    if (isNativeApp()) await FirebaseAuthentication.signOut().catch(console.info)
    await signOut(auth)
    setScreen('home')
  }

  const deleteAccount = async () => {
    if (!confirm('למחוק את החשבון ואת כל המשחקים? אי אפשר לשחזר את זה.')) return

    const approval = prompt('כדי לאשר מחיקה מלאה, כתוב: מחיקה')
    if (approval !== 'מחיקה') return

    setDeletingAccount(true)
    try {
      await reauthenticateCurrentUser()
      await deleteUserGames(user.uid)
      await deleteUserSocialData(user.uid)
      await deleteUser(auth.currentUser)
      if (isNativeApp()) await FirebaseAuthentication.signOut().catch(console.info)
      setScreen('home')
      showToast('החשבון נמחק')
    } catch (error) {
      console.error(error)
      alert(`מחיקת החשבון נכשלה: ${getErrorMessage(error)}`)
    } finally {
      setDeletingAccount(false)
    }
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

  const markBacklogPlayed = async (gameId) => {
    try {
      await updateDoc(doc(db, gamesCollection, gameId), {
        status: 'done',
        backlog: false,
      })
      showToast('סומן כשיחקת')
    } catch (error) {
      console.error(error)
      alert(`לא הצלחתי לעדכן: ${getErrorMessage(error)}`)
    }
  }

  const reorderBacklog = async (orderedIds) => {
    try {
      const batch = writeBatch(db)
      orderedIds.forEach((gameId, index) => {
        batch.update(doc(db, gamesCollection, gameId), {
          backlogOrder: (index + 1) * 1000,
        })
      })
      await batch.commit()
      showToast('סדר הבקלוג נשמר')
    } catch (error) {
      console.error(error)
      alert(`לא הצלחתי לשמור את הסדר: ${getErrorMessage(error)}`)
    }
  }

  const removeGame = async (gameId) => {
    if (!confirm('למחוק מהקטלוג?')) return
    try {
      const gameRef = doc(db, gamesCollection, gameId)
      await deleteDoc(gameRef)
      await waitForPendingWrites(db)

      setSelectedId(null)
      showToast('נמחק')
    } catch (error) {
      console.error(error)
      alert(`המחיקה נכשלה: ${getErrorMessage(error)}`)
    }
  }

  if (appError) {
    return <ErrorScreen message={appError} onRetry={() => window.location.reload()} />
  }

  if (shareLoading) {
    return <Splash />
  }

  if (shareRoute || shareError) {
    return <ShareScreen error={shareError} share={shareRoute} />
  }

  if (authLoading || gamesLoading) {
    return <Splash />
  }

  if (!user) {
    return <LoginScreen onLogin={login} t={t} />
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
          onShareList={shareList}
          platformFilter={platformFilter}
          search={search}
          setPlatformFilter={setPlatformFilter}
          setSearch={setSearch}
          setStatusFilter={setStatusFilter}
          setTagFilters={setTagFilters}
          setViewMode={setViewMode}
          statusFilter={statusFilter}
          tagFilters={tagFilters}
          t={t}
          user={user}
          viewMode={viewMode}
        />
      ) : screen === 'backlog' ? (
        <BacklogScreen
          games={games}
          onMarkPlayed={markBacklogPlayed}
          onOpenGame={setSelectedId}
          onReorderBacklog={reorderBacklog}
          onShareBacklog={shareBacklog}
          t={t}
        />
      ) : screen === 'discover' ? (
        <DiscoveryScreen
          games={games}
          onAddGame={saveNewGame}
          onOpenGame={setSelectedId}
          t={t}
        />
      ) : screen === 'friends' ? (
        selectedFriendId ? (
          <FriendLibraryScreen
            friend={selectedFriendProfile}
            friendship={selectedFriendship}
            games={friendGames}
            key={selectedFriendId}
            loading={friendGamesLoading}
            onBack={() => {
              setSelectedFriendId('')
              setFriendGames([])
            }}
            onRequestAccess={requestFriendAccess}
            outgoingShareRequests={outgoingShareRequests}
            t={t}
            userId={user.uid}
          />
        ) : (
          <FriendsScreen
            friendProfiles={friendProfiles}
            friendships={friendships}
            incomingShareRequests={incomingShareRequests}
            onAcceptFriend={acceptFriendRequest}
            onApproveShareRequest={approveShareRequest}
            onOpenFriend={openFriendLibrary}
            onRejectFriend={rejectFriendRequest}
            onRejectShareRequest={rejectShareRequest}
            onRemoveFriend={removeFriend}
            onRequestAccess={requestFriendAccess}
            onSearchFriend={searchFriendByEmail}
            onSendFriendRequest={sendFriendRequest}
            outgoingShareRequests={outgoingShareRequests}
            profile={profile}
            t={t}
            user={user}
          />
        )
      ) : screen === 'stats' ? (
        <StatsScreen games={games} onOpenGame={setSelectedId} t={t} />
      ) : (
        <SettingsScreen
          appVersion={APP_VERSION}
          deletingAccount={deletingAccount}
          gamesCount={games.length}
          language={language}
          onDeleteAccount={deleteAccount}
          onLanguageChange={setLanguage}
          onLogout={logout}
          onPrivacyChange={updatePrivacySettings}
          profile={profile}
          t={t}
          user={user}
        />
      )}

      <BottomNav screen={screen} setScreen={setScreen} t={t} />

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
          onShare={shareGame}
        />
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </main>
  )
}

function Splash() {
  return (
    <main className="splash">
      <img className="splash-logo-img" src="/mgl.png" alt="" />
      <Logo size="large" />
      <div className="loading-dots" aria-label="טוען">
        <span />
        <span />
        <span />
      </div>
    </main>
  )
}

function ErrorScreen({ message, onRetry }) {
  return (
    <main className="error-screen">
      <Logo size="large" />
      <strong>משהו נתקע בטעינת האפליקציה</strong>
      <p dir="ltr">{message}</p>
      <button className="primary-btn" type="button" onClick={onRetry}>
        נסה שוב
      </button>
    </main>
  )
}

function ShareScreen({ error, share }) {
  const isSharedList = share?.kind === 'list' || share?.kind === 'backlog'
  const games = isSharedList ? share.games || [] : share?.game ? [share.game] : []
  const isSingle = share?.kind === 'game'
  const isBacklog = share?.kind === 'backlog'

  return (
    <main className="app-shell public-shell">
      <section className="screen">
        <header className="topbar compact">
          <div className="brand-row">
            <img className="brand-icon" src="/mgl.png" alt="" />
            <div>
              <Logo />
              <p className="brand-sub">שיתוף לקריאה בלבד</p>
            </div>
          </div>
        </header>

        {error ? (
          <div className="public-error">
            <strong>לא הצלחתי לפתוח את השיתוף</strong>
            <span>{error}</span>
          </div>
        ) : (
          <>
            <section className="public-intro">
              <span>{share.ownerName || 'חבר'} שיתף איתך</span>
              <h1>{isSingle ? games[0]?.name : isBacklog ? 'בקלוג' : 'רשימת המשחקים'}</h1>
              <p>
                {isSingle
                  ? 'משחק אחד מתוך MyGameLog'
                  : isBacklog
                    ? `${games.length} משחקים לפי סדר משחק מתוך MyGameLog`
                    : `${games.length} משחקים מתוך MyGameLog`}
              </p>
            </section>

            {isSingle && games[0] ? (
              <section className="panel">
                <GameHero game={games[0]} />
                <SharedGameDetails game={games[0]} />
              </section>
            ) : (
              <div className="shared-games-grid">
                {games.map((game, index) => (
                  <SharedGameCard game={game} key={`${game.name}-${index}`} showPosition={isBacklog} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}

function SharedGameCard({ game, showPosition }) {
  return (
    <article className="shared-game-card">
      {showPosition ? <span className="shared-rank">#{game.backlogPosition || ''}</span> : null}
      <GameThumb game={game} cover />
      <div className="game-card-body">
        <strong>{game.name}</strong>
        <small>
          {game.platform} {game.dev ? `· ${game.dev}` : ''}
        </small>
        <span className="game-card-meta">
          <span className="game-card-badges">
            {game.backlog ? <span className="mini-badge">בקלוג</span> : null}
            <StatusBadge status={game.status} />
          </span>
          {game.stars ? <small className="stars-text">{starText(game.stars)}</small> : null}
        </span>
      </div>
    </article>
  )
}

function SharedGameDetails({ game }) {
  return (
    <div className="shared-details">
      <div>
        <span>סטטוס</span>
        <strong>{STATUS_LABELS[game.status] || 'יש לי'}</strong>
      </div>
      <div>
        <span>בקלוג</span>
        <strong>{game.backlog ? 'כן' : 'לא'}</strong>
      </div>
      <div>
        <span>דירוג</span>
        <strong>{game.stars ? starText(game.stars) : 'לא דורג'}</strong>
      </div>
    </div>
  )
}

function LoginScreen({ onLogin, t }) {
  return (
    <main className="login-screen">
      <img className="login-logo-img" src="/mgl.png" alt="" />
      <Logo size="large" />
      <p>{t('catalogSubtitle')}</p>
      <button className="google-btn" type="button" onClick={onLogin}>
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          width="22"
          height="22"
          alt=""
        />
        {t('loginGoogle')}
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
  onShareList,
  platformFilter,
  search,
  setPlatformFilter,
  setSearch,
  setStatusFilter,
  setTagFilters,
  setViewMode,
  statusFilter,
  tagFilters,
  t,
  user,
  viewMode,
}) {
  const owned = games.filter((game) => game.status === 'own' || game.status === 'done').length
  const want = games.filter((game) => game.status === 'want').length
  const backlog = games.filter((game) => game.backlog).length
  const firstName = user.displayName?.split(' ')[0] || ''

  return (
    <section className="screen">
      <header className="topbar">
        <div className="brand-row">
          <img className="brand-icon" src="/mgl.png" alt="" />
          <div>
            <Logo />
            <p className="brand-sub">
              {owned} {t('owned')} · {want} {t('want')} · {backlog} {t('backlog')}{firstName ? ` · ${firstName}` : ''}
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
          placeholder={t('searchPlaceholder')}
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
        {[{ value: 'all', label: t('all') }, ...PLATFORMS.map((platform) => ({ value: platform, label: platform }))].map((platform) => (
          <button
            key={platform.value}
            className={platformFilter === platform.value ? 'chip active' : 'chip'}
            type="button"
            onClick={() => setPlatformFilter(platform.value)}
          >
            {platform.label}
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
          {t('all')}
        </button>
        <button
          className={statusFilter === 'backlog' ? 'chip active' : 'chip'}
          type="button"
          onClick={() => setStatusFilter('backlog')}
        >
          {t('backlog')}
        </button>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.value}
            className={statusFilter === status.value ? 'chip active' : 'chip'}
            type="button"
            onClick={() => setStatusFilter(status.value)}
          >
            {getStatusLabel(status.value, t)}
          </button>
        ))}
      </ChipRow>

      <div className="toolbar">
        <span>{filteredGames.length} {t('games')}</span>
        <div className="toolbar-actions">
          <div className="segmented" aria-label={t('grid')}>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              type="button"
            onClick={() => setViewMode('list')}
              title={t('list')}
            >
              <List size={18} />
            </button>
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              type="button"
            onClick={() => setViewMode('grid')}
              title={t('grid')}
            >
              <Grid2X2 size={18} />
            </button>
          </div>
          <button className="icon-btn" type="button" onClick={onShareList} title={t('shareList')}>
            <Share2 size={19} />
          </button>
          <button className="add-btn" type="button" onClick={onOpenAdd} title={t('addGame')}>
            <Plus size={22} />
          </button>
        </div>
      </div>

      {filteredGames.length ? (
        <div className={viewMode === 'grid' ? 'games-grid' : 'games-list'}>
          {filteredGames.map((game) =>
            viewMode === 'grid' ? (
              <GameCard key={game.id} game={game} onOpen={onOpenGame} t={t} />
            ) : (
              <GameRow key={game.id} game={game} onOpen={onOpenGame} t={t} />
            ),
          )}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  )
}

function BacklogScreen({ games, onMarkPlayed, onOpenGame, onReorderBacklog, onShareBacklog, t }) {
  const backlogGames = useMemo(
    () => sortBacklogGames(games.filter((game) => game.backlog)),
    [games],
  )
  const doneGames = games.filter((game) => game.status === 'done').length
  const platforms = [...new Set(backlogGames.map((game) => game.platform).filter(Boolean))].slice(0, 3)
  const [dragId, setDragId] = useState('')
  const [dropId, setDropId] = useState('')
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef({ id: '', pointerId: null, startX: 0, startY: 0 })
  const dropIdRef = useRef('')

  const setDropTarget = (id) => {
    dropIdRef.current = id
    setDropId(id)
  }

  const startDrag = (event, gameId) => {
    if (backlogGames.length < 2) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = {
      id: gameId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    }
    setDragOffset({ x: 0, y: 0 })
    setDragId(gameId)
    setDropTarget(gameId)
  }

  const moveDrag = (event) => {
    const sourceId = dragRef.current.id
    if (!sourceId) return

    event.preventDefault()
    setDragOffset({
      x: event.clientX - dragRef.current.startX,
      y: event.clientY - dragRef.current.startY,
    })

    const nextDropId = findBacklogDropTarget(event.clientY, sourceId) || sourceId
    if (nextDropId && nextDropId !== dropIdRef.current) setDropTarget(nextDropId)
  }

  const finishDrag = async (event) => {
    const sourceId = dragRef.current.id
    const targetId = dropIdRef.current
    if (dragRef.current.pointerId !== null) {
      try {
        event.currentTarget.releasePointerCapture?.(dragRef.current.pointerId)
      } catch {
        // Pointer capture may already be released by the browser.
      }
    }

    dragRef.current = { id: '', pointerId: null, startX: 0, startY: 0 }
    setDragId('')
    setDragOffset({ x: 0, y: 0 })
    setDropTarget('')

    if (!sourceId || !targetId || sourceId === targetId) return

    const fromIndex = backlogGames.findIndex((game) => game.id === sourceId)
    const toIndex = backlogGames.findIndex((game) => game.id === targetId)
    if (fromIndex < 0 || toIndex < 0) return

    const nextGames = moveItem(backlogGames, fromIndex, toIndex)
    await onReorderBacklog(nextGames.map((game) => game.id))
  }

  const cancelDrag = (event) => {
    if (dragRef.current.pointerId !== null) {
      try {
        event.currentTarget.releasePointerCapture?.(dragRef.current.pointerId)
      } catch {
        // Pointer capture may already be released by the browser.
      }
    }
    dragRef.current = { id: '', pointerId: null, startX: 0, startY: 0 }
    setDragId('')
    setDragOffset({ x: 0, y: 0 })
    setDropTarget('')
  }

  return (
    <section className="screen">
      <header className="topbar compact">
        <div className="brand-row">
          <img className="brand-icon" src="/mgl.png" alt="" />
          <div>
            <Logo />
            <p className="brand-sub">{t('backlogCount', { count: backlogGames.length })}</p>
          </div>
        </div>
        <button
          className="icon-btn"
          type="button"
          onClick={onShareBacklog}
          disabled={!backlogGames.length}
          title={t('shareBacklog')}
        >
          <Share2 size={20} />
        </button>
      </header>

      <section className="backlog-hero">
        <span className="backlog-hero-icon">
          <List size={24} />
        </span>
        <div>
          <span>{t('backlog')}</span>
          <h1>{t('backlogHeroTitle')}</h1>
          <p>{t('backlogHeroBody')}</p>
        </div>
      </section>

      <div className="backlog-summary-row">
        <div>
          <strong>{backlogGames.length}</strong>
          <span>{t('backlog')}</span>
        </div>
        <div>
          <strong>{doneGames}</strong>
          <span>{t('done')}</span>
        </div>
        <div>
          <strong>{platforms.length ? platforms.join(' · ') : t('general')}</strong>
          <span>פלטפורמות</span>
        </div>
      </div>

      {backlogGames.length ? (
        <div className="backlog-list">
          {backlogGames.map((game, index) => (
            <article
              className={[
                'backlog-item',
                dragId === game.id ? 'dragging' : '',
                dropId === game.id && dragId !== game.id ? 'drop-target' : '',
              ].filter(Boolean).join(' ')}
              data-backlog-id={game.id}
              key={game.id}
              style={
                dragId === game.id
                  ? {
                      '--drag-x': `${dragOffset.x}px`,
                      '--drag-y': `${dragOffset.y}px`,
                    }
                  : undefined
              }
            >
              <button
                className="backlog-drag-handle"
                type="button"
                onPointerCancel={cancelDrag}
                onPointerDown={(event) => startDrag(event, game.id)}
                onPointerMove={moveDrag}
                onPointerUp={finishDrag}
                title="גרור לשינוי מיקום"
              >
                <GripVertical size={19} />
              </button>
              <span className="backlog-rank">{index + 1}</span>
              <button className="backlog-main" type="button" onClick={() => onOpenGame(game.id)}>
                <GameThumb compact game={game} />
                <span className="backlog-info">
                  <strong>{game.name}</strong>
                  <small>
                    {game.platform} {game.dev ? `· ${game.dev}` : ''}
                  </small>
                  <span className="backlog-tags">
                    <StatusBadge status={game.status} t={t} />
                    {game.stars ? <span className="stars-text">{starText(game.stars)}</span> : null}
                    {(game.tags || []).slice(0, 2).map((tag) => (
                      <span key={tag}>{TAG_LABELS[tag] || tag}</span>
                    ))}
                  </span>
                </span>
              </button>
              <button
                className="backlog-done-btn"
                type="button"
                onClick={() => onMarkPlayed(game.id)}
                title="סמן כשיחקתי"
              >
                <Check size={17} />
                <span>שיחקתי</span>
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <List size={42} />
          <strong>{t('backlogEmpty')}</strong>
          <span>{t('backlogEmptyHint')}</span>
        </div>
      )}
    </section>
  )
}

function DiscoveryScreen({ games, onAddGame, onOpenGame, t }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [addingKey, setAddingKey] = useState('')
  const suggestions = ['Elden Ring', 'Spider-Man', 'Mario', 'God of War', 'Forza']

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) return undefined

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      setSearched(true)
      try {
        const nextResults = await fetchRawgGames(term)
        if (!cancelled) setResults(nextResults)
      } catch (searchError) {
        console.error(searchError)
        if (!cancelled) {
          setError(getErrorMessage(searchError))
          setResults([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 450)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query])

  const updateQuery = (value) => {
    setQuery(value)
    if (value.trim().length >= 2) return
    setResults([])
    setError('')
    setLoading(false)
    setSearched(false)
  }

  const searchGames = async (nextQuery = query) => {
    const term = nextQuery.trim()
    if (term.length < 2) return

    setLoading(true)
    setError('')
    setSearched(true)
    try {
      setResults(await fetchRawgGames(term))
    } catch (searchError) {
      console.error(searchError)
      setError(getErrorMessage(searchError))
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const addGame = async (rawgGame, mode) => {
    const key = `${rawgGame.id}-${mode}`
    setAddingKey(key)
    try {
      await onAddGame(createGameFromRawg(rawgGame, mode))
    } catch (addError) {
      console.error(addError)
      alert(`לא הצלחתי להוסיף: ${getErrorMessage(addError)}`)
    } finally {
      setAddingKey('')
    }
  }

  return (
    <section className="screen">
      <header className="topbar compact">
        <div className="brand-row">
          <img className="brand-icon" src="/mgl.png" alt="" />
          <div>
            <Logo />
            <p className="brand-sub">{t('discoverSubtitle')}</p>
          </div>
        </div>
      </header>

      <section className="discover-hero">
        <span className="discover-hero-icon">
          <Search size={25} />
        </span>
        <div>
          <span>{t('search')}</span>
          <h1>{t('searchHeroTitle')}</h1>
          <p>{t('searchHeroBody')}</p>
        </div>
      </section>

      <form
        className="discover-search"
        onSubmit={(event) => {
          event.preventDefault()
          searchGames()
        }}
      >
          <Search size={18} />
        <input
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder={t('searchPlaceholder')}
          autoComplete="off"
          spellCheck="false"
        />
        <button type="submit" disabled={query.trim().length < 2 || loading}>
          {loading ? `${t('search')}...` : t('search')}
        </button>
      </form>

      <ChipRow>
        {suggestions.map((suggestion) => (
          <button
            className="chip"
            key={suggestion}
            type="button"
            onClick={() => {
              updateQuery(suggestion)
              searchGames(suggestion)
            }}
          >
            {suggestion}
          </button>
        ))}
      </ChipRow>

      {error ? <div className="discover-error">{error}</div> : null}

      {results.length ? (
        <div className="discover-results">
          {results.map((game) => {
            const existing = findExistingGame(games, game)
            return (
              <article className="discover-card" key={game.id}>
                {game.background_image ? (
                  <img src={game.background_image} alt="" />
                ) : (
                  <span className="discover-fallback"><Gamepad2 size={28} /></span>
                )}
                <div className="discover-card-body">
                  <div className="discover-card-title">
                    <strong>{game.name}</strong>
                    {existing ? <span>כבר אצלך</span> : null}
                  </div>
                  <small>{formatRawgMeta(game)}</small>
                  <div className="discover-actions">
                    {existing ? (
                      <button type="button" onClick={() => onOpenGame(existing.id)}>
                        פתח
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => addGame(game, 'backlog')}
                          disabled={addingKey === `${game.id}-backlog`}
                        >
                          + {t('backlog')}
                        </button>
                        <button
                          type="button"
                          onClick={() => addGame(game, 'want')}
                          disabled={addingKey === `${game.id}-want`}
                        >
                          {t('want')}
                        </button>
                        <button
                          type="button"
                          onClick={() => addGame(game, 'own')}
                          disabled={addingKey === `${game.id}-own`}
                        >
                          {t('owned')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={42} />
          <strong>{searched ? 'לא נמצאו משחקים' : 'חפש משחק להתחלה'}</strong>
          <span>{searched ? 'נסה שם אחר או שם באנגלית.' : 'התחל להקליד ותוצאות יופיעו אוטומטית.'}</span>
        </div>
      )}
    </section>
  )
}

function FriendsScreen({
  friendProfiles,
  friendships,
  incomingShareRequests,
  onAcceptFriend,
  onApproveShareRequest,
  onOpenFriend,
  onRejectFriend,
  onRejectShareRequest,
  onRemoveFriend,
  onRequestAccess,
  onSearchFriend,
  onSendFriendRequest,
  outgoingShareRequests,
  profile,
  t,
  user,
}) {
  const [email, setEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState(null)
  const [searchMessage, setSearchMessage] = useState('')

  const acceptedFriends = friendships.filter((friendship) => friendship.status === 'accepted')
  const incomingFriendRequests = friendships.filter(
    (friendship) => friendship.status === 'pending' && friendship.recipientId === user.uid,
  )
  const outgoingFriendRequests = friendships.filter(
    (friendship) => friendship.status === 'pending' && friendship.requesterId === user.uid,
  )

  const submitSearch = async (event) => {
    event.preventDefault()
    setSearching(true)
    setSearchResult(null)
    setSearchMessage('')
    try {
      const result = await onSearchFriend(email)
      if (!result) {
        setSearchMessage('לא מצאתי משתמש עם המייל הזה')
        return
      }
      setSearchResult(result)
    } catch (error) {
      setSearchMessage(getErrorMessage(error))
    } finally {
      setSearching(false)
    }
  }

  const sendRequest = async () => {
    if (!searchResult) return
    await onSendFriendRequest(searchResult)
    setSearchResult(null)
    setEmail('')
  }

  return (
    <section className="screen">
      <header className="topbar compact">
        <div className="brand-row">
          <img className="brand-icon" src="/mgl.png" alt="" />
          <div>
            <Logo />
            <p className="brand-sub">חברים, בקשות והרשאות צפייה</p>
          </div>
        </div>
      </header>

      <section className="friends-hero">
        <span className="friends-hero-icon">
          <Users size={25} />
        </span>
        <div>
          <span>{t('friends')}</span>
          <h1>מה משחקים אצל החברים?</h1>
          <p>הוסף חברים במייל, אשר בקשות וצפה ברשימות רק כשיש אישור שיתוף.</p>
        </div>
      </section>

      <form className="friend-search" onSubmit={submitSearch}>
        <Search size={18} />
        <input
          dir="ltr"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="friend@email.com"
          autoComplete="email"
          spellCheck="false"
          type="email"
        />
        <button type="submit" disabled={searching || !email.trim()}>
          {searching ? 'מחפש...' : 'חפש'}
        </button>
      </form>

      {searchMessage ? <div className="friend-note">{searchMessage}</div> : null}
      {searchResult ? (
        <article className="friend-card highlighted">
          <FriendIdentity profile={searchResult} />
          <button className="friend-action primary" type="button" onClick={sendRequest}>
            <UserPlus size={17} />
            שלח בקשה
          </button>
        </article>
      ) : null}

      {incomingFriendRequests.length ? (
        <section className="friends-panel">
          <h2>
            <Inbox size={18} />
            בקשות חברות
          </h2>
          <div className="friend-list">
            {incomingFriendRequests.map((friendship) => {
              const requester = friendProfiles[friendship.requesterId] || createFallbackProfile(friendship.requesterId)
              return (
                <article className="friend-card" key={friendship.id}>
                  <FriendIdentity profile={requester} />
                  <div className="friend-actions">
                    <button className="friend-action primary" type="button" onClick={() => onAcceptFriend(friendship)}>
                      <Check size={17} />
                      אשר
                    </button>
                    <button className="friend-action" type="button" onClick={() => onRejectFriend(friendship)}>
                      <X size={17} />
                      דחה
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      {incomingShareRequests.length ? (
        <section className="friends-panel">
          <h2>
            <Bell size={18} />
            בקשות שיתוף
          </h2>
          <div className="friend-list">
            {incomingShareRequests.map((request) => {
              const requester = friendProfiles[request.requesterId] || createFallbackProfile(request.requesterId)
              return (
                <article className="friend-card" key={request.id}>
                  <FriendIdentity profile={requester} />
                  <span className="share-request-text">
                    מבקש לראות את {request.scope === 'backlog' ? t('backlog') : 'הרשימה'}
                  </span>
                  <div className="friend-actions">
                    <button className="friend-action primary" type="button" onClick={() => onApproveShareRequest(request)}>
                      <Eye size={17} />
                      אשר
                    </button>
                    <button className="friend-action" type="button" onClick={() => onRejectShareRequest(request)}>
                      <EyeOff size={17} />
                      דחה
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      {outgoingFriendRequests.length ? (
        <section className="friends-panel subtle">
          <h2>
            <UserPlus size={18} />
            ממתין לאישור
          </h2>
          <div className="friend-list">
            {outgoingFriendRequests.map((friendship) => {
              const friendId = getOtherUserId(friendship, user.uid)
              return (
                <article className="friend-card" key={friendship.id}>
                  <FriendIdentity profile={friendProfiles[friendId] || createFallbackProfile(friendId)} />
                  <span className="friend-status-pill">נשלחה בקשה</span>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className="friends-panel">
        <h2>
          <Users size={18} />
          החברים שלי
        </h2>
        {acceptedFriends.length ? (
          <div className="friend-list">
            {acceptedFriends.map((friendship) => {
              const friendId = getOtherUserId(friendship, user.uid)
              const friend = friendProfiles[friendId] || createFallbackProfile(friendId)
              return (
                <FriendCard
                  friendship={friendship}
                  key={friendship.id}
                  onOpen={() => onOpenFriend(friendship)}
                  onRemove={() => onRemoveFriend(friendship)}
                  onRequestAccess={(scope) => onRequestAccess(friendId, scope)}
                  outgoingShareRequests={outgoingShareRequests}
                  profile={friend}
                  profileOwnerId={friendId}
                  t={t}
                  userId={user.uid}
                />
              )
            })}
          </div>
        ) : (
          <div className="empty-state compact">
            <Users size={38} />
            <strong>אין חברים עדיין</strong>
            <span>חפש לפי מייל ושלח בקשת חברות.</span>
          </div>
        )}
      </section>

      <section className="friends-panel subtle">
        <h2>
          <ShieldCheck size={18} />
          מה אתה משתף כרגע
        </h2>
        <div className="privacy-summary">
          <span className={getProfilePrivacy(profile).shareListWithFriends ? 'active' : ''}>
            {getProfilePrivacy(profile).shareListWithFriends ? <Eye size={16} /> : <EyeOff size={16} />}
            רשימת משחקים
          </span>
          <span className={getProfilePrivacy(profile).shareBacklogWithFriends ? 'active' : ''}>
            {getProfilePrivacy(profile).shareBacklogWithFriends ? <Eye size={16} /> : <EyeOff size={16} />}
            {t('backlog')}
          </span>
        </div>
      </section>
    </section>
  )
}

function FriendCard({
  friendship,
  onOpen,
  onRemove,
  onRequestAccess,
  outgoingShareRequests,
  profile,
  profileOwnerId,
  t,
  userId,
}) {
  const canViewList = canViewFriendScope(friendship, profileOwnerId, 'list')
  const canViewBacklog = canViewFriendScope(friendship, profileOwnerId, 'backlog')
  const listPending = hasPendingAccessRequest(outgoingShareRequests, profileOwnerId, 'list')
  const backlogPending = hasPendingAccessRequest(outgoingShareRequests, profileOwnerId, 'backlog')

  return (
    <article className="friend-card">
      <FriendIdentity profile={profile} />
      <div className="friend-permissions">
        <span className={canViewList ? 'active' : ''}>
          {canViewList ? <Eye size={15} /> : <EyeOff size={15} />}
          רשימה
        </span>
        <span className={canViewBacklog ? 'active' : ''}>
          {canViewBacklog ? <Eye size={15} /> : <EyeOff size={15} />}
          {t('backlog')}
        </span>
      </div>
      <div className="friend-actions">
        <button className="friend-action primary" type="button" onClick={onOpen}>
          פתח
        </button>
        {!canViewList ? (
          <button className="friend-action" type="button" onClick={() => onRequestAccess('list')} disabled={listPending}>
            {listPending ? 'נשלח' : 'בקש רשימה'}
          </button>
        ) : null}
        {!canViewBacklog ? (
          <button className="friend-action" type="button" onClick={() => onRequestAccess('backlog')} disabled={backlogPending}>
            {backlogPending ? 'נשלח' : 'בקש בקלוג'}
          </button>
        ) : null}
        <button className="friend-action danger-lite" type="button" onClick={onRemove}>
          הסר
        </button>
      </div>
      {friendship.requesterId === userId ? <span className="friend-owner-note">אתה שלחת את בקשת החברות</span> : null}
    </article>
  )
}

function FriendLibraryScreen({
  friend,
  friendship,
  games,
  loading,
  onBack,
  onRequestAccess,
  outgoingShareRequests,
  t,
}) {
  const friendId = friend?.uid || ''
  const canViewList = friendship && canViewFriendScope(friendship, friendId, 'list')
  const canViewBacklog = friendship && canViewFriendScope(friendship, friendId, 'backlog')
  const [view, setView] = useState(canViewList ? 'list' : 'backlog')
  const activeView = view === 'list' && !canViewList && canViewBacklog ? 'backlog' : view
  const visibleGames = activeView === 'backlog'
    ? sortBacklogGames(games.filter((game) => game.backlog))
    : games
  const listPending = hasPendingAccessRequest(outgoingShareRequests, friendId, 'list')
  const backlogPending = hasPendingAccessRequest(outgoingShareRequests, friendId, 'backlog')

  return (
    <section className="screen">
      <header className="topbar compact">
        <button className="icon-btn" type="button" onClick={onBack} title="חזור">
          <ChevronDown size={20} />
        </button>
        <div className="brand-row">
          <FriendAvatar profile={friend || createFallbackProfile(friendId)} />
          <div>
            <h1 className="friend-page-title">{friend?.displayName || 'חבר'}</h1>
            <p className="brand-sub">{friend?.email || 'MyGameLog'}</p>
          </div>
        </div>
      </header>

      <div className="friend-library-tabs">
        <button
          className={activeView === 'list' ? 'active' : ''}
          type="button"
          onClick={() => setView('list')}
          disabled={!canViewList}
        >
          <List size={17} />
          רשימה
        </button>
        <button
          className={activeView === 'backlog' ? 'active' : ''}
          type="button"
          onClick={() => setView('backlog')}
          disabled={!canViewBacklog}
        >
          <List size={17} />
          {t('backlog')}
        </button>
      </div>

      {!canViewList || !canViewBacklog ? (
        <div className="friend-access-box">
          {!canViewList ? (
            <button type="button" onClick={() => onRequestAccess(friendId, 'list')} disabled={listPending}>
              {listPending ? 'בקשת רשימה נשלחה' : 'בקש לראות רשימה'}
            </button>
          ) : null}
          {!canViewBacklog ? (
            <button type="button" onClick={() => onRequestAccess(friendId, 'backlog')} disabled={backlogPending}>
              {backlogPending ? 'בקשת בקלוג נשלחה' : 'בקש לראות בקלוג'}
            </button>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <div className="empty-state">
          <Sparkles size={42} />
          <strong>טוען רשימה...</strong>
        </div>
      ) : visibleGames.length ? (
        <div className="friend-games-grid">
          {visibleGames.map((game, index) => (
            <FriendGameCard game={game} key={game.id} rank={activeView === 'backlog' ? index + 1 : null} t={t} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Gamepad2 size={42} />
          <strong>{canViewList || canViewBacklog ? 'אין משחקים להצגה' : 'אין הרשאת צפייה עדיין'}</strong>
          <span>{canViewList || canViewBacklog ? 'החבר עוד לא הוסיף משחקים כאן.' : 'אפשר לשלוח בקשת שיתוף לחבר.'}</span>
        </div>
      )}
    </section>
  )
}

function FriendIdentity({ profile }) {
  return (
    <div className="friend-identity">
      <FriendAvatar profile={profile} />
      <span>
        <strong>{profile.displayName || 'חבר MyGameLog'}</strong>
        <small dir="ltr">{profile.email || profile.uid}</small>
        <em className={isProfileOnline(profile) ? 'online' : ''}>{formatLastSeen(profile.lastSeenAt)}</em>
      </span>
    </div>
  )
}

function FriendAvatar({ profile }) {
  const [failed, setFailed] = useState(false)
  const initial = (profile?.displayName || profile?.email || 'M').trim().charAt(0).toUpperCase()

  if (profile?.photoURL && !failed) {
    return <img className="friend-avatar" src={profile.photoURL} alt="" onError={() => setFailed(true)} referrerPolicy="no-referrer" />
  }

  return <span className="friend-avatar fallback">{initial}</span>
}

function FriendGameCard({ game, rank, t }) {
  return (
    <article className="friend-game-card">
      {rank ? <span className="shared-rank">{rank}</span> : null}
      <GameThumb game={game} cover />
      <div className="friend-game-body">
        <strong>{game.name}</strong>
        <small>{game.platform} {game.dev ? `· ${game.dev}` : ''}</small>
        <span>
          {game.backlog ? <em>{t('backlog')}</em> : null}
          <StatusBadge status={game.status} t={t} />
          {game.stars ? <small className="stars-text">{starText(game.stars)}</small> : null}
        </span>
      </div>
    </article>
  )
}

function StatsScreen({ games, onOpenGame, t }) {
  const owned = games.filter((game) => game.status === 'own' || game.status === 'done')
  const want = games.filter((game) => game.status === 'want')
  const done = games.filter((game) => game.status === 'done')
  const backlog = games.filter((game) => game.backlog)
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
          <img className="brand-icon" src="/mgl.png" alt="" />
          <Logo />
        </div>
      </header>

      <div className="stats-stack">
        <section className="panel">
          <h2>{t('summaryGeneral')}</h2>
          <div className="stat-grid">
            <StatCard value={owned.length} label={t('owned')} />
            <StatCard value={done.length} label={t('done')} />
            <StatCard value={want.length} label={t('want')} />
            <StatCard value={backlog.length} label={t('backlog')} />
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

function SettingsScreen({
  appVersion,
  deletingAccount,
  gamesCount,
  language,
  onDeleteAccount,
  onLanguageChange,
  onLogout,
  onPrivacyChange,
  profile,
  t,
  user,
}) {
  const initial = (user.displayName || user.email || 'E').trim().charAt(0).toUpperCase()
  const photoURL = user.photoURL || ''
  const [failedPhotoUrl, setFailedPhotoUrl] = useState('')
  const photoFailed = Boolean(photoURL && failedPhotoUrl === photoURL)
  const isGoogleUser = user.providerData?.some((provider) => provider.providerId === 'google.com')
    || /@gmail\.com$/i.test(user.email || '')
  const privacy = getProfilePrivacy(profile)
  const changePrivacy = (nextPrivacy) => {
    onPrivacyChange(nextPrivacy).catch((error) => {
      alert(`לא הצלחתי לעדכן פרטיות: ${getErrorMessage(error)}`)
    })
  }

  return (
    <section className="screen">
      <header className="topbar compact">
        <div className="brand-row">
          <img className="brand-icon" src="/mgl.png" alt="" />
          <div>
            <Logo />
            <p className="brand-sub">{t('settingsSubtitle')}</p>
          </div>
        </div>
      </header>

      <div className="settings-stack">
        <section className="settings-profile">
          <ProfileAvatar
            initial={initial}
            isGoogleUser={isGoogleUser}
            onPhotoError={() => setFailedPhotoUrl(photoURL)}
            photoFailed={photoFailed}
            photoURL={photoURL}
          />
          <div>
            <strong>{user.displayName || t('profileFallbackName')}</strong>
            <small>{user.email}</small>
          </div>
        </section>

        <section className="settings-panel">
          <h2>{t('language')}</h2>
          <div className="language-options" role="group" aria-label={t('language')}>
            {languageOptions.map((option) => (
              <button
                className={language === option.value ? 'active' : ''}
                key={option.value}
                type="button"
                onClick={() => onLanguageChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-panel">
          <h2>{t('account')}</h2>
          <button className="settings-action" type="button" onClick={onLogout}>
            <LogOut size={20} />
            <span>
              <strong>{t('logout')}</strong>
              <small>{t('logoutDescription')}</small>
            </span>
          </button>
          <button className="settings-action danger" type="button" onClick={onDeleteAccount} disabled={deletingAccount}>
            <Trash2 size={20} />
            <span>
              <strong>{deletingAccount ? t('deletingAccount') : t('deleteAccount')}</strong>
              <small>{t('deleteAccountDescription', { count: gamesCount })}</small>
            </span>
          </button>
        </section>

        <section className="settings-panel">
          <h2>{t('privacy')}</h2>
          <label className="settings-toggle">
            <input
              checked={privacy.shareListWithFriends}
              type="checkbox"
              onChange={(event) => changePrivacy({ shareListWithFriends: event.target.checked })}
            />
            <span>
              <strong>חברים יכולים לראות את הרשימה שלי</strong>
              <small>רק חברים שאישרת יראו את רשימת המשחקים שלך.</small>
            </span>
          </label>
          <label className="settings-toggle">
            <input
              checked={privacy.shareBacklogWithFriends}
              type="checkbox"
              onChange={(event) => changePrivacy({ shareBacklogWithFriends: event.target.checked })}
            />
            <span>
              <strong>חברים יכולים לראות את הבקלוג שלי</strong>
              <small>אפשר לכבות ולהדליק בכל רגע.</small>
            </span>
          </label>
          <div className="info-row">
            <ShieldCheck size={20} />
            <span>{t('privacyStorage')}</span>
          </div>
          <div className="info-row">
            <UserRound size={20} />
            <span>{t('privacyAuth')}</span>
          </div>
        </section>

        <section className="settings-panel">
          <h2>{t('app')}</h2>
          <div className="info-row">
            <Info size={20} />
            <span>{t('version', { version: appVersion })}</span>
          </div>
        </section>
      </div>
    </section>
  )
}

function ProfileAvatar({ initial, isGoogleUser, onPhotoError, photoFailed, photoURL }) {
  if (photoURL && !photoFailed) {
    return (
      <span className="settings-avatar">
        <img src={photoURL} alt="" onError={onPhotoError} referrerPolicy="no-referrer" />
      </span>
    )
  }

  return (
    <span className={isGoogleUser ? 'settings-avatar google-avatar' : 'settings-avatar'}>
      {isGoogleUser ? 'G' : <UserRound size={27} />}
      {isGoogleUser ? <small>Google</small> : <small>{initial}</small>}
    </span>
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
      rawgId: game.id || '',
      released: game.released || '',
      rawgRating: Number(game.rating) || 0,
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
        backlog: form.backlog,
        dev: form.dev || 'לא ידוע',
        tags: form.tags.length ? form.tags : ['action'],
        icon: form.icon,
        bg: form.bg,
        image: form.image,
        rawgId: form.rawgId,
        released: form.released,
        rawgRating: form.rawgRating,
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

      {form.image ? (
        <div className="cover-preview">
          <img src={form.image} alt="" />
        </div>
      ) : null}

      <label className="field">
        <span>תמונת קאבר</span>
        <input
          dir="ltr"
          value={form.image}
          onChange={(event) => update('image', event.target.value)}
          placeholder="https://..."
        />
      </label>

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

      <label className="toggle-row">
        <input
          checked={form.backlog}
          type="checkbox"
          onChange={(event) => update('backlog', event.target.checked)}
        />
        <span>
          <strong>להוסיף לבקלוג</strong>
          <small>משחק שאני רוצה לחזור אליו אחר כך</small>
        </span>
      </label>

      <button className="primary-btn" type="button" onClick={submit} disabled={saving}>
        <Plus size={18} />
        הוסף לקטלוג
      </button>
    </BottomSheet>
  )
}

function GameSheet({ game, onClose, onDelete, onSave, onShare }) {
  const [form, setForm] = useState(() => ({
      stars: game.stars || 0,
      status: game.status || 'own',
      backlog: Boolean(game.backlog),
      tags: [...(game.tags || [])],
      note: game.note || '',
      price: game.price || '',
      platform: game.platform || '',
      dev: game.dev || '',
      image: game.image || '',
      released: game.released || '',
      rawgRating: game.rawgRating || 0,
  }))
  const [refreshing, setRefreshing] = useState(false)

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const updateStatus = (status) =>
    setForm((current) => ({
      ...current,
      status,
      backlog: status === 'done' ? false : current.backlog,
    }))
  const toggleTag = (tag) =>
    update(
      'tags',
      form.tags.includes(tag) ? form.tags.filter((item) => item !== tag) : [...form.tags, tag],
    )

  const submit = () =>
    onSave(game.id, {
      stars: form.stars,
      status: form.status,
      backlog: form.backlog,
      tags: form.tags,
      note: form.note,
      price: Number(form.price) || 0,
      platform: form.platform,
      dev: form.dev || 'לא ידוע',
      image: form.image,
      released: form.released,
      rawgRating: Number(form.rawgRating) || 0,
    })

  const refreshDetails = async () => {
    setRefreshing(true)
    try {
      const response = await fetch(
        `https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${encodeURIComponent(game.name)}&page_size=1`,
      )
      const data = await response.json()
      const match = data.results?.[0]
      if (!match) return

      setForm((current) => ({
        ...current,
        image: match.background_image || current.image,
        platform: mapRawgPlatform(match.platforms) || current.platform,
        released: match.released || current.released,
        rawgRating: Number(match.rating) || current.rawgRating,
        tags: mapRawgGenres(match.genres).length ? mapRawgGenres(match.genres) : current.tags,
      }))
    } catch (error) {
      console.error(error)
      alert(`לא הצלחתי לעדכן פרטים: ${getErrorMessage(error)}`)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <BottomSheet title={game.name} subtitle={form.dev || ''} media={<GameThumb game={{ ...game, image: form.image }} large />} onClose={onClose}>
      <GameHero game={{ ...game, ...form }} />

      <div className="sheet-actions-row">
        <button className="secondary-btn" type="button" onClick={() => onShare({ ...game, ...form })}>
          <Share2 size={18} />
          שתף משחק
        </button>
        <button
          className="secondary-btn"
          type="button"
          onClick={() => updateStatus(form.status === 'done' ? 'own' : 'done')}
        >
          <Check size={18} />
          {form.status === 'done' ? 'לא שיחקתי' : 'שיחקתי'}
        </button>
      </div>

      <button className="secondary-btn" type="button" onClick={refreshDetails} disabled={refreshing}>
        <Sparkles size={18} />
        {refreshing ? 'מעדכן...' : 'עדכן תמונה ופרטים'}
      </button>

      <StatusButtons value={form.status} onChange={updateStatus} />

      <label className="toggle-row">
        <input
          checked={form.backlog}
          type="checkbox"
          onChange={(event) => update('backlog', event.target.checked)}
        />
        <span>
          <strong>נמצא בקלוג</strong>
          <small>אפשר לסמן אחר כך כששיחקת בו</small>
        </span>
      </label>

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

      <label className="field">
        <span>תמונת קאבר</span>
        <input
          dir="ltr"
          value={form.image}
          onChange={(event) => update('image', event.target.value)}
          placeholder="https://..."
        />
      </label>

      <div className="form-grid">
        <label className="field">
          <span>מפתח / סטודיו</span>
          <input value={form.dev} onChange={(event) => update('dev', event.target.value)} placeholder="לא ידוע" />
        </label>
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

function GameHero({ game }) {
  const tags = (game.tags || []).slice(0, 3)
  const rating = Number(game.rawgRating) || 0

  return (
    <section className="game-hero">
      {game.image ? (
        <img src={game.image} alt="" />
      ) : (
        <div className={`game-hero-fallback ${game.bg || 'bg-purple'}`}>
          <span>{game.icon || '🎮'}</span>
        </div>
      )}
      <div className="game-hero-meta">
        {game.backlog ? <span className="meta-pill highlight">בקלוג</span> : null}
        <span className="meta-pill">{game.platform || 'פלטפורמה'}</span>
        {game.released ? <span className="meta-pill">{new Date(game.released).getFullYear()}</span> : null}
        {rating ? <span className="meta-pill">{rating}/5 RAWG</span> : null}
        {tags.map((tag) => (
          <span className="meta-pill" key={tag}>{TAG_LABELS[tag] || tag}</span>
        ))}
      </div>
    </section>
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

function BottomNav({ screen, setScreen, t }) {
  return (
    <nav className="bottom-nav">
      <button className={screen === 'home' ? 'active' : ''} type="button" onClick={() => setScreen('home')}>
        <Home size={22} />
        <span>{t('home')}</span>
      </button>
      <button className={screen === 'backlog' ? 'active' : ''} type="button" onClick={() => setScreen('backlog')}>
        <List size={22} />
        <span>{t('backlog')}</span>
      </button>
      <button className={screen === 'friends' ? 'active' : ''} type="button" onClick={() => setScreen('friends')}>
        <Users size={22} />
        <span>{t('friends')}</span>
      </button>
      <button className={screen === 'discover' ? 'active' : ''} type="button" onClick={() => setScreen('discover')}>
        <Search size={22} />
        <span>{t('search')}</span>
      </button>
      <button className={screen === 'stats' ? 'active' : ''} type="button" onClick={() => setScreen('stats')}>
        <BarChart3 size={22} />
        <span>{t('summary')}</span>
      </button>
      <button className={screen === 'settings' ? 'active' : ''} type="button" onClick={() => setScreen('settings')}>
        <Settings size={22} />
        <span>{t('settings')}</span>
      </button>
    </nav>
  )
}

function GameRow({ game, onOpen, t }) {
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
        {game.backlog ? <span className="mini-badge">{t('backlog')}</span> : null}
        <StatusBadge status={game.status} t={t} />
        {game.stars ? <small className="stars-text">{starText(game.stars)}</small> : null}
        {game.price ? <small>₪{game.price}</small> : null}
      </span>
    </button>
  )
}

function GameCard({ game, onOpen, t }) {
  return (
    <button className="game-card" type="button" onClick={() => onOpen(game.id)}>
      <GameThumb game={game} cover />
      <span className="game-card-body">
        <strong>{game.name}</strong>
        <small>
          {game.platform} {game.dev ? `· ${game.dev}` : ''}
        </small>
        <span className="game-card-meta">
          <span className="game-card-badges">
            {game.backlog ? <span className="mini-badge">{t('backlog')}</span> : null}
            <StatusBadge status={game.status} t={t} />
          </span>
          {game.stars ? <small className="stars-text">{starText(game.stars)}</small> : null}
        </span>
      </span>
    </button>
  )
}

function GameThumb({ compact, cover, game, large }) {
  const className = ['game-thumb', compact ? 'compact' : '', cover ? 'cover' : '', large ? 'large' : '', game.bg || 'bg-purple']
    .filter(Boolean)
    .join(' ')

  if (game.image) {
    return <img className={className} src={game.image} alt="" />
  }

  return <span className={className}>{game.icon || '🎮'}</span>
}

function StatusBadge({ status, t = createTranslator(DEFAULT_LANGUAGE) }) {
  return <span className={`status-badge ${status || 'own'}`}>{getStatusLabel(status || 'own', t)}</span>
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

async function reauthenticateCurrentUser() {
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('אין משתמש מחובר')

  if (isNativeApp()) {
    const result = await FirebaseAuthentication.signInWithGoogle({
      skipNativeAuth: true,
      useCredentialManager: false,
    })
    const idToken = result.credential?.idToken
    if (!idToken) throw new Error('Google לא החזיר token לאפליקציה')

    const credential = GoogleAuthProvider.credential(idToken)
    await reauthenticateWithCredential(currentUser, credential)
    return
  }

  await reauthenticateWithPopup(currentUser, googleProvider)
}

async function deleteUserGames(userId) {
  const gamesQuery = query(collection(db, gamesCollection), where('userId', '==', userId))
  const snapshot = await getDocs(gamesQuery)
  const docs = [...snapshot.docs]

  while (docs.length) {
    const batch = writeBatch(db)
    docs.splice(0, 450).forEach((gameDoc) => batch.delete(gameDoc.ref))
    await batch.commit()
  }

  await waitForPendingWrites(db)
}

function toShareGame(game) {
  return {
    name: game.name || 'משחק ללא שם',
    platform: game.platform || '',
    dev: game.dev || '',
    status: game.status || 'own',
    backlog: Boolean(game.backlog),
    stars: Number(game.stars) || 0,
    tags: Array.isArray(game.tags) ? game.tags.slice(0, 6) : [],
    image: game.image || '',
    icon: game.icon || '',
    bg: game.bg || 'bg-purple',
    released: game.released || '',
    rawgRating: Number(game.rawgRating) || 0,
    backlogOrder: Number.isFinite(getBacklogOrder(game)) ? getBacklogOrder(game) : 0,
  }
}

async function createShareUrl(payload) {
  const baseUrl = getShareBaseUrl()
  const encoded = encodeShare(payload)

  try {
    const docRef = await addDoc(collection(db, sharesCollection), {
      ...payload,
      createdAt: serverTimestamp(),
      snapshotCreatedAt: Date.now(),
    })
    return encoded.length < 6000 ? `${baseUrl}?share=${docRef.id}#share=${encoded}` : `${baseUrl}?share=${docRef.id}`
  } catch (error) {
    console.info('Firestore share failed, using encoded share link:', error)
    return `${baseUrl}#share=${encoded}`
  }
}

function getShareBaseUrl() {
  if (isNativeApp()) return PUBLIC_WEB_URL
  return `${window.location.origin}${window.location.pathname}`
}

async function shareUrl({ title, text, url }) {
  if (navigator.share) {
    await navigator.share({ title, text, url })
    return
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
    return
  }

  window.prompt('העתק את הקישור', url)
}

function encodeShare(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function parseEncodedShare(encoded) {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(encoded.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

function Logo({ size = 'normal' }) {
  return (
    <div className={size === 'large' ? 'logo large' : 'logo'}>
      My<span>Game</span><em>Log</em>
    </div>
  )
}

function normalizeGame(item) {
  const data = item.data()
  const backlogOrder = getBacklogOrder(data)
  return {
    id: item.id,
    ...data,
    name: typeof data.name === 'string' && data.name.trim() ? data.name : 'משחק ללא שם',
    platform: typeof data.platform === 'string' ? data.platform : '',
    dev: typeof data.dev === 'string' && data.dev.trim() ? data.dev : 'לא ידוע',
    tags: Array.isArray(data.tags) ? data.tags.filter(Boolean) : [],
    status: typeof data.status === 'string' ? data.status : 'own',
    backlog: Boolean(data.backlog),
    price: Number(data.price) || 0,
    stars: Number(data.stars) || 0,
    note: typeof data.note === 'string' ? data.note : '',
    icon: typeof data.icon === 'string' ? data.icon : '',
    bg: typeof data.bg === 'string' ? data.bg : 'bg-purple',
    image: typeof data.image === 'string' ? data.image : '',
    rawgId: data.rawgId || '',
    released: typeof data.released === 'string' ? data.released : '',
    rawgRating: Number(data.rawgRating) || 0,
    backlogOrder: Number.isFinite(backlogOrder) ? backlogOrder : null,
  }
}

function sortBacklogGames(games) {
  return [...games].sort((a, b) => {
    const aOrder = getBacklogOrder(a)
    const bOrder = getBacklogOrder(b)
    if (aOrder !== bOrder) return aOrder - bOrder

    const aCreatedAt = getGameCreatedAt(a)
    const bCreatedAt = getGameCreatedAt(b)
    if (aCreatedAt !== bCreatedAt) return aCreatedAt - bCreatedAt

    return String(a.name || '').localeCompare(String(b.name || ''), 'he')
  })
}

function getBacklogOrder(game) {
  if (game.backlogOrder === null || game.backlogOrder === undefined || game.backlogOrder === '') {
    return Number.POSITIVE_INFINITY
  }
  const order = Number(game.backlogOrder)
  return Number.isFinite(order) ? order : Number.POSITIVE_INFINITY
}

function getGameCreatedAt(game) {
  if (typeof game.createdAt === 'number') return game.createdAt
  if (typeof game.createdAt?.toMillis === 'function') return game.createdAt.toMillis()
  return 0
}

function moveItem(items, fromIndex, toIndex) {
  const next = [...items]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

function findBacklogDropTarget(clientY, sourceId) {
  const rows = [...document.querySelectorAll('[data-backlog-id]')].filter(
    (row) => row.dataset.backlogId !== sourceId,
  )
  if (!rows.length) return sourceId

  return rows.reduce((best, row) => {
    const rect = row.getBoundingClientRect()
    const distance = Math.abs(clientY - (rect.top + rect.height / 2))
    if (!best || distance < best.distance) {
      return { id: row.dataset.backlogId, distance }
    }
    return best
  }, null)?.id
}

async function fetchRawgGames(term) {
  const response = await fetch(
    `https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${encodeURIComponent(term)}&page_size=12`,
  )
  const data = await response.json()
  if (!response.ok) throw new Error(data?.detail || 'החיפוש נכשל')
  return data.results || []
}

function createGameFromRawg(rawgGame, mode) {
  const known = findKnownGame(rawgGame.name || '')
  const fallback = getFallbackIcon()
  const mappedTags = mapRawgGenres(rawgGame.genres)
  const status = mode === 'want' ? 'want' : 'own'

  return {
    name: rawgGame.name || 'משחק ללא שם',
    platform: mapRawgPlatform(rawgGame.platforms) || PLATFORMS[0],
    price: 0,
    status,
    backlog: mode === 'backlog',
    dev: known?.dev || 'לא ידוע',
    tags: mappedTags.length ? mappedTags : known?.tags || ['action'],
    icon: known?.icon || fallback.icon,
    bg: known?.bg || fallback.bg,
    image: rawgGame.background_image || '',
    rawgId: rawgGame.id || '',
    released: rawgGame.released || '',
    rawgRating: Number(rawgGame.rating) || 0,
  }
}

function findExistingGame(games, rawgGame) {
  const rawgId = rawgGame.id ? String(rawgGame.id) : ''
  const rawgName = String(rawgGame.name || '').trim().toLowerCase()
  return games.find((game) => {
    const gameRawgId = game.rawgId ? String(game.rawgId) : ''
    const gameName = String(game.name || '').trim().toLowerCase()
    return (rawgId && gameRawgId === rawgId) || (rawgName && gameName === rawgName)
  })
}

function formatRawgMeta(game) {
  const year = game.released ? new Date(game.released).getFullYear() : ''
  const platform = mapRawgPlatform(game.platforms) || (game.platforms || [])[0]?.platform?.name || ''
  const rating = Number(game.rating) ? `${Number(game.rating).toFixed(1)}/5 RAWG` : ''
  return [platform, year, rating].filter(Boolean).join(' · ') || 'פרטים לא זמינים'
}

function getErrorMessage(error) {
  if (!error) return 'שגיאה לא ידועה'
  if (typeof error === 'string') return error
  return error.message || String(error)
}

function getLanguageConfig(value) {
  return languageOptions.find((option) => option.value === value) || languageOptions[0]
}

function createTranslator(language) {
  const dictionary = translations[language] || translations[DEFAULT_LANGUAGE]
  const fallback = translations[DEFAULT_LANGUAGE]

  return (key, params = {}) => {
    const value = dictionary[key] ?? fallback[key] ?? key
    return typeof value === 'function' ? value(params) : value
  }
}

function getStatusLabel(status, t) {
  if (status === 'want') return t('want')
  if (status === 'done') return t('done')
  return t('owned')
}

async function syncUserProfile(user) {
  const profileRef = doc(db, profilesCollection, user.uid)
  const snapshot = await getDoc(profileRef)
  const existing = snapshot.exists() ? snapshot.data() : {}
  const privacy = getProfilePrivacy(existing)

  await setDoc(profileRef, {
    uid: user.uid,
    displayName: user.displayName || existing.displayName || user.email || 'MyGameLog',
    email: user.email || existing.email || '',
    emailLower: (user.email || existing.email || '').toLowerCase(),
    photoURL: user.photoURL || existing.photoURL || '',
    privacy,
    stats: existing.stats || { gamesCount: 0, backlogCount: 0, doneCount: 0 },
    createdAt: existing.createdAt || Date.now(),
    lastSeenAt: Date.now(),
    updatedAt: Date.now(),
  }, { merge: true })
}

function normalizeProfile(uid, data = {}, fallbackUser = null) {
  return {
    uid,
    displayName: data.displayName || fallbackUser?.displayName || fallbackUser?.email || 'MyGameLog',
    email: data.email || fallbackUser?.email || '',
    emailLower: (data.emailLower || data.email || fallbackUser?.email || '').toLowerCase(),
    photoURL: data.photoURL || fallbackUser?.photoURL || '',
    privacy: getProfilePrivacy(data),
    stats: data.stats || { gamesCount: 0, backlogCount: 0, doneCount: 0 },
    lastSeenAt: Number(data.lastSeenAt) || 0,
  }
}

function createFallbackProfile(uid) {
  return {
    uid,
    displayName: 'חבר MyGameLog',
    email: '',
    emailLower: '',
    photoURL: '',
    privacy: { ...defaultPrivacy },
    stats: { gamesCount: 0, backlogCount: 0, doneCount: 0 },
    lastSeenAt: 0,
  }
}

function getProfilePrivacy(profile) {
  return {
    shareListWithFriends: Boolean(profile?.privacy?.shareListWithFriends),
    shareBacklogWithFriends: Boolean(profile?.privacy?.shareBacklogWithFriends),
  }
}

function getProfilePrivacyPermissions(profile) {
  const privacy = getProfilePrivacy(profile)
  return {
    list: privacy.shareListWithFriends,
    backlog: privacy.shareBacklogWithFriends,
  }
}

function getFriendshipId(userId, otherId) {
  return [userId, otherId].sort().join('__')
}

function getShareRequestId(requesterId, ownerId, scope) {
  return `${requesterId}__${ownerId}__${scope}`
}

function createFriendPermissions(userId, otherId, profile) {
  return {
    [userId]: getProfilePrivacyPermissions(profile),
    [otherId]: { list: false, backlog: false },
  }
}

function normalizeFriendship(item) {
  const data = item.data()
  return {
    id: item.id,
    users: Array.isArray(data.users) ? data.users : [],
    requesterId: data.requesterId || '',
    recipientId: data.recipientId || '',
    status: data.status || 'pending',
    permissions: data.permissions || {},
    createdAt: data.createdAt || 0,
    updatedAt: data.updatedAt || 0,
  }
}

function normalizeShareRequest(item) {
  const data = item.data()
  return {
    id: item.id,
    requesterId: data.requesterId || '',
    ownerId: data.ownerId || '',
    scope: data.scope === 'backlog' ? 'backlog' : 'list',
    status: data.status || 'pending',
    createdAt: data.createdAt || 0,
  }
}

function getOtherUserId(friendship, userId) {
  if (!friendship || !userId) return ''
  return friendship.users.find((id) => id !== userId) || ''
}

function canViewFriendScope(friendship, ownerId, scope) {
  return Boolean(friendship?.status === 'accepted' && friendship.permissions?.[ownerId]?.[scope])
}

function hasPendingAccessRequest(requests, ownerId, scope) {
  return requests.some((request) => request.ownerId === ownerId && request.scope === scope && request.status === 'pending')
}

function isProfileOnline(profile) {
  return Boolean(profile?.lastSeenAt && Date.now() - profile.lastSeenAt < 5 * 60 * 1000)
}

function formatLastSeen(lastSeenAt) {
  if (!lastSeenAt) return 'לא נראה לאחרונה'
  const diffMinutes = Math.max(0, Math.floor((Date.now() - lastSeenAt) / 60000))
  if (diffMinutes < 5) return 'מחובר עכשיו'
  if (diffMinutes < 60) return `נראה לפני ${diffMinutes} דק׳`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `נראה לפני ${diffHours} שעות`
  return 'לא היה מחובר היום'
}

async function deleteUserSocialData(userId) {
  const batch = writeBatch(db)
  batch.delete(doc(db, profilesCollection, userId))

  const friendshipsQuery = query(collection(db, friendshipsCollection), where('users', 'array-contains', userId))
  const friendshipsSnapshot = await getDocs(friendshipsQuery)
  friendshipsSnapshot.docs.forEach((item) => batch.delete(item.ref))

  const incomingShareQuery = query(collection(db, shareRequestsCollection), where('ownerId', '==', userId))
  const incomingShareSnapshot = await getDocs(incomingShareQuery)
  incomingShareSnapshot.docs.forEach((item) => batch.delete(item.ref))

  const outgoingShareQuery = query(collection(db, shareRequestsCollection), where('requesterId', '==', userId))
  const outgoingShareSnapshot = await getDocs(outgoingShareQuery)
  outgoingShareSnapshot.docs.forEach((item) => batch.delete(item.ref))

  await batch.commit()
}

function isNativeApp() {
  return Boolean(window.Capacitor?.isNativePlatform?.())
}

function createEmptyForm() {
  const fallback = getFallbackIcon()
  return {
    name: '',
    platform: '',
    price: '',
    status: 'own',
    backlog: false,
    dev: 'לא ידוע',
    tags: ['action'],
    image: '',
    rawgId: '',
    released: '',
    rawgRating: 0,
    icon: fallback.icon,
    bg: fallback.bg,
  }
}

export default App
