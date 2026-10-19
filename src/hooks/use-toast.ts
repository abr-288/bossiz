import type * as React from "react";
import { toast as sonner, type ExternalToast } from "sonner";

// Un seul système de notifications : Sonner (monté dans App.tsx).
// Ce module garde l'API historique `toast({ title, description, variant })`
// utilisée dans tout le projet et la traduit vers Sonner, pour que les deux
// systèmes ne s'affichent plus en même temps avec des styles différents.

type ToastVariant = "default" | "destructive" | "success";

export interface ToastInput {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant | string | null;
  duration?: number;
}

export interface ToastHandle {
  id: string;
  dismiss: () => void;
  update: (next: ToastInput) => void;
}

function show({ title, description, variant, duration }: ToastInput, id?: string | number) {
  // Sonner n'affiche qu'un message principal : le titre s'il existe, sinon la description.
  const message = title ?? description ?? "";
  const options: ExternalToast = {
    description: title ? description : undefined,
    duration,
    id,
  };
  if (variant === "destructive") return sonner.error(message, options);
  if (variant === "success") return sonner.success(message, options);
  return sonner(message, options);
}

function toast(input: ToastInput): ToastHandle {
  const id = show(input);
  return {
    id: String(id),
    dismiss: () => sonner.dismiss(id),
    update: (next) => {
      show(next, id);
    },
  };
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => sonner.dismiss(toastId),
  };
}

export { useToast, toast };
