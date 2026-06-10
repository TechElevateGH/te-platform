export const Loading = ({ label }) => {
    return (
        <div className="flex items-center gap-3" role="status" aria-live="polite">
            <span className="relative inline-flex h-8 w-8">
                <span className="absolute inset-0 rounded-full border-[3px] border-[var(--te-border)]" />
                <span className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[var(--te-text)] animate-spin" />
            </span>
            {label && <span className="text-sm font-medium text-[var(--te-text-dim)]">{label}</span>}
            <span className="sr-only">Loading…</span>
        </div>
    )
}
