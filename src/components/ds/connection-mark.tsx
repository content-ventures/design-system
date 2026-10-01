/** Símbolo exploratório da V2. Não substitui a marca oficial. */
export function ConnectionMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="16" fill="var(--ds-brand)" />
      <path
        d="M12 30V23a8 8 0 0 1 16 0v7"
        stroke="var(--ds-on-brand)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M20 18v7a8 8 0 0 0 16 0v-7"
        stroke="var(--ds-on-brand)"
        strokeWidth="5"
        strokeLinecap="round"
        opacity=".65"
      />
    </svg>
  );
}
