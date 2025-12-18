const apiBase = "http://localhost:3000/api";

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center text-bg-${type} border-0 show`;
  toastEl.role = "alert";
  toastEl.ariaLive = "assertive";
  toastEl.ariaAtomic = "true";
  toastEl.style.minWidth = "200px";
  toastEl.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  container.appendChild(toastEl);
  setTimeout(() => {
    toastEl.classList.remove("show");
    try {
      container.removeChild(toastEl);
    } catch (e) {}
  }, 4000);
}

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res;
}

// fetch with timeout helper
function fetchWithTimeout(url, opts = {}, timeout = 20000) {
  return Promise.race([
    fetchJSON(url, opts),
    new Promise((_, rej) =>
      setTimeout(() => rej(new Error("Request timed out")), timeout)
    ),
  ]);
}

// Preloader helpers
function showPreloader() {
  const p = document.getElementById("preloader");
  if (!p) return;
  p.classList.remove("hidden");
  p.classList.remove("fade-out");
  p.setAttribute("aria-hidden", "false");
  // record show timestamp for minimum display enforcement
  window.__preloaderShownAt = window.__preloaderShownAt || Date.now();
}

function hidePreloader() {
  const p = document.getElementById("preloader");
  if (!p) return;
  // enforce minimum visible time (3s)
  const MIN_VISIBLE = 3000;
  const shownAt = window.__preloaderShownAt || 0;
  const elapsed = Date.now() - shownAt;
  const doHide = () => {
    // fade out then hide to allow smooth transition
    p.classList.add("fade-out");
    p.setAttribute("aria-hidden", "true");
    const onEnd = () => {
      p.classList.add("hidden");
      p.removeEventListener("transitionend", onEnd);
      window.__preloaderShownAt = 0;
    };
    p.addEventListener("transitionend", onEnd);
    // safety fallback
    setTimeout(() => onEnd(), 700);
  };

  if (elapsed < MIN_VISIBLE) {
    setTimeout(doHide, MIN_VISIBLE - elapsed);
  } else {
    doHide();
  }
}

// Elements
const roomsTableBody = document.getElementById("roomsTableBody");
const studentsTableBody = document.getElementById("studentsTableBody");
const reportTableBody = document.getElementById("reportTableBody");
const totalRooms = document.getElementById("totalRooms");
const totalCapacity = document.getElementById("totalCapacity");
const totalStudents = document.getElementById("totalStudents");
const totalAllocations = document.getElementById("totalAllocations");

let rooms = [];
let students = [];
let allocations = [];
let exams = [];

// Global search input and debounce helper
const globalSearchInput = document.getElementById("globalSearch");

function debounce(fn, delay = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// Normalize index numbers: remove spaces, uppercase
function normalizeIndex(idx) {
  return String(idx || "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

const triggerRenderAll = debounce(() => {
  renderRooms();
  renderStudents();
  renderReport();
}, 150);

globalSearchInput?.addEventListener("input", triggerRenderAll);

// render exams and exam CRUD
function renderExams() {
  const el = document.getElementById("examsTableBody");
  if (!el) return;
  el.innerHTML = "";
  exams.forEach((ex) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${ex.subject}</td><td>${ex.examCode || ""}</td><td>${
      ex.duration || ""
    }</td><td>${
      ex.date ? new Date(ex.date).toLocaleDateString() : ""
    }</td><td><button class="btn btn-sm btn-outline-primary me-2" onclick="editExam('${
      ex._id
    }')">Edit</button><button class="btn btn-sm btn-outline-danger" onclick="deleteExam('${
      ex._id
    }')">Delete</button></td>`;
    el.appendChild(tr);
  });
}

