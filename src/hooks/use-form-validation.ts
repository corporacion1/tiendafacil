// src/hooks/use-form-validation.ts
import { useState, useCallback, useMemo } from 'react';
import { useErrorHandler } from '@/hooks/use-error-handler';

export type ValidationRule<T = any> = {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  email?: boolean | string;
  phone?: boolean | string;
  custom?: (value: T) => string | null;
};

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

export type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

export interface FormState<T> {
  values: T;
  errors: ValidationErrors<T>;
  touched: { [K in keyof T]?: boolean };
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

export interface UseFormValidationOptions<T> {
  initialValues: T;
  validationRules?: ValidationRules<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit?: (values: T) => Promise<void> | void;
}

export const useFormValidation = <T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  validateOnChange = true,
  validateOnBlur = true,
  onSubmit
}: UseFormValidationOptions<T>) => {
  const { handleError } = useErrorHandler();

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<{ [K in keyof T]?: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validar un campo específico
  const validateField = useCallback((name: keyof T, value: any): string | null => {
    const rules = validationRules[name];
    if (!rules) return null;

    // Required validation
    if (rules.required) {
      const isEmpty = value === null || value === undefined || value === '' || 
                     (Array.isArray(value) && value.length === 0);
      if (isEmpty) {
        return typeof rules.required === 'string' 
          ? rules.required 
          : `${String(name)} es requerido`;
      }
    }

    // Si el campo está vacío y no es requerido, no validar el resto
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // String validations
    if (typeof value === 'string') {
      // Min length
      if (rules.minLength) {
        const minLength = typeof rules.minLength === 'number' 
          ? rules.minLength 
          : rules.minLength.value;
        const message = typeof rules.minLength === 'object' 
          ? rules.minLength.message 
          : `Debe tener al menos ${minLength} caracteres`;
        
        if (value.length < minLength) {
          return message;
        }
      }

      // Max length
      if (rules.maxLength) {
        const maxLength = typeof rules.maxLength === 'number' 
          ? rules.maxLength 
          : rules.maxLength.value;
        const message = typeof rules.maxLength === 'object' 
          ? rules.maxLength.message 
          : `No puede tener más de ${maxLength} caracteres`;
        
        if (value.length > maxLength) {
          return message;
        }
      }

      // Email validation
      if (rules.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return typeof rules.email === 'string' 
            ? rules.email 
            : 'Formato de email inválido';
        }
      }

      // Phone validation (Venezuelan format)
      if (rules.phone) {
        const phoneRegex = /^(0412|0414|0416|0424|0426)\d{7}$/;
        if (!phoneRegex.test(value)) {
          return typeof rules.phone === 'string' 
            ? rules.phone 
            : 'Formato de teléfono inválido (ej: 04121234567)';
        }
      }

      // Pattern validation
      if (rules.pattern) {
        const pattern = typeof rules.pattern === 'object' && 'value' in rules.pattern
          ? rules.pattern.value 
          : rules.pattern;
        const message = typeof rules.pattern === 'object' && 'message' in rules.pattern
          ? rules.pattern.message 
          : 'Formato inválido';
        
        if (!pattern.test(value)) {
          return message;
        }
      }
    }

    // Number validations
    if (typeof value === 'number') {
      // Min value
      if (rules.min) {
        const min = typeof rules.min === 'number' 
          ? rules.min 
          : rules.min.value;
        const message = typeof rules.min === 'object' 
          ? rules.min.message 
          : `Debe ser mayor o igual a ${min}`;
        
        if (value < min) {
          return message;
        }
      }

      // Max value
      if (rules.max) {
        const max = typeof rules.max === 'number' 
          ? rules.max 
          : rules.max.value;
        const message = typeof rules.max === 'object' 
          ? rules.max.message 
          : `Debe ser menor o igual a ${max}`;
        
        if (value > max) {
          return message;
        }
      }
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, [validationRules]);

  // Validar todos los campos
  const validateAll = useCallback((): ValidationErrors<T> => {
    const newErrors: ValidationErrors<T> = {};
    
    Object.keys(validationRules).forEach((key) => {
      const fieldName = key as keyof T;
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    return newErrors;
  }, [values, validateField, validationRules]);

  // Actualizar valor de un campo
  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));

    if (validateOnChange) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error || undefined
      }));
    }
  }, [validateField, validateOnChange]);

  // Manejar cambio de campo
  const handleChange = useCallback((name: keyof T) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { value, type } = event.target;
    let processedValue: any = value;

    // Procesar valor según el tipo de input
    if (type === 'number') {
      processedValue = value === '' ? '' : Number(value);
    } else if (type === 'checkbox') {
      processedValue = (event.target as HTMLInputElement).checked;
    }

    setValue(name, processedValue);
  }, [setValue]);

  // Manejar blur de campo
  const handleBlur = useCallback((name: keyof T) => () => {
    setTouched(prev => ({ ...prev, [name]: true }));

    if (validateOnBlur) {
      const error = validateField(name, values[name]);
      setErrors(prev => ({
        ...prev,
        [name]: error || undefined
      }));
    }
  }, [validateField, validateOnBlur, values]);

  // Limpiar error de un campo
  const clearError = useCallback((name: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  // Limpiar todos los errores
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Reset form
  const reset = useCallback((newValues?: Partial<T>) => {
    setValues(newValues ? { ...initialValues, ...newValues } : initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Submit form
  const handleSubmit = useCallback(async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    setIsSubmitting(true);

    try {
      // Validar todos los campos
      const validationErrors = validateAll();
      
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        
        // Marcar todos los campos como touched
        const allTouched = Object.keys(validationRules).reduce((acc, key) => {
          acc[key as keyof T] = true;
          return acc;
        }, {} as { [K in keyof T]?: boolean });
        setTouched(allTouched);

        // Mostrar errores de validación
        const errorMessages = Object.values(validationErrors).filter(Boolean) as string[];
        if (errorMessages.length > 0) {
          handleError.validation(errorMessages, {
            action: 'form_validation',
            component: 'useFormValidation'
          });
        }

        return false;
      }

      // Si hay función onSubmit, ejecutarla
      if (onSubmit) {
        await onSubmit(values);
      }

      return true;
    } catch (error) {
      handleError.unknown(error, {
        action: 'form_submit',
        component: 'useFormValidation'
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [validateAll, validationRules, onSubmit, values, handleError]);

  // Estado calculado
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  const isValid = useMemo(() => {
    return Object.keys(validateAll()).length === 0;
  }, [validateAll]);

  const formState: FormState<T> = useMemo(() => ({
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    isDirty
  }), [values, errors, touched, isValid, isSubmitting, isDirty]);

  return {
    // Estado
    ...formState,
    
    // Métodos
    setValue,
    handleChange,
    handleBlur,
    handleSubmit,
    validateField,
    validateAll,
    clearError,
    clearErrors,
    reset,

    // Helpers para campos específicos
    getFieldProps: (name: keyof T) => ({
      value: values[name] || '',
      onChange: handleChange(name),
      onBlur: handleBlur(name),
      error: touched[name] ? errors[name] : undefined
    }),

    getFieldError: (name: keyof T) => touched[name] ? errors[name] : undefined,
    isFieldTouched: (name: keyof T) => !!touched[name],
    isFieldValid: (name: keyof T) => !errors[name]
  };
};