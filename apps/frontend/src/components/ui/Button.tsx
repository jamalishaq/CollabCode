import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({ children, className, variant = 'primary', ...rest }: PropsWithChildren<ButtonProps>) {
  return (
    <button {...rest} className={`btn btn-${variant} ${className ?? ''}`.trim()}>
      {children}
    </button>
  );
}
