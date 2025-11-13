import { Disclosure } from '@headlessui/react'
import { MinusIcon, PlusIcon } from '@heroicons/react/20/solid'
import { useData } from '../../context/DataContext'
import ReferralActivityItem from './ReferralActivityItem'


const ReferralActivity = () => {

    const { referrals } = useData();

    return (
        <aside className=" lg:fixed lg:bottom-0 lg:right-0 lg:top-16 lg:w-2/6 lg:overflow-y-auto px-4  text-sm mr-6">
            <header className="flex items-center  border-b-4 border-sky-600 mt-6 ">
                <h2 className="text-base font-semibold ">In review</h2>
            </header>

            <div className="">
                {<ul className="divide-y divide-white/5">
                    {referrals.filter((referral) => referral && referral.status === "In review").map((referral, index) => (
                        <ReferralActivityItem status={"In review"} referral={referral} index={index} />
                    ))}
                </ul>}
            </div>

            {
                ["Completed", "Cancelled"].map((status, index) => {
                    return (
                        <>
                            <Disclosure as="div" key={index} className=" py-6">
                                {({ open }) => (
                                    <>
                                        <h3 className="-mx-2 -my-3 flow-root">
                                            <Disclosure.Button className="flex w-full items-center justify-between bg-white px-2 py-3 ">
                                                <span className="font-medium text-gray-900">{status}</span>
                                                <span className="ml-6 flex items-center">
                                                    {open ? (
                                                        <MinusIcon className="h-5 w-5" aria-hidden="true" />
                                                    ) : (
                                                        <PlusIcon className="h-5 w-5" aria-hidden="true" />
                                                    )}
                                                </span>
                                            </Disclosure.Button>
                                        </h3>
                                        <Disclosure.Panel >
                                            <ul className="divide-y divide-white/5">
                                                {referrals.filter((referral) => referral && referral.status === status).map((referral, index) => (
                                                    <ReferralActivityItem status={status} referral={referral} index={index} />
                                                ))}
                                            </ul>
                                        </Disclosure.Panel>
                                    </>
                                )}
                            </Disclosure>


                        </>
                    )
                })
            }
            <div>

            </div>
        </aside>
    )
}

export default ReferralActivity;