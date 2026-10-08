import React, { forwardRef, useId } from 'react';
import styles from './textarea.module.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ id: customId, label, error, helpText, required, disabled, className = '', ...props }, ref) => {
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

    const textareaClasses = [
      styles.textarea,
      error ? styles.hasError : '',
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
        <textarea
          ref={ref}
          id={id}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={textareaClasses}
          {...props}
        />
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

Textarea.displayName = 'Textarea';
