"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";

type SessionUser = {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "instructor";
};

type MeResponse = {
  user: SessionUser;
};

type SubjectId = "schedule" | "students" | "horses" | "lessons" | "review" | "admin";

type NavChild = {
  id: string;
  label: string;
  count?: number;
};

type NavSubject = {
  id: SubjectId;
  label: string;
  icon: string;
  count?: number;
  adminOnly?: boolean;
  children: NavChild[];
};

type StaffRecord = {
  name: string;
  eyebrow: string;
  status: string;
  meta: string;
  initials: string;
  action: string;
  sections: Array<{
    title: string;
    summary: string;
    body: string;
  }>;
};

const navigation: NavSubject[] = [
  {
    id: "schedule",
    label: "Schedule",
    icon: "calendar",
    count: 3,
    children: [
      { id: "calendar", label: "Calendar" },
      { id: "week", label: "Week list", count: 2 }
    ]
  },
  {
    id: "students",
    label: "Students",
    icon: "students",
    count: 5,
    children: [
      { id: "active", label: "Active students", count: 3 },
      { id: "needs-review", label: "Needs review", count: 2 }
    ]
  },
  {
    id: "horses",
    label: "Horses",
    icon: "horse",
    count: 2,
    children: [
      { id: "assignment", label: "Assignment board", count: 1 },
      { id: "care", label: "Care notes", count: 1 }
    ]
  },
  {
    id: "lessons",
    label: "Lessons",
    icon: "clipboard",
    count: 4,
    children: [
      { id: "today", label: "Today's lessons", count: 3 },
      { id: "ledger", label: "Lesson ledger", count: 1 }
    ]
  },
  {
    id: "review",
    label: "Review",
    icon: "review",
    count: 7,
    children: [
      { id: "queue", label: "Operational review", count: 7 },
      { id: "completed", label: "Completed" }
    ]
  },
  {
    id: "admin",
    label: "Admin",
    icon: "settings",
    count: 1,
    adminOnly: true,
    children: [
      { id: "staff", label: "Staff access", count: 1 },
      { id: "audit", label: "Audit trail" }
    ]
  }
];

const recordsBySubject: Record<SubjectId, StaffRecord> = {
  schedule: {
    name: "Saturday lesson schedule",
    eyebrow: "Schedule record",
    status: "3 warnings",
    meta: "Calendar view | Today | 30-minute slots",
    initials: "SA",
    action: "Add lesson",
    sections: [
      {
        title: "Calendar",
        summary: "Current week",
        body: "The calendar opens to today and keeps warnings inline on lesson cards."
      },
      {
        title: "Conflicts",
        summary: "3 need attention",
        body: "Two horse assignments overlap and one lesson is missing an instructor confirmation."
      },
      {
        title: "Audit trail",
        summary: "Admin visible",
        body: "Recent schedule edits are retained at the bottom of the record."
      }
    ]
  },
  students: {
    name: "Maya Thompson",
    eyebrow: "Student record",
    status: "Needs review",
    meta: "Beginner group | Lesson Balance: 4 | Guardian contact verified",
    initials: "MT",
    action: "Message guardian",
    sections: [
      {
        title: "Profile",
        summary: "Active",
        body: "Contact details, riding level, guardian information, and current attendance notes stay in one stacked detail view."
      },
      {
        title: "Lesson Progress",
        summary: "2 notes",
        body: "Instructor notes are visible in reduced form with clear editing controls for authorized staff."
      },
      {
        title: "Lesson Balance",
        summary: "4 available",
        body: "Lesson Credits and Manual Ledger Adjustments are listed from the append-only Lesson Ledger."
      }
    ]
  },
  horses: {
    name: "Juniper",
    eyebrow: "Horse record",
    status: "Horse Concern",
    meta: "Pony barn | Light work only | Assigned twice today",
    initials: "JU",
    action: "Add care note",
    sections: [
      {
        title: "Assignment",
        summary: "Light work",
        body: "The assignment board shows suitability, workload, and conflicts without splitting the page into a separate detail workspace."
      },
      {
        title: "Horse Concerns",
        summary: "1 open",
        body: "Horse Concerns are prominent and stay readable before Horse Assignment decisions are made."
      },
      {
        title: "Usage History",
        summary: "This week",
        body: "Recent Lessons and Practice Rides are ordered by operational importance."
      }
    ]
  },
  lessons: {
    name: "Beginner flatwork",
    eyebrow: "Lesson record",
    status: "Instructor ready",
    meta: "10:30 AM | Ring 2 | 5 students",
    initials: "BF",
    action: "Take attendance",
    sections: [
      {
        title: "Roster",
        summary: "5 students",
        body: "Lesson Participants and Horse Assignments remain compact so staff can scan the Lesson quickly."
      },
      {
        title: "Plan",
        summary: "Flatwork",
        body: "The lesson plan, warnings, and instructor notes share the same card language as student and horse records."
      },
      {
        title: "Lesson Credits",
        summary: "Pending",
        body: "Lesson Credit deductions are explicit and can be saved independently from other Lesson edits."
      }
    ]
  },
  review: {
    name: "Operational Review",
    eyebrow: "Operational Review record",
    status: "7 open",
    meta: "Needs review first | Student, Horse, and Lesson items",
    initials: "RQ",
    action: "Resolve item",
    sections: [
      {
        title: "Operational Review",
        summary: "Sorted by urgency",
        body: "Items that need review are sorted above everything else and retain their source record context."
      },
      {
        title: "Decision",
        summary: "In place",
        body: "Review actions are scoped to the selected section with explicit save and cancel controls."
      },
      {
        title: "History",
        summary: "Recent",
        body: "Completed decisions stay visible without taking over the active queue."
      }
    ]
  },
  admin: {
    name: "Staff access",
    eyebrow: "Admin record",
    status: "1 pending",
    meta: "Admin only | Role-aware permissions",
    initials: "AD",
    action: "Invite staff",
    sections: [
      {
        title: "Staff Directory",
        summary: "Access control",
        body: "Only authorized staff records are visible, and admin subjects are hidden for instructor accounts."
      },
      {
        title: "Permissions",
        summary: "Role scoped",
        body: "Staff roles determine which subjects and edit controls are available in the shell."
      },
      {
        title: "Audit Trail",
        summary: "Inline",
        body: "Administrative changes are shown as the bottom section of the record."
      }
    ]
  }
};

