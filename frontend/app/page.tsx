"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent
} from "react";

type SessionUser = {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "instructor";
};

type Contact = {
  id: string;
  name: string;
  relationship: string | null;
  phone: string;
  email: string | null;
};

type StaffReference = {
  id: string;
  display_name: string;
};

type RidingLevel = {
  id: string;
  display_name: string;
  description: string;
  sort_order: number;
};

type RidingLevelOpinion = {
  id: string;
  submitted_by: StaffReference;
  recommended_riding_level: RidingLevel;
  note: string | null;
  enters_review: boolean;
  created_at: string;
};

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  active: boolean;
  age_years: number;
  is_minor: boolean;
  date_of_birth: string | null;
  main_instructor: StaffReference;
  riding_level: RidingLevel;
  notes: string | null;
  guardians: Contact[];
  emergency_contacts: Contact[];
  opinions: RidingLevelOpinion[];
};

type MeResponse = {
  user: SessionUser;
};

type StudentsResponse = {
  students: Student[];
};

type RidingLevelsResponse = {
  riding_levels: RidingLevel[];
};

type Workspace = {
  students: Student[];
  riding_levels: RidingLevel[];
};

type StudentFormState = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  active: boolean;
  main_instructor_id: string;
  riding_level_id: string;
  notes: string;
  guardian_name: string;
  guardian_relationship: string;
  guardian_phone: string;
  guardian_email: string;
  emergency_name: string;
  emergency_relationship: string;
  emergency_phone: string;
  emergency_email: string;
};

type OpinionFormState = {
  student_id: string;
  recommended_riding_level_id: string;
  note: string;
};

type RidingLevelDrafts = Record<string, { display_name: string; description: string }>;
type ScheduleView = "calendar" | "list" | "week";
type SidebarSection = "schedule" | "students" | "reviews";

const emptyStudentForm: StudentFormState = {
  first_name: "",
  last_name: "",
  date_of_birth: "",
  active: true,
  main_instructor_id: "staff-mkt-monte",
  riding_level_id: "level-green",
  notes: "",
  guardian_name: "",
  guardian_relationship: "guardian",
  guardian_phone: "",
  guardian_email: "",
  emergency_name: "",
  emergency_relationship: "emergency contact",
  emergency_phone: "",
  emergency_email: ""
};

const emptyOpinionForm: OpinionFormState = {
  student_id: "",
  recommended_riding_level_id: "level-green",
  note: ""
};

const scheduleEntries = [
  {
    time: "08:00",
    title: "Lesson with active rider",
    note: "Calendar check passes, warning shown inline."
  },
  {
    time: "09:30",
    title: "Practice ride",
    note: "Counts toward horse workload and same-day activity."
  },
  {
    time: "11:00",
    title: "Open planning block",
    note: "Ready for the next scheduling dialog."
  }
];

