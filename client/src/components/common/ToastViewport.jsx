import { Check, X } from 'lucide-react'
import { useUI } from '../../context/UIContext'

export default function ToastViewport() {
  const { toasts } = useUI()
  return <div className="toast-viewport" aria-live="polite">{toasts.map((toast) => <div className={`toast toast-${toast.type}`} key={toast.id}><Check size={17} />{toast.message}<X size={14} className="toast-close" /></div>)}</div>
}