const recordsBySubitem: Partial<Record<SubjectId, Record<string, StaffRecord>>> = {
  schedule: {
    week: {
      name: "Current week schedule",
      eyebrow: "Week View",
      status: "2 warnings",
      meta: "Week starts Monday | 30-minute slots | 18 scheduled activities",
      initials: "WK",
      action: "Add Lesson",
      sections: [
        {
          title: "Week View",
          summary: "Monday start",
          body: "The week view groups Lessons and Practice Rides by day while keeping Scheduling Constraints visible."
        },
        {
          title: "Warning Overrides",
          summary: "2 open",
          body: "Same-Day Student Activity Warnings stay inline until staff acknowledge a Warning Override."
        },
        {
          title: "Audit Trail",
          summary: "Admin visible",
          body: "Recent week-level schedule edits remain attached to the selected schedule record."
        }
      ]
    }
  },
  students: {
    "needs-review": {
      name: "Students needing review",
      eyebrow: "Student list",
      status: "2 open",
      meta: "Riding Level Opinions | Guardian gaps | Lesson Balance review",
      initials: "SR",
      action: "Open Review",
      sections: [
        {
          title: "Review Reasons",
          summary: "2 students",
          body: "Students enter this view when their record has a Riding Level Opinion, missing Guardian data, or Lesson Balance attention."
        },
        {
          title: "Next Action",
          summary: "Admin scoped",
          body: "Admin users can resolve record data. Instructors can submit notes without changing the authoritative Riding Level."
        },
        {
          title: "Audit Trail",
          summary: "Inline",
          body: "Student record changes stay visible at the bottom of the detail stack."
        }
      ]
    }
  },
  horses: {
    care: {
      name: "Horse Concerns",
      eyebrow: "Horse list",
      status: "1 open",
      meta: "Horse Status | Limited Use | Horse Availability Constraints",
      initials: "HC",
      action: "Add Concern",
      sections: [
        {
          title: "Open Concerns",
          summary: "Needs staff attention",
          body: "Horse Concerns do not change Horse Status by themselves, but they stay visible before Horse Assignment decisions."
        },
        {
          title: "Limited Use",
          summary: "Acknowledgement required",
          body: "Limited Use horses can still be scheduled when staff explicitly acknowledge the warning."
        },
        {
          title: "Usage History",
          summary: "This week",
          body: "Lessons and Practice Rides are shown together so workload is easy to scan."
        }
      ]
    }
  },
  lessons: {
    ledger: {
      name: "Lesson Ledger",
      eyebrow: "Lesson Balance record",
      status: "1 adjustment",
      meta: "Lesson Packages | Lesson Credits | Manual Ledger Adjustments",
      initials: "LL",
      action: "Add Adjustment",
      sections: [
        {
          title: "Lesson Balance",
          summary: "Calculated",
          body: "The current Lesson Balance is calculated from package additions, Lesson Credit deductions, and corrections."
        },
        {
          title: "Manual Ledger Adjustments",
          summary: "Admin only",
          body: "Manual Ledger Adjustments add new entries without editing prior Lesson Ledger rows."
        },
        {
          title: "Audit Trail",
          summary: "Inline",
          body: "Every balance-affecting change remains visible with its source."
        }
      ]
    }
  },
  review: {
    completed: {
      name: "Completed Operational Review",
      eyebrow: "Operational Review history",
      status: "Recent",
      meta: "Already-effective changes | Admin attention history",
      initials: "CR",
      action: "Reopen Item",
      sections: [
        {
          title: "Completed Items",
          summary: "Recent decisions",
          body: "Operational Review history shows already-effective changes that staff already handled."
        },
        {
          title: "Decision Notes",
          summary: "Record context",
          body: "Each completed review item keeps the source Student, Horse, Lesson, or Lesson Ledger context."
        },
        {
          title: "Audit Trail",
          summary: "Inline",
          body: "Review decisions stay attached to the record rather than becoming a separate approval workflow."
        }
      ]
    }
  },
  admin: {
    audit: {
      name: "Audit trail",
      eyebrow: "Admin record",
      status: "Admin only",
      meta: "Staff access | Session changes | Record edits",
      initials: "AT",
      action: "Export Audit",
      sections: [
        {
          title: "Recent Events",
          summary: "System-wide",
          body: "Admin users can scan staff access changes, session events, and record edits from one place."
        },
        {
          title: "Staff Access",
          summary: "Role scoped",
          body: "Access changes are tied to Admin and Instructor records."
        },
        {
          title: "Record Changes",
          summary: "Inline sources",
          body: "Audit events link back to the selected record-level URL."
        }
      ]
    }
  }
};

