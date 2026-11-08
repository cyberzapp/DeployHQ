import React, { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';

interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
  preventLightDismiss?: boolean;
}

/**
 * Native <dialog> modal following modern-web-guidance `dialog` best practices:
 * - Uses native `showModal()` for top-layer focus containment, inert background, and Esc handling.
 * - Uses `aria-labelledby` pointing to its heading, without redundant `role="dialog"` or `aria-modal`.
 * - Resets `dialog.returnValue = ''` on close.
 * - Implements the `closedby` progressive enhancement + pointer-coordinate light-dismiss fallback.
 */
export const ModalDialog: React.FC<ModalDialogProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  maxWidthClass = 'max-w-lg',
  preventLightDismiss = false,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };

    dialog.addEventListener('close', handleClose);

    // Fallback for browsers where <dialog closedby="any"> is not yet supported
    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!preventLightDismiss) {
        pressedOutside = isOutside(e);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!preventLightDismiss && pressedOutside && isOutside(e)) {
        dialog.close();
      }
    };

    if (!('closedBy' in HTMLDialogElement.prototype) && !preventLightDismiss) {
      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('pointerdown', onPointerDown);
      dialog.removeEventListener('pointerup', onPointerUp);
    };
  }, [onClose, preventLightDismiss]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      {...({ closedby: preventLightDismiss ? 'closerequest' : 'any' } as any)}
      className={`w-full ${maxWidthClass} rounded-xl bg-card border border-border text-text-primary shadow-elevated p-0 m-auto backdrop:bg-main/75`}
    >
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border">
        <div>
          <h2 id={titleId} className="text-base font-semibold text-text-primary">
            {title}
          </h2>
          {description && (
            <p id={descId} className="text-xs text-text-secondary mt-0.5">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close dialog"
          className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
};

