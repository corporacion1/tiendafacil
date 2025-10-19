"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  loading?: boolean;
  showValidation?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  hintClassName?: string;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({
    className,
    containerClassName,
    labelClassName,
    inputClassName,
    errorClassName,
    hintClassName,
    type = "text",
    label,
    error,
    success,
    hint,
    required,
    loading,
    showValidation = true,
    id,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const inputId = id || `input-${React.useId()}`;
    const isPassword = type === "password";
    const actualType = isPassword && showPassword ? "text" : type;

    const hasError = !!error;
    const hasSuccess = !!success && !hasError;
    const showSuccessIcon = hasSuccess && showValidation;
    const showErrorIcon = hasError && showValidation;

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <Label 
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              hasError && "text-destructive",
              hasSuccess && "text-green-600",
              labelClassName
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        
        <div className="relative">
          <Input
            id={inputId}
            ref={ref}
            type={actualType}
            className={cn(
              "transition-colors",
              hasError && "border-destructive focus-visible:ring-destructive",
              hasSuccess && "border-green-500 focus-visible:ring-green-500",
              (showSuccessIcon || showErrorIcon || isPassword) && "pr-10",
              loading && "opacity-50 cursor-not-allowed",
              inputClassName,
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            disabled={loading || props.disabled}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : 
              success ? `${inputId}-success` : 
              hint ? `${inputId}-hint` : 
              undefined
            }
            {...props}
          />
          
          {/* Loading spinner */}
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
            </div>
          )}
          
          {/* Password toggle */}
          {isPassword && !loading && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
          
          {/* Success icon */}
          {showSuccessIcon && !loading && !isPassword && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
          )}
          
          {/* Error icon */}
          {showErrorIcon && !loading && !isPassword && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="w-4 h-4 text-destructive" />
            </div>
          )}
        </div>
        
        {/* Error message */}
        {error && (
          <p 
            id={`${inputId}-error`}
            className={cn(
              "text-sm text-destructive flex items-center gap-1",
              errorClassName
            )}
            role="alert"
          >
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {error}
          </p>
        )}
        
        {/* Success message */}
        {success && !error && (
          <p 
            id={`${inputId}-success`}
            className={cn(
              "text-sm text-green-600 flex items-center gap-1",
              errorClassName
            )}
          >
            <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
            {success}
          </p>
        )}
        
        {/* Hint message */}
        {hint && !error && !success && (
          <p 
            id={`${inputId}-hint`}
            className={cn(
              "text-sm text-muted-foreground",
              hintClassName
            )}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export { FormInput };