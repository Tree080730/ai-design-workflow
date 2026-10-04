import type { ButtonHTMLAttributes } from 'react';

export function Button({ loading = false, variant = 'primary', children, disabled, ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; variant?: 'primary' | 'secondary' }) {
  return <button {...props} type={props.type ?? 'button'} className={`button button-${variant}`}
    disabled={disabled || loading} aria-busy={loading || undefined}>
    {loading ? 'Loading…' : children}
  </button>;
}
