"use client"

// Inspired by react-hot-toast library
import * as React from "react"
import { toastLogger } from "@/utils/toast-logger"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      toastLogger.log({
        type: 'ADD',
        toastId: action.toast.id,
        title: action.toast.title?.toString(),
        description: action.toast.description?.toString()
      });
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      toastLogger.log({
        type: 'UPDATE',
        toastId: action.toast.id
      });
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      toastLogger.log({
        type: 'DISMISS',
        toastId: toastId || 'all'
      });

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      toastLogger.log({
        type: 'REMOVE',
        toastId: action.toastId || 'all'
      });
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

// Throttle para prevenir spam de toasts
const toastThrottle = new Map<string, number>();
const THROTTLE_DELAY = 1000; // 1 segundo

function toast({ ...props }: Toast) {
  // Crear una clave única para el toast basada en título y descripción
  const toastKey = `${props.title || ''}-${props.description || ''}`;
  const now = Date.now();
  
  // Verificar throttle
  if (toastThrottle.has(toastKey)) {
    const lastTime = toastThrottle.get(toastKey)!;
    if (now - lastTime < THROTTLE_DELAY) {
      console.warn('🚫 Toast throttled:', props.title);
      return {
        id: '',
        dismiss: () => {},
        update: () => {},
      };
    }
  }
  
  // Evitar toasts duplicados con el mismo título y descripción
  const isDuplicate = memoryState.toasts.some(existingToast => 
    existingToast.title === props.title && 
    existingToast.description === props.description &&
    existingToast.open !== false
  )
  
  if (isDuplicate) {
    console.warn('🚫 Toast duplicado evitado:', props.title)
    return {
      id: '',
      dismiss: () => {},
      update: () => {},
    }
  }

  // Actualizar throttle
  toastThrottle.set(toastKey, now);

  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    // Usar una función estable para evitar re-registros
    const stableSetState = (newState: State) => {
      // Prevenir actualizaciones innecesarias si el estado es idéntico
      setState(prevState => {
        if (JSON.stringify(prevState.toasts) === JSON.stringify(newState.toasts)) {
          return prevState;
        }
        return newState;
      });
    }
    
    listeners.push(stableSetState)
    return () => {
      const index = listeners.indexOf(stableSetState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  const dismissToast = React.useCallback((toastId?: string) => {
    dispatch({ type: "DISMISS_TOAST", toastId })
  }, [])

  return React.useMemo(() => ({
    ...state,
    toast,
    dismiss: dismissToast,
  }), [state, dismissToast])
}

export { useToast, toast }
