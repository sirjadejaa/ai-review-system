import React, { forwardRef, useId } from 'react';
import styles from './select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id: customId,
      label,
      error,
      helpText,
      options,
      placeholder,
      children,
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

    const selectClasses = [
      styles.select,
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
        <div className={styles.selectContainer}>
          <select
            ref={ref}
            id={id}
            required={required}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={selectClasses}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <span className={styles.arrowIcon} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
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

Select.displayName = 'Select';
