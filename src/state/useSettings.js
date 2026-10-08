import { useState, useCallback, useEffect } from 'react'
import { get, set } from 'idb-keyval'

const SETTINGS_KEY = 'nova:settings'

const DEFAULTS = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: false,
  minimap: false,
  theme: 'dark',
}

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    get(SETTINGS_KEY).then((saved) => {
      if (saved) setSettings({ ...DEFAULTS, ...saved })
      setLoaded(true)
    })
  }, [])

  const update = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      set(SETTINGS_KEY, next)
      return next
    })
  }, [])

  return { settings, update, loaded }
}
