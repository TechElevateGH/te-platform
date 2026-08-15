import {
  AcademicCapIcon,
  BriefcaseIcon,
  RocketLaunchIcon,
  UsersIcon,
} from "icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSlack } from "@fortawesome/free-brands-svg-icons";
import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../axiosConfig";
import { useAuth } from "../../context/AuthContext";
import Companies from "./Companies";
import Features from "./Features";
import Footer from "./Footer";
import Hero from "./Hero";
import ImpactStats from "./ImpactStats";
import Navbar from "./Navbar";

const roleLabels = {
  0: "Guest",
  1: "Member",
  2: "Referrer",
  3: "Volunteer",
  4: "Lead",
  5: "Admin",
};

const Home = () => {
  useEffect(() => {
    if (!sessionStorage.getItem("prevPage")) {
      sessionStorage.setItem("prevPage", "/");
    }
  }, []);
  const { isAuthenticated, userRole, isGuest, userId } = useAuth();
  const roleText = useMemo(() => roleLabels[userRole] ?? "", [userRole]);
  const showQuickAccess = isAuthenticated && !isGuest;
  const isMember = userRole === 1;

  const [slackJoined, setSlackJoined] = useState(null);
  const [loadingSlackStatus, setLoadingSlackStatus] = useState(true);

  // Fetch user's slack_joined status if they're a member
  useEffect(() => {
    if (isMember && userId) {
      axiosInstance
        .get(`/users/${userId}`)
        .then((response) => {
          setSlackJoined(response.data.user.slack_joined);
          setLoadingSlackStatus(false);
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          setLoadingSlackStatus(false);
        });
    } else {
      setLoadingSlackStatus(false);
    }
  }, [isMember, userId]);

  const handleJoinSlack = async () => {
    const slackInviteUrl =
      "https://join.slack.com/t/techelevateworkspace/shared_invite/zt-3ig9yhi07-XZpHhVVnlv0Cj3lTyJLAuw";

    // Open Slack in new tab
    window.open(slackInviteUrl, "_blank");

    // Update slack_joined status
    try {
      await axiosInstance.patch(`/users/${userId}`, {
        slack_joined: true,
      });
      setSlackJoined(true);
    } catch (error) {
      console.error("Error updating slack_joined status:", error);
    }
  };

  const quickAccessLinks = [
    {
      label: "Workspace",
      desc: "Your personal dashboard",
      href: "/workspace",
      icon: RocketLaunchIcon,
    },
    {
      label: "Applications",
      desc: "Track your job pipeline",
      href: "/workspace#applications",
      icon: BriefcaseIcon,
    },
    {
      label: "Learning",
      desc: "Access curated lessons",
      href: "/workspace#learning",
      icon: AcademicCapIcon,
    },
    {
      label: "Referrals",
      desc: "Get company referrals",
      href: "/workspace#referrals",
      icon: UsersIcon,
    },
  ];

  return (
    <div className="relative bg-[var(--te-bg)] transition-colors">
      <Navbar />
      <Hero />

      {showQuickAccess && (
        <section
          aria-label="Quick access"
          className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20"
        >
          <div className="relative overflow-hidden rounded-[2rem] bg-[#0b2e21] p-6 shadow-[0_28px_80px_-42px_rgba(5,45,29,0.75)] sm:p-9">
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border-[60px] border-white/[0.025]" />
            <div className="relative mb-7 flex flex-wrap items-end justify-between gap-5">
              <div>
                <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#6fdda5] before:h-0.5 before:w-5 before:bg-current">
                  Welcome back
                </span>
                <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-white sm:text-3xl">
                  Pick up where your momentum left off.
                </h2>
                <p className="mt-2 text-sm text-white/50">Everything important is one click away.</p>
              </div>
              {roleText && <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs font-bold text-white/70">{roleText} workspace</span>}
            </div>

            <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {quickAccessLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="group rounded-2xl border border-white/10 bg-white/[0.055] p-5 transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.09]"
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#6fdda5]">
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <div className="mt-5 font-extrabold text-white">
                      {item.label}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-white/45">
                      {item.desc}
                    </p>
                    <div className="mt-5 text-xs font-bold text-[#6fdda5] transition-transform group-hover:translate-x-1">
                      Open <span aria-hidden="true">→</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {isMember && !loadingSlackStatus && slackJoined === false && (
        <section
          aria-label="Join Slack community"
          className="relative mx-auto max-w-7xl px-6 pb-20 lg:px-8"
        >
          <div className="flex flex-col items-start gap-7 overflow-hidden rounded-[1.75rem] border border-[#d99f33]/25 bg-[var(--te-gold-soft)] p-7 sm:p-9 lg:flex-row lg:items-center">
            <div className="inline-flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--te-surface)] text-[var(--te-gold)] shadow-sm">
              <FontAwesomeIcon icon={faSlack} className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--te-gold)]">Your people are waiting</span>
              <h3 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[var(--te-text)]">
                The best conversations happen in Slack.
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--te-text-dim)]">
                Meet mentors, find accountability partners, hear about new opportunities, and get unstuck faster.
              </p>
            </div>
            <button
              onClick={handleJoinSlack}
              className="te-btn-primary te-btn-lg flex-shrink-0"
            >
              Join the conversation <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      )}

      <Features />
      <Companies />
      <ImpactStats />
      <Footer />
    </div>
  );
};

export default Home;