const examModalEl = document.getElementById("examModal");
const examModal = examModalEl ? new bootstrap.Modal(examModalEl) : null;
document.getElementById("addExamBtn")?.addEventListener("click", () => {
  if (!examModal) return;
  document.getElementById("examForm").reset();
  document.getElementById("examId").value = "";
  examModal.show();
});
document.getElementById("examForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("examId").value;
  const body = {
    subject: document.getElementById("examSubject").value,
    examCode: document.getElementById("examCode").value,
    duration: Number(document.getElementById("examDuration").value) || 0,
    date: document.getElementById("examDateInput").value || null,
  };
  try {
    if (id)
      await fetchJSON(apiBase + "/exams/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    else
      await fetchJSON(apiBase + "/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    examModal.hide();
    showToast("Exam saved", "success");
    loadAll();
  } catch (err) {
    showToast(err.message, "danger");
  }
});
window.editExam = (id) => {
  const ex = exams.find((x) => x._id === id);
  if (!ex) return;
  document.getElementById("examId").value = ex._id;
  document.getElementById("examSubject").value = ex.subject;
  document.getElementById("examCode").value = ex.examCode || "";
  document.getElementById("examDuration").value = ex.duration || "";
  document.getElementById("examDateInput").value = ex.date
    ? new Date(ex.date).toISOString().slice(0, 10)
    : "";
  examModal.show();
};
window.deleteExam = async (id) => {
  if (!confirm("Delete exam?")) return;
  try {
    await fetchJSON(apiBase + "/exams/" + id, { method: "DELETE" });
    showToast("Exam deleted", "warning");
    loadAll();
  } catch (e) {
    showToast(e.message, "danger");
  }
};

async function loadAll() {
  showPreloader();
  const statusEl = document.getElementById("preloaderStatus");
  const barEl = document.getElementById("preloaderBar");
  const steps = [
    { name: "rooms", url: "/rooms" },
    { name: "students", url: "/students" },
    { name: "allocations", url: "/allocations" },
    { name: "exams", url: "/exams" },
  ];
  const results = {};
  let completed = 0;
  try {
    for (const step of steps) {
      try {
        if (statusEl) statusEl.textContent = `Loading ${step.name}...`;
        const res = await fetchWithTimeout(apiBase + step.url, {}, 25000);
        results[step.name] = res;
      } catch (err) {
        console.error("Failed to load", step.name, err.message);
        results[step.name] = [];
        showToast(`Failed to load ${step.name}`, "warning");
      }
      completed += 1;
      const pct = Math.round((completed / steps.length) * 100);
      if (barEl) barEl.style.width = pct + "%";
    }

    rooms = results.rooms || [];
    // normalize index numbers and ensure consistent casing
    students = (results.students || []).map((s) => ({
      ...s,
      indexNumber: normalizeIndex(s.indexNumber),
    }));
    // sort students by index number for well-arranged listing
    students.sort((a, b) =>
      (a.indexNumber || "").localeCompare(b.indexNumber || "")
    );
    allocations = results.allocations || [];
    exams = results.exams || [];

    renderRooms();
    renderStudents();
    renderReport();
    renderStats();
    renderExams();
  } catch (e) {
    console.error(e);
    showToast("Failed to load data", "danger");
  } finally {
    if (statusEl) statusEl.textContent = "Finalizing...";
    if (barEl) barEl.style.width = "100%";
    // give a short moment for UX before hiding
    setTimeout(() => hidePreloader(), 300);
  }
}

function renderStats() {
  totalRooms.textContent = rooms.length;
  totalCapacity.textContent = rooms.reduce((s, r) => s + (r.capacity || 0), 0);
  totalStudents.textContent = students.length;
  totalAllocations.textContent = allocations.length;
}

function renderRooms() {
  const q = (globalSearchInput?.value || "").toLowerCase().trim();
  const list = q
    ? rooms.filter((r) => {
        const roomNumber = String(r.roomNumber || "").toLowerCase();
        const building = String(r.building || r.location || "").toLowerCase();
        const floor = String(r.roomFloor || "").toLowerCase();
        return (
          roomNumber.includes(q) || building.includes(q) || floor.includes(q)
        );
      })
    : rooms;

  roomsTableBody.innerHTML = "";
  list.forEach((r) => {
    const tr = document.createElement("tr");
    const building = r.building || r.location || "";
    tr.innerHTML = `<td>${r.roomNumber}</td><td>${r.capacity}</td><td>${
      r.roomFloor || ""
    }</td><td>${building}</td><td><button class="btn btn-sm btn-outline-primary me-2" onclick="editRoom('${
      r._id
    }')">Edit</button><button class="btn btn-sm btn-outline-danger" onclick="deleteRoom('${
      r._id
    }')">Delete</button></td>`;
    roomsTableBody.appendChild(tr);
  });
}

function renderStudents() {
  const q = (globalSearchInput?.value || "").toLowerCase().trim();
  const list = q
    ? students.filter((s) => {
        const idx = String(s.indexNumber || "").toLowerCase();
        const name = String(s.name || "").toLowerCase();
        const course = String(
          s.course || s.programme || s.department || ""
        ).toLowerCase();
        return idx.includes(q) || name.includes(q) || course.includes(q);
      })
    : students;

  studentsTableBody.innerHTML = "";
  list.forEach((s) => {
    const tr = document.createElement("tr");
    const course = s.course || s.programme || s.department || "";
    const year = s.level || s.year || "";
    tr.innerHTML = `<td>${s.indexNumber}</td><td>${s.name}</td><td>${course}</td><td>${year}</td><td><button class="btn btn-sm btn-outline-primary me-2" onclick="editStudent('${s._id}')">Edit</button><button class="btn btn-sm btn-outline-danger" onclick="deleteStudent('${s._id}')">Delete</button></td>`;
    studentsTableBody.appendChild(tr);
  });
}

function renderReport() {
  const q = (globalSearchInput?.value || "").toLowerCase().trim();
  reportTableBody.innerHTML = "";
  allocations.forEach((a) => {
    const examDate = a.exam?.date
      ? new Date(a.exam.date).toLocaleDateString()
      : "";
    const examTime = a.exam?.date
      ? new Date(a.exam.date).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    a.students.forEach((s) => {
      const tr = document.createElement("tr");
      // Resolve student: prefer populated, then match by id against students list
      let studentData = null;
      if (s && s.student && typeof s.student === "object" && s.student.name)
        studentData = s.student;
      else {
        const sid =
          (s &&
            s.student &&
            (typeof s.student === "string" ? s.student : s.student._id)) ||
          null;
        if (sid) studentData = students.find((x) => x._id === sid) || null;
      }
      const sidText = studentData
        ? studentData.indexNumber || studentData._id || ""
        : s.student && typeof s.student === "string"
        ? s.student
        : s._id || "";
      const nameText = studentData ? studentData.name || "" : "";
      const courseText = studentData
        ? studentData.course || studentData.programme || ""
        : "";
      const roomText = a.room?.roomNumber || a.room?.name || "";

      // Apply search filter if present
      if (q) {
        const hay =
          `${sidText} ${nameText} ${courseText} ${roomText} ${examDate} ${examTime} ${
            (a.exam && (a.exam.subject || a.exam.name)) || ""
          }`.toLowerCase();
        if (!hay.includes(q)) return;
      }

      tr.innerHTML = `<td>${sidText}</td><td>${nameText}</td><td>${courseText}</td><td>${roomText}</td><td>${examDate}</td><td>${examTime}</td><td><button class="btn btn-sm btn-outline-danger" onclick="deleteAllocation('${a._id}')">Delete</button></td>`;
      reportTableBody.appendChild(tr);
    });
  });
}

// Rooms
const roomModal = new bootstrap.Modal(document.getElementById("roomModal"));
document.getElementById("addRoomBtn").addEventListener("click", () => {
  document.getElementById("roomForm").reset();
  document.getElementById("roomId").value = "";
  roomModal.show();
});
document.getElementById("roomForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("roomId").value;
  const body = {
    roomNumber: document.getElementById("roomNumber").value,
    capacity: Number(document.getElementById("capacity").value),
    roomFloor: Number(document.getElementById("floor").value) || 0,
    building: document.getElementById("building").value,
  };
  try {
    if (id)
      await fetchJSON(apiBase + "/rooms/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    else
      await fetchJSON(apiBase + "/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    roomModal.hide();
    showToast("Room saved", "success");
    loadAll();
  } catch (e) {
    showToast(e.message, "danger");
  }
});
window.editRoom = (id) => {
  const r = rooms.find((x) => x._id === id);
  if (!r) return;
  document.getElementById("roomId").value = r._id;
  document.getElementById("roomNumber").value = r.roomNumber;
  document.getElementById("capacity").value = r.capacity;
  document.getElementById("floor").value = r.roomFloor || "";
  document.getElementById("building").value = r.building || "";
  roomModal.show();
};
window.deleteRoom = async (id) => {
  if (!confirm("Delete room?")) return;
  try {
    await fetchJSON(apiBase + "/rooms/" + id, { method: "DELETE" });
    showToast("Room deleted", "warning");
    loadAll();
  } catch (e) {
    showToast(e.message, "danger");
  }
};

// Students
const studentModal = new bootstrap.Modal(
  document.getElementById("studentModal")
);
document.getElementById("addStudentBtn").addEventListener("click", () => {
  document.getElementById("studentForm").reset();
  document.getElementById("studentId").value = "";
  studentModal.show();
});
document.getElementById("studentForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("studentId").value;
  const indexVal = normalizeIndex(
    document.getElementById("studentIdInput").value || ""
  );
  const nameVal = String(
    document.getElementById("studentName").value || ""
  ).trim();
  const courseVal = String(
    document.getElementById("course").value || ""
  ).trim();
  const levelRaw = String(document.getElementById("year").value || "").trim();
  const levelVal = levelRaw === "" ? null : Number(levelRaw);

  // Client-side validation
  if (indexVal.length !== 10) {
    showToast("Index number must be exactly 10 characters", "danger");
    return;
  }
  const allowed = [100, 200, 300, 400];
  if (levelVal !== null && !allowed.includes(levelVal)) {
    showToast("Level must be one of: 100, 200, 300, 400", "danger");
    return;
  }
  if (!nameVal) {
    showToast("Student name is required", "danger");
    return;
  }

  const body = {
    indexNumber: indexVal,
    name: nameVal,
    course: courseVal,
    level: levelVal,
  };
  try {
    if (id)
      await fetchJSON(apiBase + "/students/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    else
      await fetchJSON(apiBase + "/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    studentModal.hide();
    showToast("Student saved", "success");
    loadAll();
  } catch (e) {
    showToast(e.message, "danger");
  }
});
window.editStudent = (id) => {
  const s = students.find((x) => x._id === id);
  if (!s) return;
  document.getElementById("studentId").value = s._id;
  document.getElementById("studentIdInput").value = s.indexNumber;
  document.getElementById("studentName").value = s.name;
  document.getElementById("course").value = s.course || "";
  document.getElementById("year").value = s.level || "";
  studentModal.show();
};
window.deleteStudent = async (id) => {
  if (!confirm("Delete student?")) return;
  try {
    await fetchJSON(apiBase + "/students/" + id, { method: "DELETE" });
    showToast("Student deleted", "warning");
    loadAll();
  } catch (e) {
    showToast(e.message, "danger");
  }
};

// Imports
document.getElementById("studentXlsx").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await fetch(apiBase + "/students/upload", {
      method: "POST",
      body: fd,
    });
    if (!res.ok) throw new Error(await res.text());
    showToast("Import successful", "success");
    loadAll();
  } catch (e) {
    showToast(e.message, "danger");
  }
});