const subjectItems: Record<SubjectId, string[]> = {
  schedule: ["10:00 AM private lesson", "10:30 AM beginner flatwork", "11:00 AM practice ride"],
  students: ["Maya Thompson", "Eli Chen", "Sofia Reyes"],
  horses: ["Juniper", "Copper", "Bluebell"],
  lessons: ["Beginner flatwork", "Novice poles", "Private lunge"],
  review: ["Missing instructor confirmation", "Horse workload conflict", "Manual Ledger Adjustment"],
  admin: ["New staff invitation", "Role change request", "Emergency account review"]
};

const itemsBySubitem: Partial<Record<SubjectId, Record<string, string[]>>> = {
  schedule: {
    week: ["Monday beginner lesson", "Wednesday Practice Ride", "Friday Lesson Type review"]
  },
  students: {
    "needs-review": ["Maya Thompson", "Riding Level Opinion", "Guardian follow-up"]
  },
  horses: {
    care: ["Juniper Horse Concern", "Limited Use acknowledgement", "Horse Availability Constraint"]
  },
  lessons: {
    ledger: ["Lesson Package addition", "Lesson Credit deduction", "Manual Ledger Adjustment"]
  },
  review: {
    completed: ["Resolved Horse Concern", "Closed Lesson Balance review", "Reviewed Warning Override"]
  },
  admin: {
    audit: ["Staff access changed", "Emergency login used", "Student record edited"]
  }
};

export default function HomePage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [emergencyUsername, setEmergencyUsername] = useState("farmadmin");
  const [emergencyPassword, setEmergencyPassword] = useState("farmadmin");
  const [openSubject, setOpenSubject] = useState<SubjectId | null>("schedule");
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>("schedule");
  const [selectedChild, setSelectedChild] = useState("calendar");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/me");

        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const payload = (await response.json()) as MeResponse;
        if (!cancelled) {
          setUser(payload.user);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleNavigation = useMemo(
    () => navigation.filter((subject) => !subject.adminOnly || user?.role === "admin"),
    [user?.role]
  );

  function signInWithGoogle() {
    window.location.assign("/api/auth/google/start");
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
    setMessage("Signed out.");
  }

  async function emergencyLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/auth/emergency", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: emergencyUsername,
        password: emergencyPassword
      })
    });

    if (!response.ok) {
      setMessage("Emergency login failed.");
      return;
    }

    const payload = (await response.json()) as MeResponse;
    setUser(payload.user);
    setOpenSubject("schedule");
    setSelectedSubject("schedule");
    setSelectedChild("calendar");
    setMessage("Emergency login successful.");
  }

  function selectSubject(subject: NavSubject) {
    setOpenSubject(openSubject === subject.id ? null : subject.id);
    setSelectedSubject(subject.id);
    setSelectedChild(subject.children[0]?.id ?? subject.id);
    setSearchText("");
  }

  function selectChild(subject: NavSubject, child: NavChild) {
    setOpenSubject(subject.id);
    setSelectedSubject(subject.id);
    setSelectedChild(child.id);
    setSearchText("");
  }

  return (
    <main style={pageStyle}>
      {!user ? (
        <section aria-labelledby="mvp-shell-title" style={signinShellStyle}>
          <div style={heroStyle}>
            <div style={eyebrowStyle}>Staff workspace</div>
            <h1 id="mvp-shell-title" style={titleStyle}>
              Horse Farm Management
            </h1>
            <p style={ledeStyle}>
              Internal scheduling, horse assignment, practice ride, and lesson credit tools for farm
              staff.
            </p>
          </div>

          <div style={signinCardStyle}>
            <div style={signinCopyStyle}>
              <div style={smallLabelStyle}>Authentication</div>
              <h2 style={cardTitleStyle}>Sign in with Google</h2>
              <p style={cardTextStyle}>
                Use the farm&apos;s Google OAuth flow to access the staff shell.
              </p>
            </div>

            <button type="button" onClick={signInWithGoogle} style={googleButtonStyle}>
              <GoogleMark />
              <span>Sign in with Google</span>
            </button>

            <p style={footnoteStyle}>
              Emergency access is available through the backend with the temporary
              `farmadmin` account.
            </p>

            <details style={emergencyDisclosureStyle}>
              <summary style={emergencySummaryStyle}>Emergency login</summary>
              <form onSubmit={emergencyLogin} style={emergencyFormStyle}>
                <label style={fieldLabelStyle}>
                  Username
                  <input
                    value={emergencyUsername}
                    onChange={(event) => setEmergencyUsername(event.target.value)}
                    style={fieldInputStyle}
                    autoComplete="username"
                  />
                </label>
                <label style={fieldLabelStyle}>
                  Password
                  <input
                    value={emergencyPassword}
                    onChange={(event) => setEmergencyPassword(event.target.value)}
                    style={fieldInputStyle}
                    type="password"
                    autoComplete="current-password"
                  />
                </label>
                <button type="submit" style={emergencyButtonStyle}>
                  Sign in as emergency admin
                </button>
              </form>
            </details>
          </div>

          {message ? <p style={messageStyle}>{message}</p> : null}
        </section>
      ) : (
        <StaffWorkspace
          loading={loading}
          message={message}
          openSubject={openSubject}
          selectedChild={selectedChild}
          selectedSubject={selectedSubject}
          searchText={searchText}
          user={user}
          visibleNavigation={visibleNavigation}
          onLogout={logout}
          onSelectChild={selectChild}
          onSelectSubject={selectSubject}
          onSearchTextChange={setSearchText}
        />
      )}
    </main>
  );
}

