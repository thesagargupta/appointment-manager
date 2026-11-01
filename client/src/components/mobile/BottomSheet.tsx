import { useEffect, useId, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Native <dialog> as a bottom sheet: focus trap, Escape, inert background and aria-modal come from the platform. */
export function BottomSheet({ open, title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 mt-auto max-h-[88dvh] w-full max-w-none animate-sheet-up overflow-y-auto overscroll-contain rounded-t-3xl border-0 bg-white p-0 shadow-2xl backdrop:animate-fade-in"
    >
      {open && (
        <div className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300" aria-hidden />
          <h2 id={titleId} className="mb-4 text-lg font-semibold text-slate-900">
            {title}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
