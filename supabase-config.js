const SUPABASE_URL = "https://dysqprtbnhnyufqcatji.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5c3FwcnRibmhueXVmcWNhdGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU3MDg2OTgsImV4cCI6MjExMTI4NDY5OH0.T2vtG7o_6WgVCW_tDNPJ90yoWffMthVx9kRUN0FY3_g";

const supabaseClient =
  window.supabase &&
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("https://dysqprtbnhnyufqcatji.supabase.co") &&
  !SUPABASE_ANON_KEY.includes("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5c3FwcnRibmhueXVmcWNhdGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU3MDg2OTgsImV4cCI6MjExMTI4NDY5OH0.T2vtG7o_6WgVCW_tDNPJ90yoWffMthVx9kRUN0FY3_g")
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

function isSupabaseReady() {
  return Boolean(supabaseClient);
}

// 1. Pull latest data from Supabase into localStorage
async function syncAllFromSupabase() {
  if (!isSupabaseReady()) return false;

  try {
    const [stRes, extRes, mealRes, bazarRes, feeRes, logRes, setRes] =
      await Promise.all([
        supabaseClient.from("hall_students").select("*"),
        supabaseClient.from("external_meal_students").select("*"),
        supabaseClient.from("meal_records").select("*"),
        supabaseClient
          .from("meal_bazar_costs")
          .select("*")
          .order("id", { ascending: false }),
        supabaseClient.from("hall_fee_records").select("*"),
        supabaseClient.from("daily_meal_log").select("*"),
        supabaseClient.from("hall_settings").select("*").eq("id", "main").maybeSingle()
      ]);

    if (stRes.error) throw stRes.error;
    if (extRes.error) throw extRes.error;
    if (mealRes.error) throw mealRes.error;
    if (bazarRes.error) throw bazarRes.error;
    if (feeRes.error) throw feeRes.error;
    if (logRes.error) throw logRes.error;
    if (setRes.error) throw setRes.error;

    if (Array.isArray(stRes.data)) {
      const mappedStudents = stRes.data.map((r) => ({
        name: r.name,
        id: r.student_id,
        dept: r.dept,
        phone: r.phone,
        blood: r.blood,
        district: r.district,
        floor: Number(r.floor),
        room: Number(r.room),
        bed: r.bed,
        image: r.image_url || ""
      }));
      localStorage.setItem("hallStudents", JSON.stringify(mappedStudents));
    }

    if (Array.isArray(extRes.data)) {
      const mappedExt = extRes.data.map((r) => ({
        key: r.member_key,
        name: r.name,
        id: r.student_id || "External",
        dept: r.dept || "Outside"
      }));
      localStorage.setItem("hallExternalMealStudents", JSON.stringify(mappedExt));
    }

    if (Array.isArray(mealRes.data)) {
      const recObj = {};
      mealRes.data.forEach((r) => {
        recObj[r.member_key] = {
          status: r.status === "OFF" ? "OFF" : "ON",
          meals: Number(r.meals) || 0,
          deposit: Number(r.deposit) || 0
        };
      });
      localStorage.setItem("hallMealRecords", JSON.stringify(recObj));
    }

    if (Array.isArray(bazarRes.data)) {
      const mappedBazar = bazarRes.data.map((r) => ({
        id: Number(r.id),
        date: r.entry_date,
        item: r.item,
        amount: Number(r.amount) || 0
      }));
      localStorage.setItem("hallMealBazarCosts", JSON.stringify(mappedBazar));
    }

    if (Array.isArray(feeRes.data)) {
      const feeObj = {};
      feeRes.data.forEach((r) => {
        feeObj[r.seat_key] = Number(r.joma) || 0;
      });
      localStorage.setItem("hallFeeRecords", JSON.stringify(feeObj));
    }

    if (Array.isArray(logRes.data)) {
      const logObj = {};
      logRes.data.forEach((r) => {
        logObj[r.log_date] = Number(r.meal_count) || 0;
      });
      localStorage.setItem("hallDailyMealLog", JSON.stringify(logObj));
    }

    if (setRes.data) {
      localStorage.setItem(
        "hallStolenMeals",
        String(Number(setRes.data.stolen_meals) || 0)
      );
      localStorage.setItem(
        "hallFeeTarget",
        String(Number(setRes.data.hall_fee_target) || 3000)
      );
      localStorage.setItem(
        "hallMealSchedule",
        JSON.stringify({
          isOpen: Boolean(setRes.data.meal_is_open),
          startDate: setRes.data.meal_start_date || "",
          closeDate: setRes.data.meal_close_date || ""
        })
      );
      localStorage.setItem(
        "hallMealManagerInfo",
        JSON.stringify(setRes.data.manager_info || null)
      );
    }

    return true;
  } catch (err) {
    console.error("Supabase sync error:", err);
    return false;
  }
}

// 2. Hall Students (Seat Assignment & Vacate)
async function saveHallStudentCloud(st) {
  if (!isSupabaseReady()) return;
  const seatKey = `${st.room}_${String(st.bed).trim()}_${String(st.id).trim()}`;
  const { error } = await supabaseClient.from("hall_students").upsert({
    seat_key: seatKey,
    name: st.name,
    student_id: st.id,
    dept: st.dept,
    phone: st.phone,
    blood: st.blood,
    district: st.district,
    floor: Number(st.floor),
    room: Number(st.room),
    bed: st.bed,
    image_url: st.image || null
  });
  if (error) console.error("saveHallStudentCloud error:", error);
}