function StaffWorkspace({
  loading,
  message,
  openSubject,
  selectedChild,
  selectedSubject,
  searchText,
  user,
  visibleNavigation,
  onLogout,
  onSelectChild,
  onSelectSubject,
  onSearchTextChange
}: {
  loading: boolean;
  message: string;
  openSubject: SubjectId | null;
  selectedChild: string;
  selectedSubject: SubjectId;
  searchText: string;
  user: SessionUser;
  visibleNavigation: NavSubject[];
  onLogout: () => void;
  onSelectChild: (subject: NavSubject, child: NavChild) => void;
  onSelectSubject: (subject: NavSubject) => void;
  onSearchTextChange: (value: string) => void;
}) {
  const contentRef = useRef<HTMLElement | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCompactHeader, setIsCompactHeader] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"needs-review" | "active" | "all">("needs-review");
  const [visibleCount, setVisibleCount] = useState(3);
  const [selectedListItem, setSelectedListItem] = useState("");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [draftSectionText, setDraftSectionText] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const activeSubject = visibleNavigation.find((subject) => subject.id === selectedSubject) ?? visibleNavigation[0];
  const activeChild =
    activeSubject.children.find((child) => child.id === selectedChild) ?? activeSubject.children[0];
  const userSettingsRecord: StaffRecord = {
    name: user.display_name,
    eyebrow: "User settings",
    status: user.role,
    meta: `${user.email} | Profile and workspace preferences`,
    initials: user.display_name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    action: "Save Profile",
    sections: [
      {
        title: "Profile",
        summary: "Staff identity",
        body: `Signed in as ${user.display_name} with ${user.email}.`
      },
      {
        title: "Workspace",
        summary: "Navigation defaults",
        body: "The staff workspace opens to Schedule and keeps the left menu fixed on desktop."
      },
      {
        title: "Security",
        summary: "Session controls",
        body: "Use Sign out when leaving a shared device."
      }
    ]
  };
  const record = isUserSettingsOpen
    ? userSettingsRecord
    : recordsBySubitem[activeSubject.id]?.[activeChild.id] ?? recordsBySubject[activeSubject.id];
  const sourceItems = isUserSettingsOpen
    ? ["Profile", "Workspace", "Security"]
    : itemsBySubitem[activeSubject.id]?.[activeChild.id] ?? subjectItems[activeSubject.id];
  const searchedItems = sourceItems.filter((item) =>
    item.toLowerCase().includes(searchText.trim().toLowerCase())
  );
  const filteredItems = searchedItems.filter((_, index) => {
    if (activeFilter === "all") {
      return true;
    }
    if (activeFilter === "active") {
      return index !== 1;
    }
    return index < 3;
  });
  const listItems = filteredItems.slice(0, visibleCount);

  useEffect(() => {
    if (isUserSettingsOpen) {
      window.history.replaceState(null, "", "/settings/profile");
      return;
    }
    const slug = record.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    window.history.replaceState(null, "", `/${activeSubject.id}/${slug}`);
  }, [activeSubject.id, isUserSettingsOpen, record.name]);

  useEffect(() => {
    setActiveFilter("needs-review");
    setVisibleCount(3);
    setSelectedListItem("");
    setEditingSection(null);
    setActionNotice("");
  }, [activeSubject.id, activeChild.id, isUserSettingsOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 820px)");

    function syncViewport() {
      setIsNarrow(mediaQuery.matches);
      if (!mediaQuery.matches) {
        setIsDrawerOpen(false);
      }
    }

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  useEffect(() => {
    const scrollContainer = contentRef.current;
    if (scrollContainer === null) {
      return;
    }
    const activeScrollContainer: HTMLElement = scrollContainer;

    function syncCompactHeader() {
      setIsCompactHeader(activeScrollContainer.scrollTop > 64);
    }

    syncCompactHeader();
    activeScrollContainer.addEventListener("scroll", syncCompactHeader, { passive: true });

    return () => {
      activeScrollContainer.removeEventListener("scroll", syncCompactHeader);
    };
  }, []);

  function selectSubjectAndMaybeClose(subject: NavSubject) {
    setIsUserSettingsOpen(false);
    onSelectSubject(subject);
  }

  function selectChildAndMaybeClose(subject: NavSubject, child: NavChild) {
    setIsUserSettingsOpen(false);
    onSelectChild(subject, child);
    if (isNarrow) {
      setIsDrawerOpen(false);
    }
  }

  function selectFilter(filter: "needs-review" | "active" | "all") {
    setActiveFilter(filter);
    setVisibleCount(3);
    setActionNotice(`Showing ${filter.replace("-", " ")} items for ${isUserSettingsOpen ? "User settings" : activeChild.label}.`);
  }

  function startSectionEdit(sectionTitle: string, sectionBody: string) {
    setEditingSection(sectionTitle);
    setDraftSectionText(sectionBody);
    setActionNotice(`Editing ${sectionTitle}.`);
  }

  function saveSectionEdit(sectionTitle: string) {
    setEditingSection(null);
    setActionNotice(`${sectionTitle} saved.`);
  }

  function cancelSectionEdit(sectionTitle: string) {
    setEditingSection(null);
    setActionNotice(`${sectionTitle} edit cancelled.`);
  }

  return (
    <section style={isNarrow ? narrowWorkspaceStyle : workspaceStyle} aria-label="Staff workspace">
      {isNarrow ? (
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          style={drawerTriggerStyle}
          aria-expanded={isDrawerOpen}
          aria-controls="staff-subject-drawer"
        >
          <Icon name="menu" />
          <span>Subjects</span>
        </button>
      ) : null}

      {isNarrow && isDrawerOpen ? (
        <button
          type="button"
          aria-label="Close subject drawer"
          onClick={() => setIsDrawerOpen(false)}
          style={drawerOverlayStyle}
        />
      ) : null}

      <aside
        id="staff-subject-drawer"
        style={{
          ...sidebarStyle,
          ...(isNarrow ? narrowSidebarStyle : null),
          ...(isNarrow && isDrawerOpen ? openDrawerStyle : null)
        }}
        aria-label="Subject navigation"
      >
        <div style={brandBlockStyle}>
          <div style={brandMarkStyle}>HF</div>
          <div>
            <div style={brandTitleStyle}>Horse Farm</div>
            <div style={brandMetaStyle}>{user.role} workspace</div>
          </div>
        </div>

        <nav style={navStyle}>
          {visibleNavigation.map((subject) => {
            const isOpen = openSubject === subject.id;
            const isActive = selectedSubject === subject.id;

            return (
              <div key={subject.id} style={navGroupStyle}>
                <button
                  type="button"
                  onClick={() => selectSubjectAndMaybeClose(subject)}
                  aria-expanded={isOpen}
                  style={{
                    ...subjectButtonStyle,
                    ...(isActive ? activeSubjectButtonStyle : null)
                  }}
                >
                  <Icon name={subject.icon} />
                  <span style={subjectLabelStyle}>{subject.label}</span>
                  {subject.count ? <span style={countStyle}>{subject.count}</span> : null}
                  <span style={{ ...chevronStyle, transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                    {">"}
                  </span>
                </button>

                {isOpen ? (
                  <div style={childListStyle}>
                    {subject.children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => selectChildAndMaybeClose(subject, child)}
                        aria-current={isActive && selectedChild === child.id ? "page" : undefined}
                        style={{
                          ...childButtonStyle,
                          ...(isActive && selectedChild === child.id ? activeChildButtonStyle : null)
                        }}
                      >
                        <span>{child.label}</span>
                        {child.count ? <span style={childCountStyle}>{child.count}</span> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div style={sessionPanelStyle}>
          <div style={sessionLabelStyle}>{loading ? "Loading..." : "Signed in"}</div>
          <button
            type="button"
            onClick={() => {
              setIsUserSettingsOpen(true);
              setActionNotice("Opened user settings.");
              if (isNarrow) {
                setIsDrawerOpen(false);
              }
            }}
            style={sessionNameButtonStyle}
          >
            {user.display_name}
          </button>
          <div style={sessionEmailStyle}>{user.email}</div>
          <button type="button" onClick={onLogout} style={logoutButtonStyle}>
            Sign out
          </button>
        </div>
      </aside>

      <section ref={contentRef} style={isNarrow ? narrowContentStyle : contentStyle} aria-live="polite">
        <header
          style={{
            ...summaryStripStyle,
            ...(isCompactHeader ? compactSummaryStripStyle : null),
            ...(isNarrow ? narrowSummaryStripStyle : null)
          }}
        >
          <div style={isCompactHeader ? compactAvatarStyle : avatarStyle}>{record.initials}</div>
          <div style={summaryCopyStyle}>
            {!isCompactHeader ? <div style={recordEyebrowStyle}>{record.eyebrow}</div> : null}
            <h1 style={recordTitleStyle}>{record.name}</h1>
            {!isCompactHeader ? <p style={recordMetaStyle}>{record.meta}</p> : null}
          </div>
          <span style={statusBadgeStyle}>{record.status}</span>
          <div style={quickActionsStyle}>
            <button
              type="button"
              onClick={() => setActionNotice(`${record.action} opened for ${record.name}.`)}
              style={quickActionStyle}
            >
              {record.action}
            </button>
            <button
              type="button"
              onClick={() => setActionNotice(`Note panel opened for ${record.name}.`)}
              style={secondaryQuickActionStyle}
            >
              Note
            </button>
            <button
              type="button"
              onClick={() => setActionNotice(`Print preview prepared for ${record.name}.`)}
              style={secondaryQuickActionStyle}
            >
              Print
            </button>
          </div>
        </header>

        <div style={contentInnerStyle}>
          <div
            style={{
              ...toolbarStyle,
              top: isNarrow ? "84px" : "84px",
              ...(isNarrow ? narrowToolbarStyle : null)
            }}
          >
            <input
              aria-label={`Search ${activeSubject.label}`}
              placeholder={`Search ${activeSubject.label.toLowerCase()}`}
              value={searchText}
              onChange={(event) => onSearchTextChange(event.target.value)}
              style={searchStyle}
            />
            <div style={filterRowStyle}>
              <button
                type="button"
                onClick={() => selectFilter("needs-review")}
                style={activeFilter === "needs-review" ? filterChipActiveStyle : filterChipStyle}
              >
                Needs review 3
              </button>
              <button
                type="button"
                onClick={() => selectFilter("active")}
                style={activeFilter === "active" ? filterChipActiveStyle : filterChipStyle}
              >
                Active 8
              </button>
              <button
                type="button"
                onClick={() => selectFilter("all")}
                style={activeFilter === "all" ? filterChipActiveStyle : filterChipStyle}
              >
                All 14
              </button>
            </div>
          </div>

          <section style={listSectionStyle} aria-labelledby="selected-subject-title">
            <div>
              <div style={smallLabelStyle}>{activeSubject.label}</div>
              <h2 id="selected-subject-title" style={sectionTitleStyle}>
                {activeChild.label}
              </h2>
            </div>

            <div style={recordListStyle}>
              {listItems.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setSelectedListItem(item);
                    setActionNotice(`${item} selected.`);
                  }}
                  style={selectedListItem === item || (!selectedListItem && index === 0) ? selectedRowStyle : rowStyle}
                >
                  <span style={rowAvatarStyle}>{item.slice(0, 2).toUpperCase()}</span>
                  <span style={rowTextStyle}>
                    <strong>{item}</strong>
                    <span>{index === 0 ? record.status : "Ready"}</span>
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setVisibleCount((current) => current + 3);
                setActionNotice(`Loaded more ${isUserSettingsOpen ? "settings" : activeChild.label.toLowerCase()} rows.`);
              }}
              style={loadMoreButtonStyle}
            >
              Load more
            </button>
          </section>

          {actionNotice ? <p style={noticeStyle}>{actionNotice}</p> : null}

          <section style={detailStackStyle} aria-label={`${record.name} details`} tabIndex={-1}>
            {record.sections.map((section, index) => (
              <article
                key={section.title}
                style={{
                  ...detailCardStyle,
                  ...(index === 1 ? importantDetailCardStyle : null)
                }}
              >
                <header style={detailHeaderStyle}>
                  <div>
                    <h3 style={detailTitleStyle}>{section.title}</h3>
                    <p style={detailSummaryStyle}>{section.summary}</p>
                  </div>
                  {editingSection === section.title ? (
                    <div style={sectionActionGroupStyle}>
                      <button
                        type="button"
                        onClick={() => saveSectionEdit(section.title)}
                        style={sectionEditButtonStyle}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelSectionEdit(section.title)}
                        style={sectionEditButtonStyle}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startSectionEdit(section.title, section.body)}
                      style={sectionEditButtonStyle}
                    >
                      Edit
                    </button>
                  )}
                </header>
                {editingSection === section.title ? (
                  <textarea
                    value={draftSectionText}
                    onChange={(event) => setDraftSectionText(event.target.value)}
                    style={sectionTextareaStyle}
                  />
                ) : (
                  <p style={detailBodyStyle}>{section.body}</p>
                )}
              </article>
            ))}
          </section>

          {message ? <p style={messageStyle}>{message}</p> : null}
        </div>
      </section>
    </section>
  );
}

function Icon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 1.8
  } as const;

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" style={iconStyle}>
      {name === "calendar" ? (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" {...common} />
          <path d="M8 3v4M16 3v4M4 10h16" {...common} />
        </>
      ) : null}
      {name === "students" ? (
        <>
          <path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4" {...common} />
          <circle cx="12" cy="9" r="3" {...common} />
          <path d="M20 18c-.2-1.6-1.2-2.9-2.6-3.5M4 18c.2-1.6 1.2-2.9 2.6-3.5" {...common} />
        </>
      ) : null}
      {name === "horse" ? (
        <>
          <path d="M7 18V9l3-4h6l3 5v8" {...common} />
          <path d="M7 12h12M10 18v-4M16 18v-4" {...common} />
        </>
      ) : null}
      {name === "clipboard" ? (
        <>
          <rect x="6" y="4" width="12" height="17" rx="2" {...common} />
          <path d="M9 4.5h6M9 10h6M9 14h4" {...common} />
        </>
      ) : null}
      {name === "review" ? (
        <>
          <path d="M5 5h14v10H8l-3 3V5Z" {...common} />
          <path d="M9 9h6M9 12h4" {...common} />
        </>
      ) : null}
      {name === "settings" ? (
        <>
          <circle cx="12" cy="12" r="3" {...common} />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" {...common} />
        </>
      ) : null}
      {name === "menu" ? (
        <>
          <path d="M4 7h16M4 12h16M4 17h16" {...common} />
        </>
      ) : null}
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.652 32.657 29.2 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.038l5.657-5.657C34.041 6.053 29.28 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.038l5.657-5.657C34.041 6.053 29.28 4 24 4c-7.682 0-14.349 4.342-17.694 10.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.157 0 9.874-1.977 13.446-5.196l-6.206-5.238C29.285 35.091 26.781 36 24 36c-5.177 0-9.618-3.317-11.296-7.946l-6.52 5.018C9.497 39.556 16.227 44 24 44z"
      />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.036 12.036 0 0 1-4.063 5.566l.003-.003 6.206 5.238C36.99 40.055 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#f4f2eb",
  color: "#20241f"
};

const signinShellStyle: CSSProperties = {
  width: "min(1040px, 100%)",
  margin: "0 auto",
  padding: "32px",
  display: "grid",
  gap: "28px"
};

const heroStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
  maxWidth: "820px"
};

const eyebrowStyle: CSSProperties = {
  color: "#607062",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontSize: "13px"
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(44px, 7vw, 74px)",
  lineHeight: 0.92,
  letterSpacing: "0"
};

const ledeStyle: CSSProperties = {
  margin: 0,
  maxWidth: "760px",
  fontSize: "18px",
  lineHeight: 1.6
};

const signinCardStyle: CSSProperties = {
  display: "grid",
  gap: "20px",
  padding: "28px",
  borderRadius: "8px",
  background: "#fff",
  border: "1px solid #ddd9cc",
  maxWidth: "560px"
};

const signinCopyStyle: CSSProperties = {
  display: "grid",
  gap: "10px"
};

const smallLabelStyle: CSSProperties = {
  margin: 0,
  color: "#607062",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase"
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "28px",
  lineHeight: 1.05
};

const cardTextStyle: CSSProperties = {
  margin: 0,
  lineHeight: 1.6,
  color: "#41493f"
};

const googleButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  width: "fit-content",
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1px solid #d7d2c4",
  background: "#fff",
  color: "#1f1f1f",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 700
};