export default function HomePage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const [emergencyUsername, setEmergencyUsername] = useState("farmadmin");
  const [emergencyPassword, setEmergencyPassword] = useState("farmadmin");
  const [workspace, setWorkspace] = useState<Workspace>({ students: [], riding_levels: [] });
  const [studentForm, setStudentForm] = useState<StudentFormState>(emptyStudentForm);
  const [opinionForm, setOpinionForm] = useState<OpinionFormState>(emptyOpinionForm);
  const [ridingLevelDrafts, setRidingLevelDrafts] = useState<RidingLevelDrafts>({});
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentFilter, setStudentFilter] = useState<"all" | "active" | "minor">("all");
  const [visibleCount, setVisibleCount] = useState(4);
  const [scheduleView, setScheduleView] = useState<ScheduleView>("calendar");
  const [sidebarSection, setSidebarSection] = useState<SidebarSection>("schedule");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  useEffect(() => {
    if (!user) {
      setWorkspace({ students: [], riding_levels: [] });
      setStudentForm(emptyStudentForm);
      setOpinionForm(emptyOpinionForm);
      setRidingLevelDrafts({});
      setSelectedStudentId("");
      setSidebarOpen(false);
      return;
    }

    void loadWorkspace();
  }, [user]);

  useEffect(() => {
    if (!workspace.students.length) {
      return;
    }

    setSelectedStudentId((current) => {
      if (current && workspace.students.some((student) => student.id === current)) {
        return current;
      }

      return workspace.students[0]?.id ?? "";
    });
  }, [workspace.students]);

  useEffect(() => {
    setVisibleCount(4);
  }, [studentQuery, studentFilter]);

  async function loadWorkspace() {
    setWorkspaceLoading(true);

    try {
      const [studentsResponse, ridingLevelsResponse] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/riding-levels")
      ]);

      if (!studentsResponse.ok || !ridingLevelsResponse.ok) {
        setWorkspaceMessage("Could not load student management data.");
        return;
      }

      const studentsPayload = (await studentsResponse.json()) as StudentsResponse;
      const levelsPayload = (await ridingLevelsResponse.json()) as RidingLevelsResponse;

      setWorkspace({
        students: studentsPayload.students,
        riding_levels: levelsPayload.riding_levels
      });

      const firstStudent = studentsPayload.students[0];
      const firstLevel = levelsPayload.riding_levels[0];
      const adminMainInstructor =
        firstStudent?.main_instructor.id ?? studentForm.main_instructor_id ?? "staff-mkt-monte";

      setStudentForm((current) => ({
        ...current,
        main_instructor_id: adminMainInstructor,
        riding_level_id: firstLevel?.id ?? current.riding_level_id
      }));

      setOpinionForm((current) => ({
        student_id: current.student_id || firstStudent?.id || "",
        recommended_riding_level_id: current.recommended_riding_level_id || firstLevel?.id || "level-green",
        note: current.note
      }));

      setRidingLevelDrafts(
        Object.fromEntries(
          levelsPayload.riding_levels.map((level) => [
            level.id,
            { display_name: level.display_name, description: level.description }
          ])
        )
      );
    } finally {
      setWorkspaceLoading(false);
    }
  }

  const selectedStudent = useMemo(
    () => workspace.students.find((student) => student.id === selectedStudentId) ?? null,
    [selectedStudentId, workspace.students]
  );

  const filteredStudents = useMemo(() => {
    const normalizedQuery = studentQuery.trim().toLowerCase();

    return [...workspace.students]
      .filter((student) => {
        if (studentFilter === "active" && !student.active) {
          return false;
        }

        if (studentFilter === "minor" && !student.is_minor) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return [student.full_name, student.riding_level.display_name, student.main_instructor.display_name]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((left, right) => importanceScore(right) - importanceScore(left));
  }, [studentFilter, studentQuery, workspace.students]);

  const visibleStudents = filteredStudents.slice(0, visibleCount);
  const remainingStudents = Math.max(filteredStudents.length - visibleStudents.length, 0);
  const reviewCount = workspace.students.filter((student) =>
    student.opinions.some((opinion) => opinion.enters_review)
  ).length;
  const inactiveCount = workspace.students.filter((student) => !student.active).length;
  const attentionCount = reviewCount + inactiveCount;
  const selectedOpinions = selectedStudent?.opinions ?? [];

  const weekStart = startOfMonday(new Date());
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const scheduleWarning =
    selectedStudent && selectedStudent.opinions.some((opinion) => opinion.enters_review)
      ? `${selectedStudent.full_name} has a riding level opinion that enters review.`
      : "Inline warnings stay visible while staff edit the schedule.";

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
    setMessage("Emergency login successful.");
  }

  async function createStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorkspaceMessage("");

    const response = await fetch("/api/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        first_name: studentForm.first_name,
        last_name: studentForm.last_name,
        date_of_birth: studentForm.date_of_birth,
        active: studentForm.active,
        main_instructor_id: studentForm.main_instructor_id,
        riding_level_id: studentForm.riding_level_id,
        notes: studentForm.notes || null,
        guardians: studentForm.guardian_name
          ? [
              {
                name: studentForm.guardian_name,
                relationship: studentForm.guardian_relationship || "guardian",
                phone: studentForm.guardian_phone,
                email: studentForm.guardian_email || null
              }
            ]
          : [],
        emergency_contacts: [
          {
            name: studentForm.emergency_name,
            relationship: studentForm.emergency_relationship || "emergency contact",
            phone: studentForm.emergency_phone,
            email: studentForm.emergency_email || null
          }
        ]
      })
    });

    if (!response.ok) {
      setWorkspaceMessage("Student create failed. Check required fields.");
      return;
    }

    setWorkspaceMessage("Student created.");
    setStudentForm((current) => ({
      ...emptyStudentForm,
      main_instructor_id: current.main_instructor_id,
      riding_level_id: current.riding_level_id
    }));
    await loadWorkspace();
  }

  async function submitOpinion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorkspaceMessage("");

    const response = await fetch(`/api/students/${opinionForm.student_id}/riding-level-opinions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        recommended_riding_level_id: opinionForm.recommended_riding_level_id,
        note: opinionForm.note || null
      })
    });

    if (!response.ok) {
      setWorkspaceMessage("Riding level opinion failed.");
      return;
    }

    setWorkspaceMessage("Riding level opinion submitted.");
    await loadWorkspace();
  }

  async function saveRidingLevel(ridingLevelId: string) {
    const draft = ridingLevelDrafts[ridingLevelId];
    if (!draft) {
      return;
    }

    setWorkspaceMessage("");
    const response = await fetch(`/api/riding-levels/${ridingLevelId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(draft)
    });

    if (!response.ok) {
      setWorkspaceMessage("Riding level update failed.");
      return;
    }

    const updated = (await response.json()) as RidingLevel;
    setWorkspace((current) => ({
      ...current,
      riding_levels: current.riding_levels.map((level) =>
        level.id === updated.id ? updated : level
      )
    }));
    setRidingLevelDrafts((current) => ({
      ...current,
      [updated.id]: {
        display_name: updated.display_name,
        description: updated.description
      }
    }));
    setWorkspaceMessage("Riding level updated.");
  }

  return (
    <main className="page-shell" style={pageStyle}>
      <div className="page-glow" aria-hidden="true" style={pageGlowStyle} />

      <section className="app-shell" style={shellStyle}>
        <div style={heroStyle}>
          <div style={eyebrowStyle}>Staff workspace</div>
          <h1 id="mvp-shell-title" style={titleStyle}>
            Horse Farm Management
          </h1>
          <p style={ledeStyle}>
            Staff-only student records, schedule views, and single-record editing in a layout that
            keeps the sidebar, detail stack, and calendar visible without crowding the page.
          </p>
        </div>

        {!user ? (
          <AuthCard
            emergencyPassword={emergencyPassword}
            emergencyUsername={emergencyUsername}
            message={message}
            onEmergencyPasswordChange={setEmergencyPassword}
            onEmergencyUsernameChange={setEmergencyUsername}
            onEmergencySubmit={emergencyLogin}
            onGoogleSignIn={signInWithGoogle}
          />
        ) : (
          <>
            <button
              type="button"
              className="mobile-menu-button"
              style={mobileMenuButtonStyle}
              onClick={() => setSidebarOpen(true)}
              aria-expanded={sidebarOpen}
              aria-controls="workspace-sidebar"
            >
              Open menu
            </button>

            <div
              className="drawer-backdrop"
              style={drawerBackdropStyle}
              data-open={sidebarOpen ? "true" : "false"}
              onClick={() => setSidebarOpen(false)}
            />

            <div className="workspace-layout" style={workspaceLayoutStyle}>
              <aside
                id="workspace-sidebar"
                className="workspace-sidebar"
                style={sidebarStyle}
                data-open={sidebarOpen ? "true" : "false"}
                aria-label="Workspace navigation"
              >
                <div style={sidebarHeaderStyle}>
                  <div>
                    <div style={smallLabelStyle}>Navigation</div>
                    <h2 style={sidebarTitleStyle}>Subject flow</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    style={sidebarCloseButtonStyle}
                    aria-label="Close menu"
                  >
                    Close
                  </button>
                </div>

                <nav style={sidebarNavStyle}>
                  {[
                    {
                      id: "schedule" as const,
                      label: "Schedule",
                      description: "Calendar, list, and week views",
                      count: 3
                    },
                    {
                      id: "students" as const,
                      label: "Students",
                      description: "Search, filter, and open one subject",
                      count: workspace.students.length
                    },
                    {
                      id: "reviews" as const,
                      label: "Reviews",
                      description: "Attention items and audit visibility",
                      count: attentionCount
                    }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSidebarSection(item.id);
                        setSidebarOpen(false);
                      }}
                      style={sidebarNavButtonStyle(item.id === sidebarSection)}
                    >
                      <div style={sidebarNavButtonLabelStyle}>{item.label}</div>
                      <div style={sidebarNavButtonCopyStyle}>{item.description}</div>
                      <span style={sidebarCountPillStyle}>{item.count}</span>
                    </button>
                  ))}
                </nav>

                <section style={sidebarSummaryCardStyle}>
                  <div style={smallLabelStyle}>Attention</div>
                  <p style={sidebarSummaryTextStyle}>
                    {attentionCount} items need follow-up across inactive students and review
                    opinions.
                  </p>
                  <ul style={sidebarListStyle}>
                    <li>{reviewCount} opinions enter review.</li>
                    <li>{inactiveCount} students are inactive.</li>
                    <li>One subject stays open at a time.</li>
                  </ul>
                </section>

                <button type="button" onClick={logout} style={logoutButtonStyle}>
                  Sign out
                </button>
              </aside>

              <div style={workspaceMainStyle}>
                <section style={surfaceStyle}>
                  <div style={surfaceHeaderStyle}>
                    <div>
                      <div style={smallLabelStyle}>Subject list</div>
                      <h2 style={panelTitleStyle}>Sticky search, filters, and importance sorting</h2>
                    </div>
                    <span style={pillStyle}>
                      {filteredStudents.length} of {workspace.students.length}
                    </span>
                  </div>

                  <div style={listToolbarStyle}>
                    <label style={fieldLabelStyle}>
                      Search
                      <input
                        value={studentQuery}
                        onChange={(event) => setStudentQuery(event.target.value)}
                        placeholder="Search students, riders, or instructors"
                        style={fieldInputStyle}
                      />
                    </label>

                    <label style={fieldLabelStyle}>
                      Filter
                      <select
                        value={studentFilter}
                        onChange={(event) =>
                          setStudentFilter(event.target.value as "all" | "active" | "minor")
                        }
                        style={fieldInputStyle}
                      >
                        <option value="all">All students</option>
                        <option value="active">Active only</option>
                        <option value="minor">Minor only</option>
                      </select>
                    </label>
                  </div>

                  <div style={studentListStyle}>
                    {visibleStudents.map((student) => {
                      const selected = student.id === selectedStudent?.id;

                      return (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudentId(student.id);
                            setSidebarSection("students");
                          }}
                          style={studentRowButtonStyle(selected)}
                        >
                          <div style={studentRowHeaderStyle}>
                            <div>
                              <div style={studentNameStyle}>{student.full_name}</div>
                              <div style={studentMetaStyle}>
                                {student.active ? "Active" : "Inactive"} |{" "}
                                {student.is_minor ? "Minor" : "Adult"} | {student.riding_level.display_name}
                              </div>
                            </div>
                            <span style={studentBadgeStyle(student.active)}>
                              {student.opinions.length} opinions
                            </span>
                          </div>

                          <div style={studentRowCopyStyle}>
                            Main instructor: {student.main_instructor.display_name}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {remainingStudents > 0 ? (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((current) => current + 4)}
                      style={secondaryButtonStyle}
                    >
                      Load more
                    </button>
                  ) : null}
                </section>

                <section style={surfaceStyle}>
                  <div style={surfaceHeaderStyle}>
                    <div>
                      <div style={smallLabelStyle}>Selected record</div>
                      <h2 style={panelTitleStyle}>Summary strip and stacked detail cards</h2>
                    </div>
                    <span style={pillStyle}>
                      {selectedStudent ? "One open subject" : "Select a subject"}
                    </span>
                  </div>

                  {selectedStudent ? (
                    <>
                      <div style={summaryStripStyle}>
                        <div>
                          <div style={summaryNameStyle}>{selectedStudent.full_name}</div>
                          <div style={summaryMetaStyle}>
                            {selectedStudent.active ? "Active" : "Inactive"} | Age{" "}
                            {selectedStudent.age_years} |{" "}
                            {selectedStudent.is_minor ? "Minor" : "Adult"}
                          </div>
                        </div>
                        <div style={summaryPillRowStyle}>
                          <span style={summaryPillStyle}>{selectedStudent.riding_level.display_name}</span>
                          <span style={summaryPillStyle}>{selectedStudent.main_instructor.display_name}</span>
                          <span style={summaryPillStyle}>{selectedStudent.guardians.length} guardians</span>
                          <span style={summaryPillStyle}>
                            {selectedStudent.emergency_contacts.length} emergency contacts
                          </span>
                        </div>
                      </div>

                      <div style={detailGridStyle}>
                        <article style={detailCardStyle}>
                          <div style={detailCardLabelStyle}>Profile</div>
                          <dl style={detailDefinitionStyle}>
                            <Detail label="Student id" value={selectedStudent.id} />
                            <Detail label="Date of birth" value={selectedStudent.date_of_birth ?? "Hidden for instructors"} />
                            <Detail label="Main instructor" value={selectedStudent.main_instructor.display_name} />
                            <Detail label="Riding level" value={selectedStudent.riding_level.display_name} />
                          </dl>
                        </article>

                        <article style={detailCardStyle}>
                          <div style={detailCardLabelStyle}>Contacts</div>
                          <div style={stackListStyle}>
                            <ListBlock
                              title="Guardians"
                              items={
                                selectedStudent.guardians.length > 0
                                  ? selectedStudent.guardians.map((contact) =>
                                      [contact.name, contact.relationship, contact.phone]
                                        .filter(Boolean)
                                        .join(" | ")
                                    )
                                  : ["No guardians on file."]
                              }
                            />
                            <ListBlock
                              title="Emergency contacts"
                              items={
                                selectedStudent.emergency_contacts.length > 0
                                  ? selectedStudent.emergency_contacts.map((contact) =>
                                      [contact.name, contact.relationship, contact.phone]
                                        .filter(Boolean)
                                        .join(" | ")
                                    )
                                  : ["No emergency contacts on file."]
                              }
                            />
                          </div>
                        </article>

                        <article style={detailCardStyle}>
                          <div style={detailCardLabelStyle}>Riding level opinions</div>
                          <ListBlock
                            title="Latest opinions"
                            items={
                              selectedOpinions.length > 0
                                ? selectedOpinions.map((opinion) =>
                                    `${opinion.submitted_by.display_name} suggested ${opinion.recommended_riding_level.display_name}${opinion.enters_review ? " | enters review" : ""}`
                                  )
                                : ["No opinions yet."]
                            }
                          />
                        </article>

                        <article style={detailCardStyle}>
                          <div style={detailCardLabelStyle}>Notes</div>
                          <p style={noteTextStyle}>
                            {selectedStudent.notes ?? "No notes yet. Empty states stay intentional and readable."}
                          </p>
                        </article>
                      </div>

                      {user.role === "admin" ? (
                        <div style={adminSectionGridStyle}>
                          <section style={detailCardStyle}>
                            <div style={detailCardLabelStyle}>Section editing</div>
                            <h3 style={subsectionTitleStyle}>Create student</h3>

                            <form onSubmit={createStudent} style={formGridStyle}>
                              <div style={twoColumnGridStyle}>
                                <Field
                                  label="First name"
                                  value={studentForm.first_name}
                                  onChange={(value) =>
                                    setStudentForm((current) => ({ ...current, first_name: value }))
                                  }
                                />
                                <Field
                                  label="Last name"
                                  value={studentForm.last_name}
                                  onChange={(value) =>
                                    setStudentForm((current) => ({ ...current, last_name: value }))
                                  }
                                />
                              </div>

                              <div style={twoColumnGridStyle}>
                                <Field
                                  label="Date of birth"
                                  type="date"
                                  value={studentForm.date_of_birth}
                                  onChange={(value) =>
                                    setStudentForm((current) => ({ ...current, date_of_birth: value }))
                                  }
                                />
                                <Field
                                  label="Main instructor id"
                                  value={studentForm.main_instructor_id}
                                  onChange={(value) =>
                                    setStudentForm((current) => ({
                                      ...current,
                                      main_instructor_id: value
                                    }))
                                  }
                                />
                              </div>

                              <div style={twoColumnGridStyle}>
                                <SelectField
                                  label="Riding level"
                                  value={studentForm.riding_level_id}
                                  options={workspace.riding_levels.map((level) => ({
                                    value: level.id,
                                    label: level.display_name
                                  }))}
                                  onChange={(value) =>
                                    setStudentForm((current) => ({ ...current, riding_level_id: value }))
                                  }
                                />
                                <label style={checkboxLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={studentForm.active}
                                    onChange={(event) =>
                                      setStudentForm((current) => ({
                                        ...current,
                                        active: event.target.checked
                                      }))
                                    }
                                  />
                                  Active student
                                </label>
                              </div>

                              <Field
                                label="Notes"
                                value={studentForm.notes}
                                onChange={(value) =>
                                  setStudentForm((current) => ({ ...current, notes: value }))
                                }
                              />

                              <div style={subsectionStyle}>
                                <div style={subsectionHeadingStyle}>Guardian</div>
                                <div style={twoColumnGridStyle}>
                                  <Field
                                    label="Guardian name"
                                    value={studentForm.guardian_name}
                                    onChange={(value) =>
                                      setStudentForm((current) => ({
                                        ...current,
                                        guardian_name: value
                                      }))
                                    }
                                  />
                                  <Field
                                    label="Guardian phone"
                                    value={studentForm.guardian_phone}
                                    onChange={(value) =>
                                      setStudentForm((current) => ({
                                        ...current,
                                        guardian_phone: value
                                      }))
                                    }
                                  />
                                </div>
                                <div style={twoColumnGridStyle}>
                                  <Field
                                    label="Guardian relationship"
                                    value={studentForm.guardian_relationship}
                                    onChange={(value) =>
                                      setStudentForm((current) => ({
                                        ...current,
                                        guardian_relationship: value
                                      }))
                                    }
                                  />
                                  <Field
                                    label="Guardian email"
                                    value={studentForm.guardian_email}
                                    onChange={(value) =>
                                      setStudentForm((current) => ({
                                        ...current,
                                        guardian_email: value
                                      }))
                                    }
                                  />
                                </div>
                              </div>

                              <div style={subsectionStyle}>
                                <div style={subsectionHeadingStyle}>Emergency contact</div>
                                <div style={twoColumnGridStyle}>
                                  <Field
                                    label="Contact name"
                                    value={studentForm.emergency_name}
                                    onChange={(value) =>
                                      setStudentForm((current) => ({
                                        ...current,
                                        emergency_name: value
                                      }))
                                    }
                                  />
                                  <Field
                                    label="Contact phone"
                                    value={studentForm.emergency_phone}
                                    onChange={(value) =>
                                      setStudentForm((current) => ({
                                        ...current,
                                        emergency_phone: value
                                      }))
                                    }
                                  />
                                </div>
                                <div style={twoColumnGridStyle}>
                                  <Field
                                    label="Contact relationship"
                                    value={studentForm.emergency_relationship}
                                    onChange={(value) =>
                                      setStudentForm((current) => ({
                                        ...current,
                                        emergency_relationship: value
                                      }))
                                    }
                                  />
                                  <Field
                                    label="Contact email"
                                    value={studentForm.emergency_email}
                                    onChange={(value) =>
                                      setStudentForm((current) => ({
                                        ...current,
                                        emergency_email: value
                                      }))
                                    }
                                  />
                                </div>
                              </div>

                              <button type="submit" style={primaryButtonStyle}>
                                Create student
                              </button>
                            </form>
                          </section>

                          <section style={detailCardStyle}>
                            <div style={detailCardLabelStyle}>Section editing</div>
                            <h3 style={subsectionTitleStyle}>Riding levels</h3>

                            <div style={levelListStyle}>
                              {workspace.riding_levels.map((level) => {
                                const draft = ridingLevelDrafts[level.id] ?? {
                                  display_name: level.display_name,
                                  description: level.description
                                };

                                return (
                                  <article key={level.id} style={levelCardStyle}>
                                    <div style={sectionHeadingStyle}>
                                      <div>
                                        <div style={listLabelStyle}>Stable id</div>
                                        <strong>{level.id}</strong>
                                      </div>
                                      <span style={pillStyle}>#{level.sort_order}</span>
                                    </div>

                                    <div style={twoColumnGridStyle}>
                                      <Field
                                        label="Display name"
                                        value={draft.display_name}
                                        onChange={(value) =>
                                          setRidingLevelDrafts((current) => ({
                                            ...current,
                                            [level.id]: {
                                              display_name: value,
                                              description: current[level.id]?.description ?? level.description
                                            }
                                          }))
                                        }
                                      />
                                      <Field
                                        label="Description"
                                        value={draft.description}
                                        onChange={(value) =>
                                          setRidingLevelDrafts((current) => ({
                                            ...current,
                                            [level.id]: {
                                              display_name:
                                                current[level.id]?.display_name ?? level.display_name,
                                              description: value
                                            }
                                          }))
                                        }
                                      />
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => void saveRidingLevel(level.id)}
                                      style={secondaryButtonStyle}
                                    >
                                      Save level
                                    </button>
                                  </article>
                                );
                              })}
                            </div>
                          </section>
                        </div>
                      ) : (
                        <section style={detailCardStyle}>
                          <div style={detailCardLabelStyle}>Section editing</div>
                          <h3 style={subsectionTitleStyle}>Riding level opinion</h3>

                          <form onSubmit={submitOpinion} style={formGridStyle}>
                            <SelectField
                              label="Student"
                              value={opinionForm.student_id}
                              options={workspace.students.map((student) => ({
                                value: student.id,
                                label: student.full_name
                              }))}
                              onChange={(value) =>
                                setOpinionForm((current) => ({ ...current, student_id: value }))
                              }
                            />
                            <SelectField
                              label="Recommended level"
                              value={opinionForm.recommended_riding_level_id}
                              options={workspace.riding_levels.map((level) => ({
                                value: level.id,
                                label: level.display_name
                              }))}
                              onChange={(value) =>
                                setOpinionForm((current) => ({
                                  ...current,
                                  recommended_riding_level_id: value
                                }))
                              }
                            />
                            <Field
                              label="Note"
                              value={opinionForm.note}
                              onChange={(value) =>
                                setOpinionForm((current) => ({ ...current, note: value }))
                              }
                            />
                            <button type="submit" style={primaryButtonStyle}>
                              Submit opinion
                            </button>
                          </form>
                        </section>
                      )}
                    </>
                  ) : (
                    <p style={emptyStateStyle}>Select a subject from the list to open the stacked detail view.</p>
                  )}
                </section>

                <section style={surfaceStyle}>
                  <div style={surfaceHeaderStyle}>
                    <div>
                      <div style={smallLabelStyle}>Schedule</div>
                      <h2 style={panelTitleStyle}>Calendar and list behavior</h2>
                    </div>
                    <span style={pillStyle}>Monday start | 30-minute slots</span>
                  </div>

                  <div style={toggleRowStyle}>
                    {(["calendar", "list", "week"] as ScheduleView[]).map((view) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => setScheduleView(view)}
                        style={scheduleToggleButtonStyle(scheduleView === view)}
                      >
                        {view}
                      </button>
                    ))}
                  </div>

                  <div style={warningStripStyle}>{scheduleWarning}</div>

                  {scheduleView === "calendar" ? (
                    <div style={calendarGridStyle}>
                      {scheduleEntries.map((entry) => (
                        <article key={entry.time} style={calendarSlotStyle}>
                          <div style={calendarTimeStyle}>{entry.time}</div>
                          <div style={calendarEntryTitleStyle}>{entry.title}</div>
                          <div style={calendarEntryCopyStyle}>{entry.note}</div>
                        </article>
                      ))}
                    </div>
                  ) : null}

                  {scheduleView === "list" ? (
                    <div style={listViewStyle}>
                      {scheduleEntries.map((entry) => (
                        <article key={entry.time} style={listRowStyle}>
                          <div style={listRowTimeStyle}>{entry.time}</div>
                          <div>
                            <div style={calendarEntryTitleStyle}>{entry.title}</div>
                            <div style={calendarEntryCopyStyle}>{entry.note}</div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}

                  {scheduleView === "week" ? (
                    <div style={weekGridStyle}>
                      {weekDays.map((day, index) => (
                        <article key={day.toISOString()} style={weekDayCardStyle}>
                          <div style={weekDayLabelStyle}>{formatWeekday(day)}</div>
                          <div style={weekDayDateStyle}>{formatMonthDay(day)}</div>
                          <div style={weekDayPillStyle}>{index === 0 ? "Monday start" : "30 min slots"}</div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </section>
              </div>
            </div>
          </>
        )}

        {message ? <p style={messageStyle}>{message}</p> : null}
        {workspaceMessage ? <p style={messageStyle}>{workspaceMessage}</p> : null}
      </section>
    </main>
  );
}

function AuthCard({
  emergencyUsername,
  emergencyPassword,
  message,
  onGoogleSignIn,
  onEmergencySubmit,
  onEmergencyUsernameChange,
  onEmergencyPasswordChange
}: {
  emergencyUsername: string;
  emergencyPassword: string;
  message: string;
  onGoogleSignIn: () => void;
  onEmergencySubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onEmergencyUsernameChange: (value: string) => void;
  onEmergencyPasswordChange: (value: string) => void;
}) {
  return (
    <div style={signinCardStyle}>
      <div style={signinCopyStyle}>
        <div style={smallLabelStyle}>Authentication</div>
        <h2 style={cardTitleStyle}>Sign in with Google</h2>
        <p style={cardTextStyle}>Use the farm&apos;s Google OAuth flow to access the staff shell.</p>
      </div>

      <button type="button" onClick={onGoogleSignIn} style={googleButtonStyle}>
        <GoogleMark />
        <span>Sign in with Google</span>
      </button>

      <p style={footnoteStyle}>
        Emergency access is available through the backend with the temporary `farmadmin` account.
      </p>

      <details style={emergencyDisclosureStyle}>
        <summary style={emergencySummaryStyle}>Emergency login</summary>
        <form onSubmit={onEmergencySubmit} style={emergencyFormStyle}>
          <label style={fieldLabelStyle}>
            Username
            <input
              value={emergencyUsername}
              onChange={(event) => onEmergencyUsernameChange(event.target.value)}
              style={fieldInputStyle}
              autoComplete="username"
            />
          </label>
          <label style={fieldLabelStyle}>
            Password
            <input
              value={emergencyPassword}
              onChange={(event) => onEmergencyPasswordChange(event.target.value)}
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

      {message ? <p style={messageStyle}>{message}</p> : null}
    </div>
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
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.036 12.036 0 0 1-4.063 5.566l.003-.003 6.206 5.238C36.99 40.055 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label style={fieldLabelStyle}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={fieldInputStyle}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label style={fieldLabelStyle}>
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={fieldInputStyle}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt style={detailLabelStyle}>{label}</dt>
      <dd style={detailValueStyle}>{value}</dd>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={listBlockStyle}>
      <div style={listLabelStyle}>{title}</div>
      <ul style={listStyle}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function importanceScore(student: Student) {
  return (
    (student.active ? 20 : 0) +
    (student.is_minor ? 8 : 0) +
    student.opinions.filter((opinion) => opinion.enters_review).length * 6 +
    student.guardians.length +
    student.emergency_contacts.length
  );
}

function startOfMonday(date: Date) {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  const offset = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - offset);
  return monday;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short"
  }).format(date);
}

function formatMonthDay(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "28px 20px 36px"
};

const pageGlowStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background:
    "radial-gradient(circle at 12% 0%, rgba(255, 255, 255, 0.48), transparent 26%), radial-gradient(circle at 86% 2%, rgba(158, 132, 95, 0.12), transparent 20%)",
  pointerEvents: "none",
  zIndex: 0
};

const shellStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(1360px, 100%)",
  margin: "0 auto",
  display: "grid",
  gap: "22px"
};

const heroStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  maxWidth: "820px"
};

const eyebrowStyle: CSSProperties = {
  color: "#53604e",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontSize: "13px"
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(44px, 7vw, 76px)",
  lineHeight: 0.92,
  letterSpacing: "-0.06em"
};

const ledeStyle: CSSProperties = {
  margin: 0,
  maxWidth: "760px",
  fontSize: "18px",
  lineHeight: 1.6,
  color: "#314132"
};

const signinCardStyle: CSSProperties = {
  display: "grid",
  gap: "18px",
  padding: "28px",
  borderRadius: "28px",
  background: "rgba(255, 255, 255, 0.8)",
  border: "1px solid rgba(72, 84, 70, 0.12)",
  boxShadow: "0 24px 80px rgba(55, 64, 50, 0.12)",
  maxWidth: "560px"
};

const signinCopyStyle: CSSProperties = {
  display: "grid",
  gap: "10px"
};

const smallLabelStyle: CSSProperties = {
  margin: 0,
  color: "#556353",
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.06em",
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
  color: "#364336"
};

const googleButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  width: "fit-content",
  padding: "14px 20px",
  borderRadius: "999px",
  border: "1px solid rgba(60, 64, 67, 0.16)",
  background: "#fff",
  color: "#1f1f1f",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 700,
  boxShadow: "0 10px 30px rgba(31, 45, 31, 0.12)"
};

