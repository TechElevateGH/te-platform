export const Loading = ({ label }) => {
    return (
        <div className="inline-flex items-center gap-3 rounded-2xl border border-[var(--te-border)] bg-[var(--te-surface)] px-4 py-3 shadow-sm" role="status" aria-live="polite">
            <span className="relative inline-flex h-7 w-7">
                <span className="absolute inset-0 rounded-full border-[3px] border-[var(--te-green-soft)]" />
                <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-[var(--te-green)]" />
            </span>
            {label && <span className="text-xs font-bold text-[var(--te-text-dim)]">{label}</span>}
            <span className="sr-only">Loading…</span>
        </div>
    )
}
