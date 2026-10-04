import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

export function TextField({ label, error, ...props }:
  InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const errorId = `${id}-error`;
  const description = [props['aria-describedby'], error ? errorId : undefined].filter(Boolean).join(' ') || undefined;
  return <div className="text-field">
    <label htmlFor={id}>{label}</label>
    <input {...props} id={id} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={description} />
    {error && <p id={errorId} className="field-error">{error}</p>}
  </div>;
}
