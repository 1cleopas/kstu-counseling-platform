import { useState } from 'react';

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 5c-5 0-9.27 3.11-11 7 1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 .001 6.001A3 3 0 0 0 12 9z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 5c.74 0 1.45.09 2.13.24l-1.6 1.6A5 5 0 0 0 7.84 11.53L5.5 13.87C3.54 12.7 2.1 11.1 1 12c1.73-3.89 6-7 11-7zm9.88-.88-2.12 2.12C21.46 7.95 22.61 9.78 23 12c-1.73 3.89-6 7-11 7-1.61 0-3.14-.32-4.53-.89l-2.59 2.59-1.41-1.41 18-18 1.41 1.41zM12 17c3.04 0 5.64-1.71 7.12-4.22-.47-.8-1.12-1.54-1.9-2.16l-1.6 1.6A5 5 0 0 1 9.78 15.62L8.3 17.1c1.13.56 2.38.9 3.7.9z"
      />
    </svg>
  );
}

export default function PasswordInput({ value, onChange, required, minLength, id, name, autoComplete }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        type={visible ? 'text' : 'password'}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  );
}