// Allocation
document
  .getElementById("autoAllocateBtn")
  .addEventListener("click", async () => {
    if (!confirm("Auto-allocate students across rooms?")) return;
    showPreloader();
    try {
      const date =
        document.getElementById("examDate").value ||
        new Date().toISOString().slice(0, 10);
      const time = document.getElementById("examTime").value || "";
      const exam = await fetchJSON(apiBase + "/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `Exam ${date} ${time}`,
          examCode: `AUTO-${Date.now()}`,
          duration: 0,
          date,
        }),
      });
      let remaining = [...students];
      for (const room of rooms) {
        if (remaining.length === 0) break;
        const take = remaining.splice(0, room.capacity || 0).map((s) => s._id);
        if (take.length === 0) continue;
        await fetchJSON(apiBase + "/allocations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exam: exam._id,
            room: room._id,
            students: take,
          }),
        });
      }
      showToast("Allocation complete", "success");
      loadAll();
    } catch (e) {
      showToast(e.message, "danger");
    } finally {
      hidePreloader();
    }
  });

// Report actions
window.deleteAllocation = async (id) => {
  if (!confirm("Delete allocation?")) return;
  try {
    await fetchJSON(apiBase + "/allocations/" + id, { method: "DELETE" });
    showToast("Allocation deleted", "warning");
    loadAll();
  } catch (e) {
    showToast(e.message, "danger");
  }
};
document
  .getElementById("exportCsvBtn")
  .addEventListener(
    "click",
    () => (window.location = apiBase + "/allocations/export/csv")
  );
document
  .getElementById("exportPdfBtn")
  .addEventListener(
    "click",
    () => (window.location = apiBase + "/allocations/export/pdf")
  );

document.getElementById("applyFilterBtn").addEventListener("click", () => {
  const fd = document.getElementById("filterDate").value;
  const ft = document.getElementById("filterTime").value;
  if (!fd && !ft) {
    showToast("Provide date/time to filter", "info");
    return;
  } // client-side filter
  [...reportTableBody.querySelectorAll("tr")].forEach((tr) => {
    const cells = tr.querySelectorAll("td");
    const date = cells[4].textContent.trim();
    const time = cells[5].textContent.trim();
    tr.style.display =
      (fd ? date === new Date(fd).toLocaleDateString() : true) &&
      (ft ? time === ft : false ? true : time === ft)
        ? ""
        : "none";
  });
});

document
  .getElementById("resetFilterBtn")
  .addEventListener("click", () => loadAll());

// Init
loadAll();
