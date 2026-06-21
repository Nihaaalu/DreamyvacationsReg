import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export type NotificationType = 'success' | 'warning' | 'error';

interface NotificationProps {
  message: string;
  type: NotificationType;
  isVisible: boolean;
  onClose: () => void;
}

export default function Notification({ message, type, isVisible, onClose }: NotificationProps) {
  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-100',
          text: 'text-emerald-800',
          iconColor: 'text-emerald-500',
          Icon: CheckCircle2,
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-100',
          text: 'text-amber-800',
          iconColor: 'text-amber-500',
          Icon: AlertTriangle,
        };
      case 'error':
        default:
          return {
            bg: 'bg-rose-50 border-rose-100',
            text: 'text-rose-800',
            iconColor: 'text-rose-500',
            Icon: AlertCircle,
          };
    }
  };

  const { bg, text, iconColor, Icon } = getColors();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={`fixed top-6 right-6 z-[100] max-w-sm w-full p-4 rounded-xl border shadow-xl flex items-start gap-3.5 backdrop-blur-md ${bg} ${text} no-print`}
        >
          <Icon className={`h-5 w-5 shrink-0 ${iconColor} mt-0.5`} />
          <div className="flex-1 text-sm font-medium leading-relaxed">
            {message}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors text-slate-400 hover:text-slate-600"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
