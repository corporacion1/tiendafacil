import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { forwardRef } from "react";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isSubmitting?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  submittingText?: string;
  successText?: string;
  errorText?: string;
  children: React.ReactNode;
}

export const SubmitButton = forwardRef<HTMLButtonElement, SubmitButtonProps>(
  (
    {
      isSubmitting = false,
      isSuccess = false,
      isError = false,
      submittingText,
      successText,
      errorText,
      children,
      disabled,
      className,
      type = "submit",
      onClick,
      ...props
    },
    ref
  ) => {
    // Determinar el texto del botón
    let buttonText = children;
    if (isSubmitting && submittingText) {
      buttonText = submittingText;
    } else if (isSuccess && successText) {
      buttonText = successText;
    } else if (isError && errorText) {
      buttonText = errorText;
    }

    // Determinar las clases de estado
    let stateClasses = "";
    if (isSubmitting) {
      stateClasses = "submitting processing";
    } else if (isSuccess) {
      stateClasses = "submitting success";
    } else if (isError) {
      stateClasses = "submitting error";
    }

    // El botón está deshabilitado si está enviando, es exitoso o está explícitamente deshabilitado
    const isDisabled = isSubmitting || isSuccess || disabled;

    return (
      <Button
        ref={ref}
        type={type}
        disabled={isDisabled}
        onClick={onClick}
        className={`${stateClasses} btn-ripple transition-all duration-200 ${className || ""}`}
        {...props}
      >
        {isSubmitting && !submittingText && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {isSuccess && !successText && (
          <CheckCircle2 className="mr-2 h-4 w-4" />
        )}
        {isError && !errorText && (
          <AlertCircle className="mr-2 h-4 w-4" />
        )}
        <span className={isSubmitting ? "opacity-0" : ""}>{children}</span>
        <span className={`absolute inset-0 flex items-center justify-center ${
          !isSubmitting && !isSuccess && !isError ? "opacity-0" : "opacity-100"
        }`}>
          {isSubmitting ? buttonText : buttonText}
        </span>
      </Button>
    );
  }
);

SubmitButton.displayName = "SubmitButton";
