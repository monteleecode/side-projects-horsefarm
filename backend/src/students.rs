use crate::auth::{current_user, AppState, StaffRole, StaffUser};
use axum::{
  extract::{Extension, Path},
  http::StatusCode,
  response::{IntoResponse, Response},
  routing::{get, patch, post},
  Json, Router,
};
use chrono::{Datelike, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use std::{
  collections::HashMap,
  sync::{
    atomic::{AtomicU64, Ordering},
    Arc, RwLock,
  },
  time::{Duration, SystemTime, UNIX_EPOCH},
};

static STUDENT_COUNTER: AtomicU64 = AtomicU64::new(1);

pub(crate) fn student_router() -> Router {
  Router::new()
    .route("/students", get(list_students).post(create_student))
    .route("/students/:student_id", get(get_student).patch(update_student))
    .route(
      "/students/:student_id/guardians",
      post(add_guardian_to_student),
    )
    .route(
      "/students/:student_id/emergency-contacts",
      post(add_emergency_contact_to_student),
    )
    .route(
      "/students/:student_id/riding-level",
      patch(update_student_riding_level),
    )
    .route(
      "/students/:student_id/riding-level-opinions",
      post(create_riding_level_opinion),
    )
    .route("/riding-levels", get(list_riding_levels))
    .route(
      "/riding-levels/:riding_level_id",
      patch(update_riding_level_definition),
    )
}

#[derive(Clone, Debug)]
pub(crate) struct StudentStore {
  state: Arc<RwLock<StudentState>>,
}

#[derive(Debug)]
struct StudentState {
  students: HashMap<String, StudentRecord>,
  riding_levels: HashMap<String, RidingLevelDefinition>,
}

impl StudentStore {
  pub(crate) fn seeded() -> Self {
    let riding_levels = vec![
      RidingLevelDefinition {
        id: "level-green".to_string(),
        sort_order: 1,
        display_name: "Green".to_string(),
        description: "Beginning rider who needs close support.".to_string(),
      },
      RidingLevelDefinition {
        id: "level-solid".to_string(),
        sort_order: 2,
        display_name: "Solid".to_string(),
        description: "Independent rider with normal lesson pacing.".to_string(),
      },
      RidingLevelDefinition {
        id: "level-advanced".to_string(),
        sort_order: 3,
        display_name: "Advanced".to_string(),
        description: "Confident rider ready for more complex work.".to_string(),
      },
    ];

    let student_one = StudentRecord::new(
      "student-sarah-holt",
      "Sarah",
      "Holt",
      parse_date("2010-01-15"),
      true,
      "staff-mkt-monte",
      "level-green",
      Some("Needs reminder about helmet fit.".to_string()),
      vec![ContactRecord {
        id: generate_entity_id("guardian"),
        name: "Dana Holt".to_string(),
        relationship: Some("guardian".to_string()),
        phone: "555-0101".to_string(),
        email: Some("dana.holt@example.com".to_string()),
      }],
      vec![ContactRecord {
        id: generate_entity_id("emergency-contact"),
        name: "Dana Holt".to_string(),
        relationship: Some("guardian".to_string()),
        phone: "555-0101".to_string(),
        email: Some("dana.holt@example.com".to_string()),
      }],
    );

    let student_two = StudentRecord::new(
      "student-elliot-page",
      "Elliot",
      "Page",
      parse_date("1996-08-20"),
      true,
      "staff-lee-wells",
      "level-solid",
      Some("Prefers afternoon lessons.".to_string()),
      vec![],
      vec![ContactRecord {
        id: generate_entity_id("emergency-contact"),
        name: "Casey Page".to_string(),
        relationship: Some("emergency contact".to_string()),
        phone: "555-0102".to_string(),
        email: Some("casey.page@example.com".to_string()),
      }],
    );

    let mut riding_level_map = HashMap::new();
    for level in riding_levels {
      riding_level_map.insert(level.id.clone(), level);
    }

    let mut students = HashMap::new();
    students.insert(student_one.id.clone(), student_one);
    students.insert(student_two.id.clone(), student_two);

    Self {
      state: Arc::new(RwLock::new(StudentState {
        students,
        riding_levels: riding_level_map,
      })),
    }
  }

  fn list_students(&self) -> Vec<StudentRecord> {
    let state = self.state.read().expect("student state should not be poisoned");
    let mut students = state.students.values().cloned().collect::<Vec<_>>();
    students.sort_by(|left, right| {
      (left.last_name.clone(), left.first_name.clone()).cmp(&(
        right.last_name.clone(),
        right.first_name.clone(),
      ))
    });
    students
  }

  fn get_student(&self, student_id: &str) -> Option<StudentRecord> {
    self
      .state
      .read()
      .ok()?
      .students
      .get(student_id)
      .cloned()
  }

  fn create_student(&self, student: StudentRecord) -> StudentRecord {
    let mut state = self.state.write().expect("student state should not be poisoned");
    state.students.insert(student.id.clone(), student.clone());
    student
  }

  fn update_student(&self, student: StudentRecord) -> StudentRecord {
    let mut state = self.state.write().expect("student state should not be poisoned");
    state.students.insert(student.id.clone(), student.clone());
    student
  }

  fn add_guardian(&self, student_id: &str, guardian: ContactRecord) -> Option<StudentRecord> {
    let mut state = self.state.write().ok()?;
    let student = state.students.get_mut(student_id)?;
    student.guardians.push(guardian);
    Some(student.clone())
  }

  fn add_emergency_contact(
    &self,
    student_id: &str,
    contact: ContactRecord,
  ) -> Option<StudentRecord> {
    let mut state = self.state.write().ok()?;
    let student = state.students.get_mut(student_id)?;
    student.emergency_contacts.push(contact);
    Some(student.clone())
  }

  fn add_riding_level_opinion(
    &self,
    student_id: &str,
    opinion: RidingLevelOpinion,
  ) -> Option<StudentRecord> {
    let mut state = self.state.write().ok()?;
    let student = state.students.get_mut(student_id)?;
    student.opinions.push(opinion);
    Some(student.clone())
  }

  fn list_riding_levels(&self) -> Vec<RidingLevelDefinition> {
    let state = self.state.read().expect("student state should not be poisoned");
    let mut levels = state.riding_levels.values().cloned().collect::<Vec<_>>();
    levels.sort_by_key(|level| level.sort_order);
    levels
  }

  fn get_riding_level(&self, riding_level_id: &str) -> Option<RidingLevelDefinition> {
    self
      .state
      .read()
      .ok()?
      .riding_levels
      .get(riding_level_id)
      .cloned()
  }

  fn update_riding_level_definition(
    &self,
    riding_level_id: &str,
    display_name: Option<String>,
    description: Option<String>,
  ) -> Option<RidingLevelDefinition> {
    let mut state = self.state.write().ok()?;
    let level = state.riding_levels.get_mut(riding_level_id)?;
    if let Some(display_name) = display_name {
      level.display_name = display_name;
    }
    if let Some(description) = description {
      level.description = description;
    }
    Some(level.clone())
  }
}

#[derive(Clone, Debug)]
struct StudentRecord {
  id: String,
  first_name: String,
  last_name: String,
  date_of_birth: NaiveDate,
  active: bool,
  main_instructor_id: String,
  riding_level_id: String,
  notes: Option<String>,
  guardians: Vec<ContactRecord>,
  emergency_contacts: Vec<ContactRecord>,
  opinions: Vec<RidingLevelOpinion>,
}

impl StudentRecord {
  fn new(
    id: &str,
    first_name: &str,
    last_name: &str,
    date_of_birth: NaiveDate,
    active: bool,
    main_instructor_id: &str,
    riding_level_id: &str,
    notes: Option<String>,
    guardians: Vec<ContactRecord>,
    emergency_contacts: Vec<ContactRecord>,
  ) -> Self {
    Self {
      id: id.to_string(),
      first_name: first_name.to_string(),
      last_name: last_name.to_string(),
      date_of_birth,
      active,
      main_instructor_id: main_instructor_id.to_string(),
      riding_level_id: riding_level_id.to_string(),
      notes,
      guardians,
      emergency_contacts,
      opinions: vec![],
    }
  }
}

#[derive(Clone, Debug, Serialize)]
struct StaffReference {
  id: String,
  display_name: String,
}

#[derive(Clone, Debug, Serialize)]
struct RidingLevelReference {
  id: String,
  display_name: String,
  description: String,
  sort_order: i32,
}

#[derive(Clone, Debug, Serialize)]
struct ContactResponse {
  id: String,
  name: String,
  relationship: Option<String>,
  phone: String,
  email: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
struct RidingLevelOpinionResponse {
  id: String,
  submitted_by: StaffReference,
  recommended_riding_level: RidingLevelReference,
  note: Option<String>,
  enters_review: bool,
  created_at: String,
}

#[derive(Clone, Debug, Serialize)]
struct StudentResponse {
  id: String,
  first_name: String,
  last_name: String,
  full_name: String,
  active: bool,
  age_years: i32,
  is_minor: bool,
  date_of_birth: Option<String>,
  main_instructor: StaffReference,
  riding_level: RidingLevelReference,
  notes: Option<String>,
  guardians: Vec<ContactResponse>,
  emergency_contacts: Vec<ContactResponse>,
  opinions: Vec<RidingLevelOpinionResponse>,
}

#[derive(Clone, Debug, Serialize)]
struct StudentListResponse {
  students: Vec<StudentResponse>,
}

#[derive(Clone, Debug, Serialize)]
struct RidingLevelListResponse {
  riding_levels: Vec<RidingLevelReference>,
}

#[derive(Deserialize)]
struct CreateStudentRequest {
  first_name: String,
  last_name: String,
  date_of_birth: String,
  active: bool,
  main_instructor_id: String,
  riding_level_id: String,
  notes: Option<String>,
  guardians: Vec<ContactInput>,
  emergency_contacts: Vec<ContactInput>,
}

#[derive(Deserialize)]
struct UpdateStudentRequest {
  first_name: Option<String>,
  last_name: Option<String>,
  date_of_birth: Option<String>,
  active: Option<bool>,
  main_instructor_id: Option<String>,
  riding_level_id: Option<String>,
  notes: Option<Option<String>>,
}

#[derive(Deserialize)]
struct ContactInput {
  name: String,
  relationship: Option<String>,
  phone: String,
  email: Option<String>,
}

#[derive(Deserialize)]
struct RidingLevelOpinionRequest {
  recommended_riding_level_id: String,
  note: Option<String>,
}

#[derive(Deserialize)]
struct UpdateRidingLevelRequest {
  display_name: Option<String>,
  description: Option<String>,
}

async fn list_students(
  Extension(state): Extension<Arc<AppState>>,
  headers: axum::http::HeaderMap,
) -> Response {
  let current = match current_user(&state, &headers).await {
    Ok(user) => user,
    Err(response) => return response,
  };

  Json(StudentListResponse {
    students: state
      .students
      .list_students()
      .into_iter()
      .map(|student| build_student_response(&state, &student, &current))
      .collect(),
  })
  .into_response()
}

async fn get_student(
  Extension(state): Extension<Arc<AppState>>,
  Path(student_id): Path<String>,
  headers: axum::http::HeaderMap,
) -> Response {
  let current = match current_user(&state, &headers).await {
    Ok(user) => user,
    Err(response) => return response,
  };

  match state.students.get_student(&student_id) {
    Some(student) => Json(build_student_response(&state, &student, &current)).into_response(),
    None => not_found("student_not_found"),
  }
}

async fn create_student(
  Extension(state): Extension<Arc<AppState>>,
  headers: axum::http::HeaderMap,
  Json(payload): Json<CreateStudentRequest>,
) -> Response {
  let current = match current_user(&state, &headers).await {
    Ok(user) => user,
    Err(response) => return response,
  };

  if current.role != StaffRole::Admin {
    return forbidden("admin_only");
  }

  let date_of_birth = match parse_date_request(&payload.date_of_birth) {
    Some(date) => date,
    None => return validation_error("invalid_date_of_birth"),
  };

  let main_instructor = match resolve_main_instructor(&state, &payload.main_instructor_id) {
    Some(user) => user,
    None => return validation_error("invalid_main_instructor"),
  };

  let riding_level = match state.students.get_riding_level(&payload.riding_level_id) {
    Some(level) => level,
    None => return validation_error("invalid_riding_level"),
  };

  let guardians = build_contacts(payload.guardians);
  let emergency_contacts = build_contacts(payload.emergency_contacts);

  let student = StudentRecord::new(
    &generate_entity_id("student"),
    &payload.first_name,
    &payload.last_name,
    date_of_birth,
    payload.active,
    &main_instructor.id,
    &riding_level.id,
    payload.notes,
    guardians,
    emergency_contacts,
  );

  if let Err(error) = validate_student_invariants(&student) {
    return validation_error(error);
  }

  let created = state.students.create_student(student);
  Json(build_student_response(&state, &created, &current)).into_response()
}

async fn update_student(
  Extension(state): Extension<Arc<AppState>>,
  Path(student_id): Path<String>,
  headers: axum::http::HeaderMap,
  Json(payload): Json<UpdateStudentRequest>,
) -> Response {
  let current = match current_user(&state, &headers).await {
    Ok(user) => user,
    Err(response) => return response,
  };

  if current.role != StaffRole::Admin {
    return forbidden("admin_only");
  }

  let mut student = match state.students.get_student(&student_id) {
    Some(student) => student,
    None => return not_found("student_not_found"),
  };

  if let Some(first_name) = payload.first_name {
    student.first_name = first_name;
  }
  if let Some(last_name) = payload.last_name {
    student.last_name = last_name;
  }
  if let Some(date_of_birth) = payload.date_of_birth {
    student.date_of_birth = match parse_date_request(&date_of_birth) {
      Some(date) => date,
      None => return validation_error("invalid_date_of_birth"),
    };
  }
  if let Some(active) = payload.active {
    student.active = active;
  }
  if let Some(main_instructor_id) = payload.main_instructor_id {
    let main_instructor = match resolve_main_instructor(&state, &main_instructor_id) {
      Some(user) => user,
      None => return validation_error("invalid_main_instructor"),
    };
    student.main_instructor_id = main_instructor.id;
  }
  if let Some(riding_level_id) = payload.riding_level_id {
    if state.students.get_riding_level(&riding_level_id).is_none() {
      return validation_error("invalid_riding_level");
    }
    student.riding_level_id = riding_level_id;
  }
  if let Some(notes) = payload.notes {
    student.notes = notes;
  }

  if let Err(error) = validate_student_invariants(&student) {
    return validation_error(error);
  }

  let updated = state.students.update_student(student);
  Json(build_student_response(&state, &updated, &current)).into_response()
}

async fn add_guardian_to_student(
  Extension(state): Extension<Arc<AppState>>,
  Path(student_id): Path<String>,
  headers: axum::http::HeaderMap,
  Json(payload): Json<ContactInput>,
) -> Response {
  let current = match current_user(&state, &headers).await {
    Ok(user) => user,
    Err(response) => return response,
  };

  if current.role != StaffRole::Admin {
    return forbidden("admin_only");
  }

  let contact = ContactRecord {
    id: generate_entity_id("guardian"),
    name: payload.name,
    relationship: payload.relationship,
    phone: payload.phone,
    email: payload.email,
  };

  match state.students.add_guardian(&student_id, contact) {
    Some(student) => {
      if let Err(error) = validate_student_invariants(&student) {
        return validation_error(error);
      }
      Json(build_student_response(&state, &student, &current)).into_response()
    }
    None => not_found("student_not_found"),
  }
}

async fn add_emergency_contact_to_student(
  Extension(state): Extension<Arc<AppState>>,
  Path(student_id): Path<String>,
  headers: axum::http::HeaderMap,
  Json(payload): Json<ContactInput>,
) -> Response {
  let current = match current_user(&state, &headers).await {
    Ok(user) => user,
    Err(response) => return response,
  };

  if current.role != StaffRole::Admin {
    return forbidden("admin_only");
  }

  let contact = ContactRecord {
    id: generate_entity_id("emergency-contact"),
    name: payload.name,
    relationship: payload.relationship,
    phone: payload.phone,
    email: payload.email,
  };

  match state.students.add_emergency_contact(&student_id, contact) {
    Some(student) => {
      if let Err(error) = validate_student_invariants(&student) {
        return validation_error(error);
      }
      Json(build_student_response(&state, &student, &current)).into_response()
    }
    None => not_found("student_not_found"),
  }
}

async fn update_student_riding_level(
  Extension(state): Extension<Arc<AppState>>,
  Path(student_id): Path<String>,
  headers: axum::http::HeaderMap,
  Json(payload): Json<RidingLevelOpinionRequest>,
) -> Response {
  let current = match current_user(&state, &headers).await {
    Ok(user) => user,
    Err(response) => return response,
  };

  let mut student = match state.students.get_student(&student_id) {
    Some(student) => student,
    None => return not_found("student_not_found"),
  };

  if current.role != StaffRole::Admin && current.id != student.main_instructor_id {
    return forbidden("main_instructor_or_admin_only");
  }

  let riding_level = match state.students.get_riding_level(&payload.recommended_riding_level_id) {
    Some(level) => level,
    None => return validation_error("invalid_riding_level"),
  };

  student.riding_level_id = riding_level.id.clone();
  if let Err(error) = validate_student_invariants(&student) {
    return validation_error(error);
  }

  let updated = state.students.update_student(student);
  Json(build_student_response(&state, &updated, &current)).into_response()
}

async fn create_riding_level_opinion(
  Extension(state): Extension<Arc<AppState>>,
  Path(student_id): Path<String>,
  headers: axum::http::HeaderMap,
  Json(payload): Json<RidingLevelOpinionRequest>,
) -> Response {
  let current = match current_user(&state, &headers).await {
    Ok(user) => user,
    Err(response) => return response,
  };

  if current.role != StaffRole::Instructor {
    return forbidden("instructor_only");
  }

  let student = match state.students.get_student(&student_id) {
    Some(student) => student,
    None => return not_found("student_not_found"),
  };

  if current.id == student.main_instructor_id {
    return forbidden("main_instructor_should_update_directly");
  }

  let recommended_riding_level = match state.students.get_riding_level(&payload.recommended_riding_level_id) {
    Some(level) => level,
    None => return validation_error("invalid_riding_level"),
  };

  let opinion = RidingLevelOpinion {
    id: generate_entity_id("opinion"),
    submitted_by_id: current.id.clone(),
    recommended_riding_level_id: recommended_riding_level.id.clone(),
    note: payload.note,
    enters_review: recommended_riding_level.id != student.riding_level_id,
    created_at: now_rfc3339(),
  };

  match state.students.add_riding_level_opinion(&student_id, opinion) {
    Some(updated) => Json(build_student_response(&state, &updated, &current)).into_response(),
    None => not_found("student_not_found"),
  }
}

async fn list_riding_levels(
  Extension(state): Extension<Arc<AppState>>,
  headers: axum::http::HeaderMap,
) -> Response {
  if current_user(&state, &headers).await.is_err() {
    return unauthorized("missing_session");
  }

  Json(RidingLevelListResponse {
    riding_levels: state
      .students
      .list_riding_levels()
      .into_iter()
      .map(|level| build_riding_level_reference(&level))
      .collect(),
  })
  .into_response()
}

async fn update_riding_level_definition(
  Extension(state): Extension<Arc<AppState>>,
  Path(riding_level_id): Path<String>,
  headers: axum::http::HeaderMap,
  Json(payload): Json<UpdateRidingLevelRequest>,
) -> Response {
  let current = match current_user(&state, &headers).await {
    Ok(user) => user,
    Err(response) => return response,
  };

  if current.role != StaffRole::Admin {
    return forbidden("admin_only");
  }

  match state.students.update_riding_level_definition(
    &riding_level_id,
    payload.display_name,
    payload.description,
  ) {
    Some(level) => Json(build_riding_level_reference(&level)).into_response(),
    None => not_found("riding_level_not_found"),
  }
}

fn build_student_response(
  state: &Arc<AppState>,
  student: &StudentRecord,
  current: &StaffUser,
) -> StudentResponse {
  let main_instructor = resolve_staff_reference(state, &student.main_instructor_id);
  let riding_level = state
    .students
    .get_riding_level(&student.riding_level_id)
    .map(|level| build_riding_level_reference(&level))
    .unwrap_or_else(|| RidingLevelReference {
      id: student.riding_level_id.clone(),
      display_name: "Unknown".to_string(),
      description: String::new(),
      sort_order: 0,
    });

  StudentResponse {
    id: student.id.clone(),
    first_name: student.first_name.clone(),
    last_name: student.last_name.clone(),
    full_name: format!("{} {}", student.first_name, student.last_name),
    active: student.active,
    age_years: student_age_years(student.date_of_birth),
    is_minor: is_minor(student.date_of_birth),
    date_of_birth: if current.role == StaffRole::Admin {
      Some(student.date_of_birth.format("%Y-%m-%d").to_string())
    } else {
      None
    },
    main_instructor,
    riding_level,
    notes: student.notes.clone(),
    guardians: student
      .guardians
      .iter()
      .cloned()
      .map(|contact| build_contact_response(&contact))
      .collect(),
    emergency_contacts: student
      .emergency_contacts
      .iter()
      .cloned()
      .map(|contact| build_contact_response(&contact))
      .collect(),
    opinions: student
      .opinions
      .iter()
      .cloned()
      .filter_map(|opinion| build_opinion_response(state, opinion))
      .collect(),
  }
}

fn build_contact_response(contact: &ContactRecord) -> ContactResponse {
  ContactResponse {
    id: contact.id.clone(),
    name: contact.name.clone(),
    relationship: contact.relationship.clone(),
    phone: contact.phone.clone(),
    email: contact.email.clone(),
  }
}

fn build_opinion_response(
  state: &Arc<AppState>,
  opinion: RidingLevelOpinion,
) -> Option<RidingLevelOpinionResponse> {
  let submitted_by = state.staff_directory.get_by_id(&opinion.submitted_by_id)?;
  let recommended_riding_level = state.students.get_riding_level(&opinion.recommended_riding_level_id)?;

  Some(RidingLevelOpinionResponse {
    id: opinion.id,
    submitted_by: StaffReference {
      id: submitted_by.id,
      display_name: submitted_by.display_name,
    },
    recommended_riding_level: build_riding_level_reference(&recommended_riding_level),
    note: opinion.note,
    enters_review: opinion.enters_review,
    created_at: opinion.created_at,
  })
}

fn build_riding_level_reference(level: &RidingLevelDefinition) -> RidingLevelReference {
  RidingLevelReference {
    id: level.id.clone(),
    display_name: level.display_name.clone(),
    description: level.description.clone(),
    sort_order: level.sort_order,
  }
}

fn resolve_staff_reference(state: &Arc<AppState>, staff_id: &str) -> StaffReference {
  state
    .staff_directory
    .get_by_id(staff_id)
    .map(|user| StaffReference {
      id: user.id,
      display_name: user.display_name,
    })
    .unwrap_or_else(|| StaffReference {
      id: staff_id.to_string(),
      display_name: "Unknown staff".to_string(),
    })
}

fn resolve_main_instructor(state: &Arc<AppState>, instructor_id: &str) -> Option<StaffUser> {
  let instructor = state.staff_directory.get_by_id(instructor_id)?;
  match instructor.role {
    StaffRole::Instructor => Some(instructor),
    StaffRole::Admin => None,
  }
}

fn validate_student_invariants(student: &StudentRecord) -> Result<(), &'static str> {
  if student.active && student.main_instructor_id.trim().is_empty() {
    return Err("active_students_require_main_instructor");
  }

  if student.emergency_contacts.is_empty() {
    return Err("students_require_emergency_contact");
  }

  if is_minor(student.date_of_birth) && student.guardians.is_empty() {
    return Err("minor_students_require_guardian");
  }

  Ok(())
}

fn build_contacts(inputs: Vec<ContactInput>) -> Vec<ContactRecord> {
  inputs
    .into_iter()
    .map(|input| ContactRecord {
      id: generate_entity_id("contact"),
      name: input.name,
      relationship: input.relationship,
      phone: input.phone,
      email: input.email,
    })
    .collect()
}

#[derive(Clone, Debug)]
struct ContactRecord {
  id: String,
  name: String,
  relationship: Option<String>,
  phone: String,
  email: Option<String>,
}

#[derive(Clone, Debug)]
struct RidingLevelDefinition {
  id: String,
  sort_order: i32,
  display_name: String,
  description: String,
}

#[derive(Clone, Debug)]
struct RidingLevelOpinion {
  id: String,
  submitted_by_id: String,
  recommended_riding_level_id: String,
  note: Option<String>,
  enters_review: bool,
  created_at: String,
}

fn parse_date(value: &str) -> NaiveDate {
  NaiveDate::parse_from_str(value, "%Y-%m-%d").expect("seed dates must be valid")
}

fn parse_date_request(value: &str) -> Option<NaiveDate> {
  NaiveDate::parse_from_str(value, "%Y-%m-%d").ok()
}

fn is_minor(date_of_birth: NaiveDate) -> bool {
  student_age_years(date_of_birth) < 18
}

fn student_age_years(date_of_birth: NaiveDate) -> i32 {
  let today = Utc::now().date_naive();
  let mut age = today.year() - date_of_birth.year();
  if (today.month(), today.day()) < (date_of_birth.month(), date_of_birth.day()) {
    age -= 1;
  }
  age
}

fn now_rfc3339() -> String {
  chrono::DateTime::<Utc>::from(SystemTime::now())
    .to_rfc3339_opts(chrono::SecondsFormat::Secs, true)
}

fn generate_entity_id(prefix: &str) -> String {
  let counter = STUDENT_COUNTER.fetch_add(1, Ordering::Relaxed);
  let nanos = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_else(|_| Duration::from_secs(0))
    .as_nanos();
  format!("{prefix}-{nanos:x}{counter:x}")
}

fn validation_error(error: &'static str) -> Response {
  (
    StatusCode::UNPROCESSABLE_ENTITY,
    Json(ErrorResponse { error }),
  )
    .into_response()
}

fn forbidden(error: &'static str) -> Response {
  (StatusCode::FORBIDDEN, Json(ErrorResponse { error })).into_response()
}

fn not_found(error: &'static str) -> Response {
  (StatusCode::NOT_FOUND, Json(ErrorResponse { error })).into_response()
}

fn unauthorized(error: &'static str) -> Response {
  (StatusCode::UNAUTHORIZED, Json(ErrorResponse { error })).into_response()
}

#[derive(Serialize)]
struct ErrorResponse {
  error: &'static str,
}