const footnoteStyle: CSSProperties = {
  margin: 0,
  color: "#556353",
  fontSize: "14px",
  lineHeight: 1.5
};

const workspaceLayoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 320px) minmax(0, 1fr)",
  gap: "20px",
  alignItems: "start"
};

const sidebarStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
  padding: "20px",
  borderRadius: "26px",
  background: "rgba(255, 255, 255, 0.82)",
  border: "1px solid rgba(72, 84, 70, 0.12)",
  boxShadow: "0 24px 80px rgba(55, 64, 50, 0.12)",
  position: "sticky",
  top: "20px"
};

const sidebarHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px"
};

const sidebarTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "24px",
  lineHeight: 1.1
};

const sidebarCloseButtonStyle: CSSProperties = {
  border: "none",
  background: "#edf2eb",
  color: "#243024",
  borderRadius: "999px",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 700
};

const sidebarNavStyle: CSSProperties = {
  display: "grid",
  gap: "10px"
};

function sidebarNavButtonStyle(active: boolean): CSSProperties {
  return {
    width: "100%",
    display: "grid",
    gap: "4px",
    justifyItems: "start",
    textAlign: "left",
    padding: "14px",
    borderRadius: "18px",
    border: active ? "1px solid rgba(36, 48, 36, 0.28)" : "1px solid rgba(72, 84, 70, 0.12)",
    background: active ? "#f0f5ea" : "rgba(248, 249, 244, 0.9)",
    color: "#243024",
    cursor: "pointer"
  };
}

