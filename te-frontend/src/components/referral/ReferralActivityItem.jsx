const STATUS_STYLES = {
  "Completed": "text-te-green bg-[var(--te-green-soft)]",
  "In review": "text-te-gold bg-[var(--te-gold-soft)]",
  "Cancelled": "text-te-red bg-[var(--te-red-soft)]"
};
const ReferralActivityItem = ({
  status,
  referral,
  index
}) => {
  const dotClass = STATUS_STYLES[status] || "text-[var(--te-text-dim)] bg-[var(--te-surface-alt)]";
  return <li key={index} className="py-4">
            <div className="grid gap-1 border-l border-[var(--te-border)] pl-3">
                <div className={`${dotClass} h-2 w-2 border border-current`} />
                <h3 className="truncate text-sm font-semibold leading-5 text-[var(--te-text)]">{referral.company.name}{":  "}</h3>
                <h3 className="truncate text-sm font-semibold leading-5 text-[var(--te-text)]">{referral.job_title ?? "Software Engineer"},</h3>
                <h3 className="truncate text-sm font-semibold leading-5 text-[var(--te-text)]">{referral.role}</h3>
                <time dateTime={referral.date} className="font-mono text-xs text-[var(--te-text-dim)]">
                    {referral.date}
                </time>
            </div>
        </li>;
};
export default ReferralActivityItem;
