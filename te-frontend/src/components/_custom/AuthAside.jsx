import { CheckCircleIcon } from 'icons';
import { useNavigate } from 'react-router-dom';

const AuthAside = ({
    eyebrow = 'Your career, with direction',
    title = 'Talent goes further with the right support.',
    description = 'Build skills, sharpen your story, and create real momentum alongside people who want to see you win.',
}) => {
    const navigate = useNavigate();

    return (
        <aside className="relative hidden min-h-screen overflow-hidden bg-[#0b2e21] p-10 text-white lg:flex lg:flex-col xl:p-14">
            <div className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full border-[90px] border-white/[0.025]" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-[#4ac786]/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-52 w-80 opacity-20 [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]" />

            <button onClick={() => navigate('/')} className="relative flex items-center gap-3 self-start">
                <img src="/te-mark.svg" alt="" className="h-10 w-10 rounded-xl" />
                <span className="te-wordmark text-lg text-white">TechElevate</span>
            </button>

            <div className="relative my-auto max-w-xl py-16">
                <p className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#70dda6] before:h-0.5 before:w-5 before:bg-current">
                    {eyebrow}
                </p>
                <h1 className="mt-6 text-5xl font-extrabold leading-[1.02] tracking-[-0.065em] text-white xl:text-6xl">
                    {title}
                </h1>
                <p className="mt-6 max-w-lg text-base leading-8 text-white/55 xl:text-lg">
                    {description}
                </p>

                <div className="mt-10 grid gap-3 sm:grid-cols-2">
                    {['Mentorship with context', 'Structured learning', 'Real interview practice', 'Warm opportunities'].map((benefit) => (
                        <div key={benefit} className="flex items-center gap-2.5 text-xs font-semibold text-white/65">
                            <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-[#70dda6]" />
                            {benefit}
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur">
                <p className="text-sm font-semibold leading-6 text-white/72">
                    “The community helped me stop guessing and start making intentional career moves.”
                </p>
                <div className="mt-4 flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f2bd58] text-[10px] font-extrabold text-[#0b2e21]">KO</span>
                    <div>
                        <p className="text-xs font-extrabold text-white">Kwame O.</p>
                        <p className="text-[10px] text-white/40">Software engineer · Accra</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default AuthAside;