const sidebarNavButtonLabelStyle: CSSProperties = {
  fontWeight: 800,
  fontSize: "15px"
};

const sidebarNavButtonCopyStyle: CSSProperties = {
  fontSize: "13px",
  color: "#5b6959",
  lineHeight: 1.4
};

const sidebarCountPillStyle: CSSProperties = {
  marginTop: "4px",
  padding: "5px 10px",
  borderRadius: "999px",
  background: "#dfe8d7",
  color: "#233023",
  fontWeight: 700,
  fontSize: "12px"
};

const sidebarSummaryCardStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "16px",
  borderRadius: "18px",
  background: "rgba(241, 244, 237, 0.9)",
  border: "1px solid rgba(72, 84, 70, 0.12)"
};

const sidebarSummaryTextStyle: CSSProperties = {
  margin: 0,
  color: "#304030",
  lineHeight: 1.5
};

const sidebarListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: "18px",
  display: "grid",
  gap: "8px",
  color: "#384738",
  lineHeight: 1.5
};

const workspaceMainStyle: CSSProperties = {
  display: "grid",
  gap: "18px"
};

const surfaceStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
  padding: "22px",
  borderRadius: "26px",
  background: "rgba(255, 255, 255, 0.78)",
  border: "1px solid rgba(72, 84, 70, 0.12)",
  boxShadow: "0 24px 80px rgba(55, 64, 50, 0.12)"
};

const surfaceHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px"
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
  lineHeight: 1.15
};

const pillStyle: CSSProperties = {
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#edf2eb",
  color: "#253125",
  fontSize: "12px",
  fontWeight: 700,
  whiteSpace: "nowrap"
};

const listToolbarStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px"
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
  borderRadius: "14px",
  border: "1px solid rgba(72, 84, 70, 0.18)",
  font: "inherit",
  background: "#fff"
};

const studentListStyle: CSSProperties = {
  display: "grid",
  gap: "12px"
};

const studentRowButtonStyle = (selected: boolean): CSSProperties => ({
  display: "grid",
  gap: "10px",
  padding: "16px",
  borderRadius: "18px",
  border: selected ? "1px solid rgba(33, 48, 33, 0.3)" : "1px solid rgba(72, 84, 70, 0.1)",
  background: selected ? "#f0f5ea" : "rgba(248, 249, 244, 0.92)",
  cursor: "pointer",
  textAlign: "left"
});

const studentRowHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  alignItems: "flex-start"
};

const studentNameStyle: CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 800
};

const studentMetaStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#5b6959",
  fontSize: "14px"
};

const studentRowCopyStyle: CSSProperties = {
  color: "#334133",
  lineHeight: 1.4
};

function studentBadgeStyle(active: boolean): CSSProperties {
  return {
    ...pillStyle,
    background: active ? "#eaf4dd" : "#f4ecdf",
    color: active ? "#324732" : "#5a5244"
  };
}

const summaryStripStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "18px",
  borderRadius: "20px",
  background: "linear-gradient(180deg, rgba(240, 245, 234, 0.92), rgba(249, 250, 245, 0.96))",
  border: "1px solid rgba(72, 84, 70, 0.1)"
};

const summaryNameStyle: CSSProperties = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 800,
  lineHeight: 1.1
};

const summaryMetaStyle: CSSProperties = {
  marginTop: "6px",
  color: "#556353",
  lineHeight: 1.5
};

const summaryPillRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px"
};

const summaryPillStyle: CSSProperties = {
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#e7efe0",
  color: "#253125",
  fontWeight: 700,
  fontSize: "12px"
};

const detailGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px"
};

const detailCardStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "16px",
  borderRadius: "18px",
  background: "rgba(248, 249, 244, 0.92)",
  border: "1px solid rgba(72, 84, 70, 0.1)"
};

const detailCardLabelStyle: CSSProperties = {
  color: "#566355",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 800
};

const detailDefinitionStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  margin: 0
};

const detailLabelStyle: CSSProperties = {
  margin: 0,
  color: "#5e6b5d",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontWeight: 700
};

const detailValueStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#223022",
  fontSize: "14px",
  lineHeight: 1.4
};

const stackListStyle: CSSProperties = {
  display: "grid",
  gap: "10px"
};

