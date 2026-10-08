import { useState, useRef } from 'react'

export default function TabBar({ openFiles, activeFile, onSelect, onClose, dirtyFiles, onReorder }) {
  const [dragIndex, setDragIndex] = useState(null)
  const [dropIndex, setDropIndex] = useState(null)
  const dragNode = useRef(null)

  if (openFiles.length === 0) return null

  const handleDragStart = (e, index) => {
    setDragIndex(index)
    dragNode.current = e.currentTarget
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
    requestAnimationFrame(() => {
      if (dragNode.current) dragNode.current.style.opacity = '0.4'
    })
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (index !== dropIndex) setDropIndex(index)
  }

  const handleDragEnd = () => {
    if (dragNode.current) dragNode.current.style.opacity = '1'
    if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
      onReorder(dragIndex, dropIndex)
    }
    setDragIndex(null)
    setDropIndex(null)
    dragNode.current = null
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: 'var(--ink-750)',
        borderBottom: '1px solid var(--rule)',
        overflowX: 'auto',
        overflowY: 'hidden',
        flexShrink: 0,
        height: '36px',
      }}
    >
      {openFiles.map((name, index) => {
        const isActive = name === activeFile
        const isDirty = dirtyFiles && dirtyFiles.has(name)
        const isDropTarget = dropIndex === index && dragIndex !== null && dragIndex !== index
        return (
          <div
            key={name}
            className="nova-tab"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelect(name)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 12px',
              cursor: 'grab',
              backgroundColor: isActive ? 'var(--ink-800)' : 'transparent',
              borderTop: isActive ? '2px solid var(--vermilion)' : '2px solid transparent',
              borderRight: '1px solid var(--rule-soft)',
              borderLeft: isDropTarget ? '2px solid var(--lapis)' : '2px solid transparent',
              color: isActive ? 'var(--vellum)' : 'var(--vellum-dim)',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '13px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'border-left-color 0.1s',
            }}
          >
            <span>{name}</span>
            {isDirty && (
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--gold)',
                  flexShrink: 0,
                }}
              />
            )}
            {openFiles.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClose(name)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isActive ? 'var(--vellum-mid)' : 'var(--vellum-dim)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: '0',
                  lineHeight: 1,
                }}
              >
                &#x2715;
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
