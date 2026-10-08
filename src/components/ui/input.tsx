import React, { forwardRef, useId } from 'react';
import styles from './input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id: customId,
      label,
      error,
      helpText,
      leftIcon,
      rightIcon,
      required,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const errorId = `${id}-error`;
    const helpId = `${id}-help`;

    const describedBy = [
      error ? errorId : null,
      helpText && !error ? helpId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    const inputClasses = [
      styles.input,
      error ? styles.hasError : '',
      leftIcon ? styles.withLeftIcon : '',
      rightIcon ? styles.withRightIcon : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            <span>{label}</span>
            {required && <span className={styles.required} aria-hidden="true">*</span>}
          </label>
        )}
        <div className={styles.inputContainer}>
          {leftIcon && <span className={`${styles.iconSlot} ${styles.leftSlot}`}>{leftIcon}</span>}
          <input
            ref={ref}
            id={id}
            required={required}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={inputClasses}
            {...props}
          />
          {rightIcon && <span className={`${styles.iconSlot} ${styles.rightSlot}`}>{rightIcon}</span>}
        </div>
        {error && (
          <p id={errorId} className={styles.errorText} role="alert">
            {error}
          </p>
        )}
        {!error && helpText && (
          <p id={helpId} className={styles.helpText}>
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
