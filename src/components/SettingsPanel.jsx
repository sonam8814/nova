import { useEffect, useRef } from 'react'

export default function SettingsPanel({ settings, onUpdate, onClose }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('pointerdown', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('pointerdown', handleClick)
    }
  }, [onClose])

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        bottom: '32px',
        right: '12px',
        width: '260px',
        backgroundColor: 'var(--ink-700)',
        border: '1px solid var(--rule)',
        borderRadius: '6px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        zIndex: 200,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '12px',
        color: 'var(--vellum)',
      }}
    >
      <div style={{
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--vellum-mid)',
        borderBottom: '1px solid var(--rule-soft)',
        paddingBottom: '8px',
      }}>
        Settings
      </div>

      <SettingRow label="Font Size">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="range"
            min={10}
            max={24}
            value={settings.fontSize}
            onChange={(e) => onUpdate('fontSize', Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--lapis)' }}
          />
          <span style={{ minWidth: '24px', textAlign: 'right', color: 'var(--vellum-mid)' }}>
            {settings.fontSize}
          </span>
        </div>
      </SettingRow>

      <SettingRow label="Tab Size">
        <div style={{ display: 'flex', gap: '6px' }}>
          {[2, 4, 8].map(size => (
            <TabButton
              key={size}
              active={settings.tabSize === size}
              onClick={() => onUpdate('tabSize', size)}
            >
              {size}
            </TabButton>
          ))}
        </div>
      </SettingRow>

      <SettingRow label="Word Wrap">
        <Toggle
          checked={settings.wordWrap}
          onChange={(val) => onUpdate('wordWrap', val)}
        />
      </SettingRow>

      <SettingRow label="Minimap">
        <Toggle
          checked={settings.minimap}
          onChange={(val) => onUpdate('minimap', val)}
        />
      </SettingRow>

      <SettingRow label="Theme">
        <div style={{ display: 'flex', gap: '6px' }}>
          {[['dark', 'Dark'], ['light', 'Light'], ['system', 'System']].map(([val, label]) => (
            <TabButton
              key={val}
              active={settings.theme === val}
              onClick={() => onUpdate('theme', val)}
            >
              {label}
            </TabButton>
          ))}
        </div>
      </SettingRow>
    </div>
  )
}

function SettingRow({ label, children }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
    }}>
      <span style={{ color: 'var(--vellum)', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        {children}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        minWidth: '32px',
        height: '24px',
        padding: '0 8px',
        borderRadius: '3px',
        border: active ? '1px solid var(--lapis)' : '1px solid var(--rule)',
        backgroundColor: active ? 'var(--ink-800)' : 'transparent',
        color: active ? 'var(--lapis)' : 'var(--vellum-dim)',
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '12px',
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: '36px',
        height: '20px',
        borderRadius: '10px',
        border: 'none',
        backgroundColor: checked ? 'var(--lapis)' : 'var(--rule)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background-color 0.15s',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        backgroundColor: 'var(--vellum)',
        position: 'absolute',
        top: '3px',
        left: checked ? '19px' : '3px',
        transition: 'left 0.15s',
      }} />
    </button>
  )
}
