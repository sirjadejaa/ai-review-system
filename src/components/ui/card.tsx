import React, { forwardRef } from 'react';
import styles from './card.module.css';

export type CardVariant = 'default' | 'interactive' | 'compact';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  as?: React.ElementType;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', as: Component = 'div', className = '', ...props }, ref) => {
    const classNames = [styles.card, styles[variant], className].filter(Boolean).join(' ');

    return (
      <Component ref={ref} className={classNames} {...props}>
        {children}
      </Component>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`${styles.header} ${className}`} {...props}>
    {children}
  </div>
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = ({
  children,
  as: Component = 'h3',
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: React.ElementType }) => (
  <Component className={`${styles.title} ${className}`} {...props}>
    {children}
  </Component>
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = ({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`${styles.description} ${className}`} {...props}>
    {children}
  </p>
);
CardDescription.displayName = 'CardDescription';

export const CardContent = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`${styles.content} ${className}`} {...props}>
    {children}
  </div>
);
CardContent.displayName = 'CardContent';

export const CardFooter = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`${styles.footer} ${className}`} {...props}>
    {children}
  </div>
);
CardFooter.displayName = 'CardFooter';