const footnoteStyle: CSSProperties = {
  margin: 0,
  color: "#607062",
  fontSize: "14px",
  lineHeight: 1.5
};

const workspaceStyle: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "280px minmax(0, 1fr)"
};

const narrowWorkspaceStyle: CSSProperties = {
  minHeight: "100vh",
  display: "block"
};

const drawerTriggerStyle: CSSProperties = {
  position: "fixed",
  top: "12px",
  left: "12px",
  zIndex: 8,
  minHeight: "42px",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "9px 11px",
  borderRadius: "8px",
  border: "1px solid #d7d1c2",
  background: "#fff",
  color: "#263425",
  cursor: "pointer",
  fontWeight: 800,
  boxShadow: "0 8px 24px rgba(38, 52, 37, 0.12)"
};

const drawerOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9,
  border: 0,
  background: "rgba(25, 31, 24, 0.36)",
  cursor: "pointer"
};

const sidebarStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  height: "100vh",
  padding: "18px",
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  gap: "18px",
  background: "#fcfbf7",
  borderRight: "1px solid #ddd8c9"
};

const narrowSidebarStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  top: 0,
  zIndex: 10,
  width: "min(300px, 88vw)",
  transform: "translateX(-102%)",
  transition: "transform 160ms ease",
  boxShadow: "12px 0 32px rgba(38, 52, 37, 0.18)"
};

