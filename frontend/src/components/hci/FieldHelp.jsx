import { useId, useState } from 'react'

/** Multi-level help — brief tooltip on focus/hover (HCI #9). */
export default function FieldHelp({ text }) {
  const id = useId()
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-flex ml-1 align-middle">
      <button
        type="button"
        className="w-4 h-4 rounded-full text-[10px] font-bold text-brand-600 bg-brand-50
                   dark:bg-brand-900/40 dark:text-brand-300 hover:bg-brand-100"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label="Field help"
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-1 w-48 px-2 py-1.5
                     text-xs rounded-lg bg-gray-900 text-white shadow-lg dark:bg-gray-700"
        >
          {text}
        </span>
      )}
    </span>
  )
}