async function deleteHallStudentCloud(st) {
  if (!isSupabaseReady()) return;
  const seatKey = `${st.room}_${String(st.bed).trim()}_${String(st.id).trim()}`;
  const { error: stErr } = await supabaseClient
    .from("hall_students")
    .delete()
    .eq("seat_key", seatKey);
  const { error: feeErr } = await supabaseClient
    .from("hall_fee_records")
    .delete()
    .eq("seat_key", seatKey);
  if (stErr) console.error("deleteHallStudentCloud error:", stErr);
  if (feeErr) console.error("deleteHallFeeCloud error:", feeErr);
}

// 3. External Meal Students
async function saveExternalStudentCloud(ext) {
  if (!isSupabaseReady()) return;
  const { error } = await supabaseClient.from("external_meal_students").upsert({
    member_key: ext.key,
    name: ext.name,
    student_id: ext.id || "External",
    dept: ext.dept || "Outside"
  });
  if (error) console.error("saveExternalStudentCloud error:", error);
}

async function deleteExternalStudentCloud(memberKey) {
  if (!isSupabaseReady()) return;
  const { error: extErr } = await supabaseClient
    .from("external_meal_students")
    .delete()
    .eq("member_key", memberKey);
  const { error: mealErr } = await supabaseClient
    .from("meal_records")
    .delete()
    .eq("member_key", memberKey);
  if (extErr) console.error("deleteExternalStudentCloud error:", extErr);
  if (mealErr) console.error("deleteMealRecordCloud error:", mealErr);
}

// 4. Meal Record (Status, Meals, Deposit)
async function saveMealRecordCloud(memberKey, rec) {
  if (!isSupabaseReady()) return;
  const { error } = await supabaseClient.from("meal_records").upsert({
    member_key: memberKey,
    status: rec.status === "OFF" ? "OFF" : "ON",
    meals: Number(rec.meals) || 0,
    deposit: Number(rec.deposit) || 0
  });
  if (error) console.error("saveMealRecordCloud error:", error);
}

async function saveAllMealRecordsCloud(mealRecordsObj) {
  if (!isSupabaseReady()) return;
  const rows = Object.entries(mealRecordsObj || {}).map(([key, rec]) => ({
    member_key: key,
    status: rec.status === "OFF" ? "OFF" : "ON",
    meals: Number(rec.meals) || 0,
    deposit: Number(rec.deposit) || 0
  }));
  if (rows.length === 0) return;
  const { error } = await supabaseClient.from("meal_records").upsert(rows);
  if (error) console.error("saveAllMealRecordsCloud error:", error);
}

// 5. Daily Bazar Costs
async function addBazarCostCloud(costItem) {
  if (!isSupabaseReady()) return;
  const { error } = await supabaseClient.from("meal_bazar_costs").upsert({
    id: Number(costItem.id),
    entry_date: costItem.date,
    item: costItem.item,
    amount: Number(costItem.amount) || 0
  });
  if (error) console.error("addBazarCostCloud error:", error);
}

async function deleteBazarCostCloud(costId) {
  if (!isSupabaseReady()) return;
  const { error } = await supabaseClient
    .from("meal_bazar_costs")
    .delete()
    .eq("id", Number(costId));
  if (error) console.error("deleteBazarCostCloud error:", error);
}

// 6. Hall Fee (Provost Joma)
async function saveHallFeeCloud(seatKey, jomaAmount) {
  if (!isSupabaseReady()) return;
  const { error } = await supabaseClient.from("hall_fee_records").upsert({
    seat_key: seatKey,
    joma: Number(jomaAmount) || 0
  });
  if (error) console.error("saveHallFeeCloud error:", error);
}

// 7. Daily Meal Log (Graph)
async function saveDailyMealLogCloud(logDate, mealCount) {
  if (!isSupabaseReady()) return;
  const { error } = await supabaseClient.from("daily_meal_log").upsert({
    log_date: logDate,
    meal_count: Number(mealCount) || 0
  });
  if (error) console.error("saveDailyMealLogCloud error:", error);
}

// 8. Global Settings
async function saveHallSettingsCloud() {
  if (!isSupabaseReady()) return;
  const stolenMeals = Number(localStorage.getItem("hallStolenMeals")) || 0;
  const hallFeeTarget = Number(localStorage.getItem("hallFeeTarget")) || 3000;
  const schedule = JSON.parse(localStorage.getItem("hallMealSchedule")) || {
    isOpen: true,
    startDate: "",
    closeDate: ""
  };
  const managerInfo =
    JSON.parse(localStorage.getItem("hallMealManagerInfo")) || null;

  const { error } = await supabaseClient.from("hall_settings").upsert({
    id: "main",
    stolen_meals: stolenMeals,
    hall_fee_target: hallFeeTarget,
    meal_is_open: Boolean(schedule.isOpen),
    meal_start_date: schedule.startDate || "",
    meal_close_date: schedule.closeDate || "",
    manager_info: managerInfo
  });
  if (error) console.error("saveHallSettingsCloud error:", error);
}