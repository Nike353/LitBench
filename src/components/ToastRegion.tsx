import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

const icons = {
  default: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
};

export function ToastRegion() {
  const toasts = useWorkspaceStore((state) => state.toasts);
  const remove = useWorkspaceStore((state) => state.removeToast);
  return (
    <div className="toast-region" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const Icon = icons[toast.tone];
        return (
          <div className={`toast ${toast.tone}`} key={toast.id}>
            <Icon size={17} aria-hidden="true" />
            <span>{toast.message}</span>
            <button onClick={() => remove(toast.id)} aria-label="Dismiss notification">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