const listBlockStyle: CSSProperties = {
  display: "grid",
  gap: "8px"
};

const listLabelStyle: CSSProperties = {
  color: "#5e6b5d",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontWeight: 700
};

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: "18px",
  display: "grid",
  gap: "8px",
  lineHeight: 1.5
};

const noteTextStyle: CSSProperties = {
  margin: 0,
  color: "#364336",
  lineHeight: 1.5
};

const adminSectionGridStyle: CSSProperties = {
  display: "grid",
  gap: "14px"
};

const subsectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "20px",
  lineHeight: 1.15
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gap: "14px"
};

const twoColumnGridStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
};

const checkboxLabelStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  color: "#364136",
  fontWeight: 600,
  fontSize: "14px",
  paddingTop: "24px"
};

const subsectionStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "14px",
  borderRadius: "18px",
  background: "rgba(238, 242, 235, 0.75)"
};

const subsectionHeadingStyle: CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#3b4639",
  textTransform: "uppercase",
  letterSpacing: "0.05em"
};

const primaryButtonStyle: CSSProperties = {
  width: "fit-content",
  padding: "11px 16px",
  borderRadius: "999px",
  border: "none",
  background: "#1f2d1f",
  color: "#fff",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 700
};

const secondaryButtonStyle: CSSProperties = {
  width: "fit-content",
  padding: "11px 16px",
  borderRadius: "999px",
  border: "1px solid rgba(72, 84, 70, 0.18)",
  background: "#edf2eb",
  color: "#213021",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 700
};