const openDrawerStyle: CSSProperties = {
  transform: "translateX(0)"
};

const brandBlockStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  paddingBottom: "12px",
  borderBottom: "1px solid #e4dfd2"
};

const brandMarkStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  display: "grid",
  placeItems: "center",
  borderRadius: "8px",
  background: "#273628",
  color: "#fff",
  fontWeight: 800
};

const brandTitleStyle: CSSProperties = {
  fontWeight: 800
};

const brandMetaStyle: CSSProperties = {
  color: "#697264",
  fontSize: "13px",
  textTransform: "capitalize"
};

const navStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "8px",
  overflowY: "auto"
};

const navGroupStyle: CSSProperties = {
  display: "grid",
  gap: "4px"
};

const subjectButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "44px",
  display: "grid",
  gridTemplateColumns: "22px 1fr auto 12px",
  alignItems: "center",
  gap: "10px",
  padding: "9px 10px",
  borderRadius: "8px",
  border: "1px solid transparent",
  background: "transparent",
  color: "#30372f",
  cursor: "pointer",
  textAlign: "left"
};

const activeSubjectButtonStyle: CSSProperties = {
  background: "#eef3ea",
  borderColor: "#d3dfcb",
  color: "#1f321f"
};

const subjectLabelStyle: CSSProperties = {
  fontWeight: 700
};

