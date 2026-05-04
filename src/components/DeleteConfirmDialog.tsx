import { motion, AnimatePresence } from 'framer-motion'
import { GlowCard } from './GlowCard'

interface DeleteConfirmDialogProps {
  clientName?: string
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteConfirmDialog({
  clientName,
  open,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 14 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-md"
          >
            <GlowCard>
              <div className="p-5">
                <h2 className="text-lg font-semibold text-slate-900">Remove Client</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Are you sure you want to remove <span className="font-medium">{clientName ?? 'this client'}</span>?
                </p>
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
