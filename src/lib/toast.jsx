/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null)
  const timer = useRef(null)

  const showError = useCallback((text) => {
    if (timer.current) clearTimeout(timer.current)
    setMsg(text)
    timer.current = setTimeout(() => setMsg(null), 4000)
  }, [])

  return (
    <ToastCtx.Provider value={showError}>
      {children}
      {msg && (
        <div
          onClick={() => setMsg(null)}
          className="fixed bottom-4 right-4 z-[100] bg-brand-danger text-white text-sm font-normal px-4 py-3 shadow-modal max-w-xs cursor-pointer"
        >
          {msg}
        </div>
      )}
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