const countStyle: CSSProperties = {
  minWidth: "24px",
  height: "22px",
  padding: "0 7px",
  borderRadius: "999px",
  display: "inline-grid",
  placeItems: "center",
  background: "#fff",
  border: "1px solid #d4dacd",
  color: "#334331",
  fontSize: "12px",
  fontWeight: 800
};

const chevronStyle: CSSProperties = {
  color: "#687366",
  transition: "transform 140ms ease"
};

const childListStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  marginLeft: "12px",
  padding: "4px 0 4px 20px",
  borderLeft: "1px solid #d9d5c8"
};

const childButtonStyle: CSSProperties = {
  minHeight: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  padding: "8px 10px",
  borderRadius: "7px",
  border: "1px solid transparent",
  background: "transparent",
  color: "#4d554b",
  cursor: "pointer",
  textAlign: "left"
};

const activeChildButtonStyle: CSSProperties = {
  background: "#263425",
  borderColor: "#263425",
  color: "#fff",
  fontWeight: 800
};

const childCountStyle: CSSProperties = {
  color: "#66705f",
  fontSize: "12px",
  fontWeight: 800
};

const iconStyle: CSSProperties = {
  display: "block"
};

const sessionPanelStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  padding: "12px",
  borderRadius: "8px",
  background: "#f1eee6",
  border: "1px solid #ded8c8"
};

const sessionLabelStyle: CSSProperties = {
  color: "#65705f",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.08em"
};

const sessionNameStyle: CSSProperties = {
  fontWeight: 800
};

const sessionNameButtonStyle: CSSProperties = {
  width: "fit-content",
  padding: 0,
  border: 0,
  background: "transparent",
  color: "#20241f",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 800,
  textAlign: "left"
};

const sessionEmailStyle: CSSProperties = {
  color: "#5f685b",
  fontSize: "13px",
  overflowWrap: "anywhere"
};

const logoutButtonStyle: CSSProperties = {
  width: "fit-content",
  padding: "9px 11px",
  borderRadius: "8px",
  border: "1px solid #263425",
  background: "#263425",
  color: "#fff",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 800
};

const contentStyle: CSSProperties = {
  minHeight: "100vh",
  maxHeight: "100vh",
  overflowY: "auto"
};

const narrowContentStyle: CSSProperties = {
  minHeight: "100vh",
  maxHeight: "100vh",
  overflowY: "auto"
};

const summaryStripStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 5,
  minHeight: "84px",
  display: "grid",
  gridTemplateColumns: "54px minmax(220px, 1fr) auto auto",
  alignItems: "center",
  gap: "14px",
  padding: "16px 24px",
  background: "rgba(252, 251, 247, 0.96)",
  borderBottom: "1px solid #ddd8c9"
};

const compactSummaryStripStyle: CSSProperties = {
  gridTemplateColumns: "42px minmax(160px, 1fr) auto auto",
  gap: "10px"
};

const narrowSummaryStripStyle: CSSProperties = {
  gridTemplateColumns: "42px minmax(0, 1fr) auto",
  padding: "12px 12px 12px 112px"
};

const avatarStyle: CSSProperties = {
  width: "50px",
  height: "50px",
  borderRadius: "8px",
  display: "grid",
  placeItems: "center",
  background: "#304131",
  color: "#fff",
  fontWeight: 800
};

const compactAvatarStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "8px",
  display: "grid",
  placeItems: "center",
  background: "#304131",
  color: "#fff",
  fontSize: "13px",
  fontWeight: 800
};

const summaryCopyStyle: CSSProperties = {
  display: "grid",
  gap: "3px"
};

const recordEyebrowStyle: CSSProperties = {
  color: "#607062",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase"
};

const recordTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "24px",
  lineHeight: 1.1
};

const recordMetaStyle: CSSProperties = {
  margin: 0,
  color: "#5c6658",
  fontSize: "14px"
};

const statusBadgeStyle: CSSProperties = {
  padding: "7px 10px",
  borderRadius: "999px",
  background: "#fff4cf",
  color: "#614900",
  border: "1px solid #e7d58d",
  fontSize: "13px",
  fontWeight: 800,
  whiteSpace: "nowrap"
};

const quickActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  flexWrap: "wrap"
};

const quickActionStyle: CSSProperties = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #263425",
  background: "#263425",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 800
};

const secondaryQuickActionStyle: CSSProperties = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #d7d1c2",
  background: "#fff",
  color: "#263425",
  cursor: "pointer",
  fontWeight: 800
};

const contentInnerStyle: CSSProperties = {
  width: "min(1040px, 100%)",
  display: "grid",
  gap: "18px",
  padding: "22px 24px 40px"
};

const toolbarStyle: CSSProperties = {
  position: "sticky",
  top: "84px",
  zIndex: 4,
  display: "grid",
  gridTemplateColumns: "minmax(220px, 1fr) auto",
  alignItems: "center",
  gap: "12px",
  padding: "10px 0",
  background: "#f4f2eb"
};

const narrowToolbarStyle: CSSProperties = {
  gridTemplateColumns: "1fr",
  alignItems: "stretch"
};

const searchStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #d8d2c3",
  background: "#fff"
};

const filterRowStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  justifyContent: "flex-end"
};

const filterChipStyle: CSSProperties = {
  padding: "8px 10px",
  borderRadius: "999px",
  border: "1px solid #d8d2c3",
  background: "#fff",
  color: "#394238",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 700
};

const filterChipActiveStyle: CSSProperties = {
  ...filterChipStyle,
  background: "#e7eee3",
  borderColor: "#c8d5c2"
};

const listSectionStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "18px",
  borderRadius: "8px",
  background: "#fff",
  border: "1px solid #ded8c8"
};

const sectionTitleStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: "22px"
};

const recordListStyle: CSSProperties = {
  display: "grid",
  gap: "8px"
};

const loadMoreButtonStyle: CSSProperties = {
  width: "fit-content",
  justifySelf: "center",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #d8d2c3",
  background: "#fff",
  color: "#263425",
  cursor: "pointer",
  fontWeight: 800
};

const rowStyle: CSSProperties = {
  minHeight: "58px",
  display: "grid",
  gridTemplateColumns: "38px 1fr",
  alignItems: "center",
  gap: "10px",
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid #e2ddd0",
  background: "#fff",
  color: "#252b24",
  cursor: "pointer",
  textAlign: "left"
};

const selectedRowStyle: CSSProperties = {
  ...rowStyle,
  borderColor: "#aebf9f",
  background: "#f1f6ee"
};

const rowAvatarStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "8px",
  display: "grid",
  placeItems: "center",
  background: "#eee9dc",
  color: "#394238",
  fontSize: "12px",
  fontWeight: 800
};

const rowTextStyle: CSSProperties = {
  display: "grid",
  gap: "3px"
};

const detailStackStyle: CSSProperties = {
  display: "grid",
  gap: "12px"
};

const noticeStyle: CSSProperties = {
  margin: 0,
  padding: "10px 12px",
  borderRadius: "8px",
  background: "#eef3ea",
  border: "1px solid #d3dfcb",
  color: "#263425",
  fontWeight: 700
};

const detailCardStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "18px",
  borderRadius: "8px",
  background: "#fff",
  border: "1px solid #ded8c8"
};

const importantDetailCardStyle: CSSProperties = {
  background: "#fbfbf1"
};

const detailHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "16px"
};

const detailTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "18px"
};

const detailSummaryStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#61705c",
  fontSize: "14px",
  fontWeight: 700
};

const sectionEditButtonStyle: CSSProperties = {
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid #d8d2c3",
  background: "#fff",
  color: "#263425",
  cursor: "pointer",
  fontWeight: 800
};

const sectionActionGroupStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  justifyContent: "flex-end"
};

const sectionTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "96px",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #d8d2c3",
  background: "#fff",
  color: "#263425",
  resize: "vertical",
  lineHeight: 1.5
};

const detailBodyStyle: CSSProperties = {
  margin: 0,
  color: "#3f473c",
  lineHeight: 1.55
};

const messageStyle: CSSProperties = {
  margin: 0,
  color: "#3f523d",
  fontWeight: 600
};

const emergencyDisclosureStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  paddingTop: "4px"
};

const emergencySummaryStyle: CSSProperties = {
  cursor: "pointer",
  color: "#4d5b4a",
  fontWeight: 700,
  listStyle: "none"
};

const emergencyFormStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  maxWidth: "360px"
};

const fieldLabelStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  color: "#364136",
  fontWeight: 600,
  fontSize: "14px"
};

const fieldInputStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: "8px",
  border: "1px solid #d8d2c3",
  font: "inherit",
  background: "#fff"
};

const emergencyButtonStyle: CSSProperties = {
  width: "fit-content",
  padding: "11px 16px",
  borderRadius: "8px",
  border: "1px solid #d8d2c3",
  background: "#edf2eb",
  color: "#213021",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 700
};
