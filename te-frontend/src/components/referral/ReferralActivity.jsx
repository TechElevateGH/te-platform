import { Disclosure } from '@headlessui/react';
import { MinusIcon, PlusIcon } from 'icons';
import { useData } from '../../context/DataContext';
import ReferralActivityItem from './ReferralActivityItem';
const ReferralActivity = () => {
  const {
    referrals
  } = useData();
  return <aside className="te-card h-full px-4 text-sm lg:fixed lg:bottom-0 lg:right-0 lg:top-16 lg:mr-6 lg:w-2/6 lg:overflow-y-auto">
            <header className="mt-6 border-b border-[var(--te-border)] pb-3">
                <span className="te-eyebrow">Activity</span>
                <h2 className="mt-1 font-display text-base font-semibold text-[var(--te-text)]">In review</h2>
            </header>

            <div className="">
                {<ul className="divide-y divide-[var(--te-border)]">
                    {referrals.filter(referral => referral && referral.status === "In review").map((referral, index) => <ReferralActivityItem status={"In review"} referral={referral} index={index} />)}
                </ul>}
            </div>

            {["Completed", "Cancelled"].map((status, index) => {
      return <>
                            <Disclosure as="div" key={index} className="border-t border-[var(--te-border)] py-4">
                                {({
            open
          }) => <>
                                        <h3 className="-mx-2 -my-3 flow-root">
                                            <Disclosure.Button className="flex w-full items-center justify-between px-2 py-3 font-mono text-xs uppercase tracking-[0.16em] text-[var(--te-text)] hover:bg-[var(--te-hover)]">
                                                <span className="font-medium text-[var(--te-text)]">{status}</span>
                                                <span className="ml-6 flex items-center">
                                                    {open ? <MinusIcon className="h-5 w-5" aria-hidden="true" /> : <PlusIcon className="h-5 w-5" aria-hidden="true" />}

                                                </span>
                                            </Disclosure.Button>
                                        </h3>
                                        <Disclosure.Panel>
                                            <ul className="divide-y divide-[var(--te-border)]">
                                                {referrals.filter(referral => referral && referral.status === status).map((referral, index) => <ReferralActivityItem status={status} referral={referral} index={index} />)}
                                            </ul>
                                        </Disclosure.Panel>
                                    </>}

                            </Disclosure>


                        </>;
    })}

            <div>

            </div>
        </aside>;
};
export default ReferralActivity;