const levelListStyle: CSSProperties = {
  display: "grid",
  gap: "14px"
};

const levelCardStyle: CSSProperties = {
  padding: "16px",
  borderRadius: "18px",
  background: "rgba(248, 249, 244, 0.9)",
  border: "1px solid rgba(72, 84, 70, 0.1)",
  display: "grid",
  gap: "14px"
};

const sectionHeadingStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px"
};

const logoutButtonStyle: CSSProperties = {
  width: "fit-content",
  padding: "11px 16px",
  borderRadius: "999px",
  border: "none",
  background: "#1f2d1f",
  color: "#fff",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 700
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

const emergencyButtonStyle: CSSProperties = {
  width: "fit-content",
  padding: "11px 16px",
  borderRadius: "999px",
  border: "1px solid rgba(72, 84, 70, 0.18)",
  background: "#edf2eb",
  color: "#213021",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 700
};

const messageStyle: CSSProperties = {
  margin: 0,
  color: "#3f523d",
  fontWeight: 600
};

const emptyStateStyle: CSSProperties = {
  margin: 0,
  color: "#586558",
  lineHeight: 1.5
};

const toggleRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px"
};

function scheduleToggleButtonStyle(active: boolean): CSSProperties {
  return {
    padding: "9px 14px",
    borderRadius: "999px",
    border: active ? "1px solid rgba(35, 49, 35, 0.3)" : "1px solid rgba(72, 84, 70, 0.16)",
    background: active ? "#233123" : "#edf2eb",
    color: active ? "#fff" : "#223022",
    cursor: "pointer",
    fontWeight: 700
  };
}

const warningStripStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: "16px",
  background: "#f8efe1",
  border: "1px solid rgba(120, 92, 54, 0.16)",
  color: "#6b4d22",
  fontWeight: 600
};

const calendarGridStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))"
};

const calendarSlotStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "16px",
  borderRadius: "18px",
  background: "rgba(248, 249, 244, 0.9)",
  border: "1px solid rgba(72, 84, 70, 0.1)"
};

const calendarTimeStyle: CSSProperties = {
  color: "#5e6b5d",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em"
};

const calendarEntryTitleStyle: CSSProperties = {
  fontSize: "16px",
  fontWeight: 800
};

const calendarEntryCopyStyle: CSSProperties = {
  color: "#364336",
  lineHeight: 1.5
};

const listViewStyle: CSSProperties = {
  display: "grid",
  gap: "10px"
};

const listRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "72px minmax(0, 1fr)",
  gap: "14px",
  alignItems: "start",
  padding: "14px",
  borderRadius: "18px",
  background: "rgba(248, 249, 244, 0.9)",
  border: "1px solid rgba(72, 84, 70, 0.1)"
};

const listRowTimeStyle: CSSProperties = {
  color: "#5e6b5d",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em"
};

const weekGridStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))"
};

const weekDayCardStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "14px",
  borderRadius: "18px",
  background: "rgba(248, 249, 244, 0.9)",
  border: "1px solid rgba(72, 84, 70, 0.1)"
};

const weekDayLabelStyle: CSSProperties = {
  color: "#5e6b5d",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 800
};

const weekDayDateStyle: CSSProperties = {
  fontSize: "16px",
  fontWeight: 800
};

const weekDayPillStyle: CSSProperties = {
  ...pillStyle,
  width: "fit-content"
};

const mobileMenuButtonStyle: CSSProperties = {
  display: "none",
  position: "sticky",
  top: "14px",
  zIndex: 20,
  width: "fit-content",
  padding: "10px 14px",
  borderRadius: "999px",
  border: "1px solid rgba(72, 84, 70, 0.18)",
  background: "rgba(255, 255, 255, 0.9)",
  color: "#223022",
  fontWeight: 700,
  cursor: "pointer"
};

const drawerBackdropStyle: CSSProperties = {
  display: "none",
  position: "fixed",
  inset: 0,
  background: "rgba(22, 27, 21, 0.35)",
  opacity: 0,
  pointerEvents: "none",
  transition: "opacity 180ms ease",
  zIndex: 18
};

