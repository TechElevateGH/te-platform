import {
  AcademicCapIcon,
  BriefcaseIcon,
  ChartBarIcon,
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
  2: "Lead",
  3: "Admin",
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
          className="relative mx-auto max-w-7xl px-6 lg:px-8 py-16"
        >
          <div className="te-panel p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <span className="te-eyebrow">{'// welcome back'}</span>
                <h2 className="mt-2 text-xl font-bold text-[var(--te-text)]">
                  Ready to continue your journey?
                </h2>
              </div>
              {roleText && <span className="te-chip">{roleText}</span>}
            </div>

            {/* Quick Access Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {quickAccessLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="te-card-interactive group p-5"
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)] text-[var(--te-text)]">
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <div className="mt-4 font-semibold text-[var(--te-text)]">
                      {item.label}
                    </div>
                    <p className="mt-1 text-sm text-[var(--te-text-dim)]">
                      {item.desc}
                    </p>
                    <div className="mt-3 font-mono text-xs text-[var(--te-text-dim)] opacity-0 transition-opacity group-hover:opacity-100">
                      open →
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Stats Bar */}
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-lg border border-[var(--te-border)] bg-[var(--te-border)]">
              {[
                { label: "Active Applications", value: "—", icon: BriefcaseIcon },
                { label: "Lessons Completed", value: "—", icon: AcademicCapIcon },
                { label: "Referrals Received", value: "—", icon: UsersIcon },
                { label: "Profile Score", value: "—", icon: ChartBarIcon },
              ].map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <div key={stat.label} className="bg-[var(--te-surface)] p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <StatIcon className="h-4 w-4 text-[var(--te-text-dim)]" strokeWidth={1.8} />
                    </div>
                    <div className="font-mono text-2xl font-bold text-[var(--te-text)]">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-xs text-[var(--te-text-dim)]">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Slack Join Section - Only for Members who haven't joined */}
      {isMember && !loadingSlackStatus && slackJoined === false && (
        <section
          aria-label="Join Slack community"
          className="relative mx-auto max-w-7xl px-6 lg:px-8 pb-16"
        >
          <div className="te-panel p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="inline-flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--te-border)] bg-[var(--te-surface-alt)] text-[var(--te-text)]">
              <FontAwesomeIcon icon={faSlack} className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <span className="te-eyebrow">{'// community'}</span>
              <h3 className="mt-2 text-2xl font-bold text-[var(--te-text)]">
                Join our Slack community
              </h3>
              <p className="mt-2 text-[var(--te-text-dim)]">
                Connect with mentors and peers, and get real-time support on your tech journey.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 font-mono text-xs text-[var(--te-text-dim)]">
                <span className="te-chip">live support</span>
                <span className="te-chip">network</span>
                <span className="te-chip">updates</span>
                <span className="te-chip">resources</span>
              </div>
            </div>
            <button
              onClick={handleJoinSlack}
              className="te-btn-primary te-btn-lg flex-shrink-0"
            >
              Join workspace <span aria-hidden="true">→</span>
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
