import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title = "Konfirmasi",
  description = "Apakah Anda yakin?",
  confirmText = "Ya",
  cancelText = "Batal",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    // Focus primary button
    const t = window.setTimeout(() => confirmBtnRef.current?.focus(), 0);

    // ✅ Prevent layout shift (scrollbar disappear)
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
    >
      {/* ✅ Backdrop pakai div (bukan button) biar ga ada outline fokus */}
      <div
        className="absolute inset-0 bg-black/50"
        onMouseDown={() => {
          if (!loading) onCancel();
        }}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <div className="p-5">
          <h2
            id="confirm-title"
            className="text-base sm:text-lg font-bold text-gray-900 dark:text-white"
          >
            {title}
          </h2>
          <p
            id="confirm-desc"
            className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
          >
            {description}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-10 rounded-lg px-4 text-sm font-semibold border
              border-gray-300 bg-white text-gray-700 hover:bg-gray-50
              dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600
              disabled:opacity-60 disabled:cursor-not-allowed
              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
          >
            {cancelText}
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-10 rounded-lg px-4 text-sm font-bold text-white
              bg-blue-600 hover:bg-blue-700
              disabled:opacity-60 disabled:cursor-not-allowed
              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
          >
            {loading ? "Memproses..." : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
