import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import * as XLSX from "xlsx";
import excelFile from "../../data/di_stats.xlsx";
import { useTranslation } from "react-i18next";
import MultiRangeSlider from "../../components/MultiRangeSlider";
import { usePagination } from "../../hooks/usePagination";
import PaginationControls from "../../components/PaginationControls";

export const admissionTypeDescriptions = {
  CIV: "Civis",
  ΑΓΝ: "Άγνωστος κωδικός",
  ΑΔΣ: "Απόφαση δ.σ. του τμήματος",
  ΑΘΑ: "Ως αθλητής",
  ΑΘΓ: "Ως αθλήτρια",
  ΑΘΛ: "Αθλητές",
  ΑΚΑ: "Αλλογενείς αλλοδαποί κοινοτ. υπότροφοι",
  ΑΛΑ: "Ως αλλοδαπός",
  ΑΛΓ: "Ως αλλοδαπή",
  ΑΛΕ: "Απόφοιτοι λυκείων εξωτερικού",
  ΑΛΚ: "Αλλαγή κατεύθυνσης",
  ΑΛΣ: "Αλλοδαπός(-η) σ.α.ν.",
  ΑΜΕ: "Αναδρ.εγкр. μετεγγραφής απο γ.σ.",
  ΑΥΑ: "Ως αλλοδαπός υπότροφος",
  ΑΥΓ: "Ως αλλοδαπή υπότροφος",
  ΔΘΑ: "Διεθνείς ανταλλαγές/erasmus",
  ΔΘΣ: "Διεθνείς συνεργασίες",
  ΔΙΚ: "Κατάταξη δικατσα - δοαταπ",
  ΔΙΚ2: "Κατάταξη δικατσα",
  ΕΑΦ: "Επανεγγραφή μετα απο απολυτήριο",
  ΕΓΕ: "Ένταξη στο γ εξάμηνο (αποφ.συγκλήτου)",
  ΕΓΣ: "Επανεγγραφή (αποφ. γεν. συνέλευσης)",
  ΕΕΠ: "Ένταξη απο ειδικά προγράμματα",
  ΕΙΔ: "Ειδικές ανάγκες",
  ΕΙΠ: "Ειδικές περιπτώσεις",
  ΕΚΛ: "Ανώτερες εκκλησιαστικές σχολές",
  ΕΞΑ: "Ως έλληνας εξωτερικού",
  ΕΞΓ: "Ως ελληνίδα εξωτερικού",
  ΕΞΟ: "Εξομοίωση πτυχίου παιδαγωγικών ακαδημιών",
  ΕΠΑ: "Καθ' υπερ/φ.152/β6/198/00",
  ΕΠΒ: "Καθ' υπερβ.φ243/β6/755/00",
  ΕΠΓ: "Καθ΄ υπερβ.φ151/20049/β6/272/07",
  ΕΠΔ: "Καθ΄ υπερβ.φ151/17104/β6/259/06",
  ΕΠΕ: "Υπουργική απόφαση φ.253/β6/755/30-5-2000",
  ΕΠΖ: "Υπουργική απόφαση εσωτ.φ.25225/β6/200/6-4-00",
  ΕΠΗ: "Καθ΄ υπερβ.φ151/20049/β6 φεκ 156-α/04.09.09",
  ΕΠΘ: "Υπουργική απόφαση φ.152/β6/198/2000ν.3794/4.9.2009",
  ΕΠΞ: "Επανένταξη σε νέο πρόγραμμα (εξάμηνα)",
  ΕΠΥ: "Καθ΄ υπέρβαση 5%",
  ΕΠΦ: "Καθ' υπέρβαση λόγω φυσικών καταστροφών",
  ΕΣΚ: "Εσωτερική κινητικότητα",
  ΚΑΕ: "Κατάταξη πτυχιούχου αει",
  ΚΑΤ: "Κατατακτήριες",
  ΚΒΑ: "Κατάταξη με batchelor",
  ΚΔΕ: "Κατάταξη διετούς",
  ΚΔΙ: "Κατάταξη δι.κα.τσα.",
  ΚΜΑ: "Κατάταξη με master",
  ΚΞΠ: "Κάτοχος τίτλων σπουδών ξένων πανεπιστημίων",
  ΚΟΑ: "Κοινοτικοί αλλοδαποί",
  ΚΠΤ: "Κατάταξη πτυχιούχου αει-τει",
  ΚΤΔ: "Κατάταξη πτυχιούχου δραματικής σχολής",
  ΚΤΕ: "Κατάταξη πτυχιούχου τει",
  ΚΥΑ: "Ως κύπριος",
  ΚΥΓ: "Ως κύπρια",
  ΚΥΠ: "Κύπριοι",
  ΚΩΦ: "Κωφαλάλοι",
  ΛΥΓ: "Λόγοι υγείας - ανευ εξετάσεων",
  ΜΑΒ: "Διάκριση σε επιστημονικές ολυμπιάδες",
  ΜΑΓ: "Μετεγγραφή λόγω απώλειας γονέα",
  ΜΑΘ: "Μαθηματική ολυμπιάδα",
  ΜΑΝ: "Μεσογειακή αναιμία",
  ΜΕΑ: "Μετεγγραφή αθλητή",
  ΜΕΞ: "Μετεγγραφή εξωτερικού",
  ΜΕΣ: "Μετεγγραφή εσωτερικού",
  ΜΕΤ: "Απο μετεγγραφή",
  ΜΘΓ: "Μετεγγραφή λόγω ασθένειας γονέα",
  ΜΘΡ: "Μουσουλμάνοι θράκης",
  ΜΙΣ: "Μετεγγραφή ισοβαθμισάντων",
  ΜΚΥ: "Μετεγγραφή απο κύπρο",
  ΜΛΑ: "Μετεγγραφή λόγω φοιτούντος αδελφού",
  ΜΛΓ: "Μετεγγραφή λόγω φοιτούντος γονέα",
  ΜΛΘ: "Μετεγγραφή λόγω ασθένειας",
  ΜΛΜ: "Μετεγγραφή ως μητέρα ανηλίκων",
  ΜΛΣ: "Μετεγγραφή λόγω φοιτούντος συζύγου",
  ΜΟΡ: "Μετεγγραφή βασει ν3282/04 (ως ορφανό τέκνο)",
  ΜΤΘ: "Μεταφορά θέσης",
  ΜΤΛ: "Μετεγγραφή ως τέκνο πολυμελούς οικογένειας",
  ΜΤΠ: "Μετεγγραφή ως τέκνο πολυτέκνων",
  Ν2640: "Ν.2640/98",
  Ν3763: "Ν.3763/2009",
  Ν3794: "Ν.3794/09",
  ΟΜΟ: "Ως ομογενής",
  ΟΜΥ: "Ως ομογενής υπότροφος",
  ΠΑΔΕ: "Πανελλήνιες εξετάσεις (απόφαση διοικητικού εφετείου αθηνών)",
  ΠΑΚ: "Παιδαγωγικές ακαδημίες",
  ΠΑΝ: "Πανελλήνιες εξετάσεις",
  ΠΑΣ: "Πανελλήνιες εξετάσεις (απόφαση συγκλήτου)",
  ΠΚΚ: "Πανελλήνιες ειδ.περιπτ.-κοινων. κριτήρια",
  ΠΠΟ: "Πανελλήνιες ειδικές περιπτώσεις-πολύτεκνοι",
  ΠΣΕ: "Εγγραφή ως πρώην π.σ.ε.",
  ΠΤΡ: "Πανελλήνιες ειδικές περιπτώσεις-τρίτεκνοι",
  ΣΑΝ: "Απο σχολή αξιωματικών νοσηλευτικής",
  ΣΕΙ: "Σεισμοπλήκτος",
  ΣΤΡ: "Στρατιωτικές σχολές",
  ΤΕΑ: "Τέκνα αναπήρων",
  ΤΕΞ: "Τέκνα ελλήνων εξωτερικού",
  ΤΕΠ: "Τέκνα πολυτέκνων",
  ΤΠΛ: "Τέκνα πολυμελών οικογενειών",
  ΤΥΞ: "Τέκνα ελλήνων υπαλλήλων του εξωτερικού",
  ΤΥΦ: "Τυφλοί",
  ΥΑΑ: "Υπότροφος ακαδημίας αθηνών",
  ΥΙΚ: "Ως υπότροφος ι.κ.υ.",
  ΥΥΕ: "Ως υπότροφος υπ.εξ.",
  ΥΥΠ: "Ως υπότροφος υ.π.ε.π.θ",
  ΦΕΠ: "Φοιτητές ειδικών προγραμμάτων",
  ΦΠΨ: "Ένταξη απο φ.π.ψ.",
  ΦΣΓ: "Εκ του καταργηθέντος φυσιογνωστικού"
};

export const statusDescriptions = {
  ΑΝ: "Αναστολή φοίτησης",
  ΑΝΕ: "Ανενεργός",
  ΔΙ: "Διαγραφή",
  ΕΝ: "Ενεργός (είναι μέχρι και ν έτος)",
  ΕΠ: "Επί πτυχίω (ενεργός σε έτος μετά τα ν)",
  ΠΤ: "Πτυχιούχος",
};

const inactivityLevels = [
  { min: 20, color: "#8B0000", label: "> 20" },
  { min: 10, color: "#FF4500", label: "10–20" },
  { min: 5, color: "#FFA500", label: "5–10" },
  { min: 2, color: "#FFD700", label: "2–5" },
  { min: 0, color: "#32CD32", label: "< 2" },
];

// Utils
const formatYearsAndMonths = (yearsDecimal) => {
  const fullYears = Math.floor(yearsDecimal);
  const months = Math.round((yearsDecimal - fullYears) * 12);

  const yearLabel = fullYears === 1 ? "έτος" : "έτη";
  const monthLabel = months === 1 ? "μήνα" : "μήνες";

  if (fullYears > 0 && months > 0) {
    return `${fullYears} ${yearLabel} και ${months} ${monthLabel}`;
  } else if (fullYears > 0) {
    return `${fullYears} ${yearLabel}`;
  } else {
    return `${months} ${monthLabel}`;
  }
};

const formatDateToYearMonth = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date)) return "-";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}/${month}`;
};

const getColorByInactivity = (lastActionDate) => {
  const yearsInactive = (new Date() - new Date(lastActionDate)) / (1000 * 60 * 60 * 24 * 365.25);

  const level = inactivityLevels.find(lvl => yearsInactive > lvl.min);
  return level?.color ?? "#525252";
};

const getInactivityCategory = (yearsInactive) => {
  const level = inactivityLevels.find((lvl) => yearsInactive > lvl.min);
  return level?.label ?? "-";
};

const getTooltipHtml = (d) => {
  const fieldsToShow = [
    { label: "Έτος τελευταίας ενέργειας", value: d.data.year },
    { label: "Περασμένων μαθημάτα", value: d.data.r },
    { label: "Ημ/νία τελευταίας ενέργειας", value: formatDateToYearMonth(d.data.lastAction) },
    { label: "Τρόπος εισαγωγής", value: d.data.raw?.["ΤΡΟΠΟΣ ΕΙΣΑΓΩΓΗΣ"] },
    { label: "Έτος εγγραφής", value: d.data.raw?.["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"] },
    { label: "Κατάσταση φοίτησης", value: d.data.raw?.["ΚΑΤΑΣΤΑΣΗ"] },
    { label: "Έτη ανενεργός/ή", value: formatYearsAndMonths(d.data.size) },
  ];

  return fieldsToShow
    .map(({ label, value }) => `<b>${label}:</b> ${value ?? "-"}`)
    .join("<br/>");
};

const CheckboxFilter = ({ title, options, selected, setSelected, descriptions = {} }) => {
  const allSelected = selected.length === options.length;

  const toggleAll = (checked) => {
    setSelected(checked ? options : []);
  };

  const toggleOne = (option) => {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {title}
      </label>
      <div className="space-y-1 max-h-44 overflow-y-auto border border-gray-300 rounded-md text-sm bg-white">
        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
          <input
            type="checkbox"
            className="appearance-none h-4 w-4 shrink-0 rounded bg-white border border-gray-300
            checked:bg-[#36abcc] checked:border-[#36abcc]
            flex items-center justify-center
            focus:outline-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 20 20' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M16.704 5.29a1 1 0 010 1.42l-7.292 7.292a1 1 0 01-1.42 0L3.296 9.29a1 1 0 011.408-1.42L8 11.172l6.296-6.296a1 1 0 011.408 0z'/%3E%3C/svg%3E")`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1rem'
            }}
            checked={allSelected}
            onChange={(e) => toggleAll(e.target.checked)}
          />
          <span className="text-gray-800 font-medium">ΟΛΑ</span>
        </label>
        <div className="border-t border-gray-200 my-1" />
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
            <input
              type="checkbox"
              className="appearance-none h-4 w-4 shrink-0 rounded bg-white border border-gray-300
              checked:bg-[#36abcc] checked:border-[#36abcc]
              flex items-center justify-center
              focus:outline-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 20 20' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M16.704 5.29a1 1 0 010 1.42l-7.292 7.292a1 1 0 01-1.42 0L3.296 9.29a1 1 0 011.408-1.42L8 11.172l6.296-6.296a1 1 0 011.408 0z'/%3E%3C/svg%3E")`,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1rem'
              }}
              checked={selected.includes(option)}
              onChange={() => toggleOne(option)}
            />
            <span
              className="text-gray-800 text-sm whitespace-nowrap"
              title={`${option} - ${descriptions[option] ?? option}`}
            >
              {option} {descriptions[option] && `- ${descriptions[option]}`}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};


function filterStudents({
  data,
  selectedYears,
  courseRange,
  selectedAdmissionTypes,
  selectedStatuses
}) {
  return data.filter(b =>
    selectedYears.includes(b.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"]) &&
    b.r >= courseRange.start &&
    b.r <= courseRange.end &&
    selectedAdmissionTypes.includes(b.raw["ΤΡΟΠΟΣ ΕΙΣΑΓΩΓΗΣ"]) &&
    selectedStatuses.includes(b.raw["ΚΑΤΑΣΤΑΣΗ"])
  );
}
// Main Component
const InactiveStudents = () => {
  const { t } = useTranslation();

  // States
  const [rawData, setRawData] = useState([]);
  const [showRawData, setShowRawData] = useState(false);

  const [showFullDetails, setShowFullDetails] = useState(false);

  const {
    currentPage,
    totalPages,
    currentData,
    nextPage,
    prevPage,
    goToPage,
    canGoNext,
    canGoPrev,
  } = usePagination(rawData, 100);

  const [inactiveBubbleData, setInactiveBubbleData] = useState([]);
  const [selectedBubble, setSelectedBubble] = useState(null);

  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [range, setRange] = useState({ start: null, end: null });
  const [minYear, setMinYear] = useState(null);
  const [maxYear, setMaxYear] = useState(null);

  const [courseRange, setCourseRange] = useState({ start: null, end: null });
  const [availableCourses, setAvailableCourses] = useState([]);

  const [admissionTypes, setAdmissionTypes] = useState([]);
  const [selectedAdmissionTypes, setSelectedAdmissionTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  const [viewMode, setViewMode] = useState("individual");
  const [groupedMode, setGroupedMode] = useState("byYear");

  // Refs for D3 containers
  const packedRef = useRef(null);
  const containerRef = useRef(null);

  const yearPackedRef = useRef(null);
  const yearContainerRef = useRef(null);

  const categoryPackedRef = useRef(null);
  const categoryContainerRef = useRef(null);

  const admissionPackedRef = useRef(null);
  const admissionContainerRef = useRef(null);

  const statusPackedRef = useRef(null);
  const statusContainerRef = useRef(null);

  const durationContainerRef = useRef(null);
  const durationPackedRef = useRef(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Grouping Config
  const groupOptions = [
    {
      key: "byYear",
      label: "Ανά έτος εγγραφής",
      groupBy: (d) => d.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"],
      labelKey: "year",
      getLabel: (d) => d.data.year,
      containerRef: yearContainerRef,
      packedRef: yearPackedRef,
    },
    {
      key: "byCategory",
      label: "Ανά κατηγορία ανενεργών",
      groupBy: (d) => getInactivityCategory(d.size),
      labelKey: "category",
      getLabel: (d) => d.data.category,
      containerRef: categoryContainerRef,
      packedRef: categoryPackedRef,
    },
    {
      key: "byAdmissionType",
      label: "Ανά τρόπο εισαγωγής",
      groupBy: (d) => d.raw["ΤΡΟΠΟΣ ΕΙΣΑΓΩΓΗΣ"],
      labelKey: "admissionType",
      getLabel: (d) => d.data.admissionType,
      containerRef: admissionContainerRef,
      packedRef: admissionPackedRef,
    },
    {
      key: "byStatus",
      label: "Ανά κατάσταση φοίτησης",
      groupBy: (d) => d.raw["ΚΑΤΑΣΤΑΣΗ"],
      labelKey: "status",
      getLabel: (d) => d.data.status,
      containerRef: statusContainerRef,
      packedRef: statusPackedRef,
    },
    {
      key: "byStudyDuration",
      label: "Ανά διάρκεια φοίτησης",
      groupBy: (d) => {
        const enrollmentYear = d.raw?.["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"];
        const maxDataYear = Math.max(...availableYears); // from state
        const yearsStudied = maxDataYear - enrollmentYear;
        const n = 4;

        if (yearsStudied <= n) return `0 εώς και ν`;
        if (yearsStudied === n + 1) return `ν εώς και ν+1`;
        if (yearsStudied === n + 2) return `ν+1 εώς και ν+2`;
        return `>ν+2`;
      },
      labelKey: "durationCategory",
      getLabel: (d) => d.data.durationCategory,
      containerRef: durationContainerRef,
      packedRef: durationPackedRef,
    }

  ];

  const displayedAdmissions = selectedAdmissionTypes.length > 5 && !showFullDetails
    ? `${selectedAdmissionTypes.slice(0, 5).join(", ")}... και άλλοι ${selectedAdmissionTypes.length - 5}`
    : selectedAdmissionTypes.join(", ");

  const groupedModeConfig = Object.fromEntries(groupOptions.map((opt) => [opt.key, opt]));

  useEffect(() => {
    console.log('availableYears', availableYears)
    if (availableYears.length > 0) {
      setMinYear(Math.min(...availableYears));
      setMaxYear(Math.max(...availableYears));
    }
  }, [availableYears])

  useEffect(() => {
    const observeTarget =
      viewMode === "individual"
        ? containerRef.current
        : (viewMode === "grouped" && groupedMode === "byYear")
          ? yearContainerRef.current
          : (viewMode === "grouped" && groupedMode === "byCategory")
            ? categoryContainerRef.current
            : null;

    if (!observeTarget) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(observeTarget);
    return () => observeTarget && resizeObserver.unobserve(observeTarget);
  }, [viewMode, groupedMode]);

  useEffect(() => {
    const graphEl = document.getElementById("graph");

    const handleClick = (event) => {
      if (!graphEl) return;

      // Only clear if the click was *directly* on the #graph element
      if (event.target === graphEl) {
        setSelectedBubble(null);
      }
    };

    graphEl?.addEventListener("mousedown", handleClick);
    return () => {
      graphEl?.removeEventListener("mousedown", handleClick);
    };
  }, []);

  useEffect(() => {
    setSelectedBubble(null);
  }, [selectedYears, courseRange]);

  useEffect(() => {
    if (range.start !== null && range.end !== null) {
      const filtered = availableYears.filter(
        (y) => y >= range.start && y <= range.end
      );
      setSelectedYears(filtered);
    }
  }, [range, availableYears]);

  useEffect(() => {
    const loadExcelData = async () => {
      const response = await fetch(excelFile);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      setRawData(sheetData);

      const today = new Date();

      console.log(sheetData);
      // 🔽 Add this to log 2024 students




      const bubbles = sheetData
        .filter(row => !row["ΕΤΟΣ ΑΠΟΦΟΙΤΗΣΗΣ"])
        .map(row => {
          const lastActionRaw = Math.max(
            row["ΤΕΛΕΥΤΑΙΑ ΔΗΛΩΣΗ"] || 0,
            row["ΤΕΛΕΥΤΑΙΑ ΕΠΙΤΥΧΗΣ ΕΞΕΤΑΣΗ"] || 0,
            row["ΤΕΛΕΥΤΑΙΑ ΑΠΟΤΥΧΙΑ"] || 0,
            row["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"] + '091' || 0
          );

          const str = String(lastActionRaw);
          let year = parseInt(str.slice(0, 4));
          let month, day;


          month = parseInt(str.slice(4, 6))
          day = parseInt(str.slice(6, 7));

          const lastActionDate = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
          const yearsInactive = (today - lastActionDate) / (1000 * 60 * 60 * 24 * 365.25);

          const currentYear = today.getFullYear();
          const enrollmentYear = row["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"];
          const yearsStudied = currentYear - enrollmentYear;
          const n = 4;

          let durationCategory;
          if (yearsStudied <= n) durationCategory = `0 έως και ${n}`;
          else if (yearsStudied === n + 1) durationCategory = `${n + 1}`;
          else if (yearsStudied === n + 2) durationCategory = `${n + 2}`;
          else durationCategory = `${n + 3}+`;

          return {
            r: row["ΠΛΗΘΟΣ ΜΑΘΗΜΑΤΩΝ"] || 0,
            size: yearsInactive || 0.5,
            year,
            lastActionDate,
            lastAction: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
            durationCategory,
            raw: row
          };
        })
        .filter(d => !isNaN(d.lastActionDate));

      const groupedByYear = d3.group(bubbles, d => d.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"]);
      const nestedHierarchy = {
        children: [...groupedByYear.entries()].map(([year, students]) => ({
          year,
          children: students.map(s => ({ ...s, value: 1 }))
        }))
      };

      // 🔽 Add this to log 2024 students
      // console.log("2024 Students", bubbles.filter(b => b.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"] === 2024));
      console.log('bubbles', bubbles)
      setRawData(sheetData);
      setInactiveBubbleData(bubbles);

      const years = [...new Set(bubbles.map(b => b.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"]))].sort((a, b) => a - b);
      setAvailableYears(years);
      setSelectedYears(years); // Default to all years visible

      setRange({
        start: Math.min(...years),
        end: Math.max(...years),
      });

      const admissions = [...new Set(bubbles.map(b => b.raw["ΤΡΟΠΟΣ ΕΙΣΑΓΩΓΗΣ"]).filter(Boolean))];
      setAdmissionTypes(admissions);
      setSelectedAdmissionTypes(admissions); // default: all selected

      const uniqueStatuses = [...new Set(bubbles.map(b => b.raw["ΚΑΤΑΣΤΑΣΗ"]).filter(Boolean))];
      setStatuses(uniqueStatuses);
      setSelectedStatuses(uniqueStatuses); // Default: all selected


      const courses = [...new Set(bubbles.map(b => b.r))].sort((a, b) => a - b);
      setAvailableCourses(courses);

      setCourseRange({
        start: Math.min(...courses),
        end: Math.max(...courses),
      });

    };

    loadExcelData();
  }, []);

  useEffect(() => {
    const filteredData = filterStudents({
      data: inactiveBubbleData,
      selectedYears,
      courseRange,
      selectedAdmissionTypes,
      selectedStatuses
    });

    if (viewMode !== "individual") return;

    const fallbackSize = 800;
    const width = dimensions.width || fallbackSize;
    const height = dimensions.height || fallbackSize;

    if (!width || !height || !packedRef.current) return;

    d3.select(packedRef.current).selectAll("*").remove();


    const svg = d3
      .select(packedRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")


    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent")
      .on("click", () => {
        setSelectedBubble(null); // Clear when background is clicked
      });

    if (!filteredData.length) return; // ✅ draw empty chart only

    const tooltip = d3.select("#bubble-tooltip");

    const sortedData = [...filteredData].sort(
      (a, b) => new Date(a.lastAction) - new Date(b.lastAction)
    );

    const root = d3.hierarchy({ children: sortedData }).sum(d => d.value || 0.5);

    const padding = 1.5;

    const pack = d3.pack()
      .size([width, height])
      .padding(padding);

    const defs = svg.append("defs");

    const filter = defs.append("filter")
      .attr("id", "hover-shadow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter.append("feDropShadow")
      .attr("dx", 0)
      .attr("dy", 0)
      .attr("stdDeviation", 3)
      .attr("flood-color", "#000")
      .attr("flood-opacity", 0.3);



    pack(root);
    // const scaleX = 1.5;
    // root.descendants().forEach(d => {
    //   d.x = (d.x - width / 2) * scaleX + width / 2;
    // });


    svg
      .selectAll("circle")
      .data(root.leaves())
      .join("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.r)
      .attr("fill", d => getColorByInactivity(d.data.lastAction))
      .attr("opacity", d =>
        selectedBubble ? (d.data === selectedBubble ? 1 : 0.2) : 1
      )
      .attr("stroke", "#222")
      .attr("stroke-width", 0.3)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr("opacity", 1)
          .attr("filter", "url(#hover-shadow)");

        tooltip
          .style("opacity", 1)
          .html(getTooltipHtml(d));
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.clientX + 0}px`)
          .style("top", `${event.clientY + 0}px`);
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(0)
          .attr("filter", null)
          .attr("opacity", () => {
            const isSelected =
              selectedBubble &&
              d.data === selectedBubble

            return selectedBubble ? (isSelected ? 1 : 0.2) : 1;
          });

        tooltip.style("opacity", 0);
      })

      .on("click", (_, d) => {
        setSelectedBubble(d.data); // 🟢 Store data for details panel
      });
  }, [inactiveBubbleData, viewMode, groupedMode, dimensions, selectedYears, selectedAdmissionTypes, courseRange, selectedBubble, selectedStatuses]);

  const renderGroupedBubbles = (configKey) => {
    const config = groupedModeConfig[configKey];
    if (!config || !inactiveBubbleData.length || !dimensions.width || !config.packedRef.current) return;

    const filtered = filterStudents({
      data: inactiveBubbleData,
      selectedYears,
      courseRange,
      selectedAdmissionTypes,
      selectedStatuses
    });

    d3.select(config.packedRef.current).selectAll("*").remove();
    const svg = d3
      .select(config.packedRef.current)
      .append("svg")
      .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`)
      .attr("width", "100%")
      .attr("height", dimensions.height);

    svg.append("rect")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .attr("fill", "transparent")
      .on("click", () => setSelectedBubble(null));

    if (!filtered.length) return; // 🟢 Still shows empty chart container

    const grouped = d3.group(filtered, config.groupBy);
    const hierarchy = {
      children: [...grouped.entries()].map(([key, items]) => ({
        [config.labelKey]: key,
        children: [...items]
          .sort((a, b) => new Date(a.lastAction) - new Date(b.lastAction))
          .map((s) => ({ ...s, value: 1 })),
      })),
    };

    const root = d3
      .hierarchy(hierarchy)
      .sum((d) => d.value || 0)
      .sort((a, b) => b.value - a.value);

    d3.pack()
      .size([dimensions.width, dimensions.height])
      .padding(3)(root);

    root.children.forEach((group) => {
      group.r *= 0.9;
      group.children.forEach((child) => {
        const dx = child.x - group.x;
        const dy = child.y - group.y;
        const scale = 0.9;
        child.x = group.x + dx * scale;
        child.y = group.y + dy * scale;
      });
    });

    const tooltip = d3.select("#bubble-tooltip");

    svg
      .selectAll("circle.parent")
      .data(root.children)
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r + 3)
      .attr("fill", "#F9F9F9")
      .attr("stroke", "#ccc")
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(`<b>${config.labelKey}:</b> ${config.getLabel(d)}<br/><b>Φοιτητές/τριες:</b> ${d.children?.length ?? 0}`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.clientX}px`)
          .style("top", `${event.clientY}px`);
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    svg
      .selectAll("circle.student")
      .data(root.leaves())
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r)
      .attr("fill", (d) => getColorByInactivity(d.data.lastAction))
      .attr("opacity", (d) =>
        selectedBubble ? (d.data.raw === selectedBubble.raw ? 1 : 0.2) : 1
      )
      .attr("stroke", "#1E3A8A")
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr("filter", "url(#hover-shadow)")
          .attr("opacity", 1);

        tooltip.style("opacity", 1).html(getTooltipHtml(d));
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.clientX}px`)
          .style("top", `${event.clientY}px`);
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(0)
          .attr("filter", null)
          .attr("opacity", () =>
            selectedBubble && d.data.raw !== selectedBubble.raw ? 0.2 : 1
          );
        tooltip.style("opacity", 0);
      })
      .on("click", (_, d) => setSelectedBubble(d.data));

    svg
      .selectAll("text.label")
      .data(root.children)
      .join("text")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y - d.r)
      .attr("text-anchor", "middle")
      .attr("font-size", (d) => `${Math.max(8, d.r / 5)}px`)
      .attr("font-weight", "bold")
      .attr("fill", "#444")
      .style("paint-order", "stroke")
      .text(config.getLabel)
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(`<b>${config.label}</b> ${config.getLabel(d)}<br/><b>Φοιτητές/τριες:</b> ${d.children?.length ?? 0}`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.clientX}px`)
          .style("top", `${event.clientY}px`);
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

  };

  useEffect(() => {
    if (viewMode === "grouped") {
      renderGroupedBubbles(groupedMode);
    }
  }, [viewMode, groupedMode, inactiveBubbleData, dimensions, selectedYears, courseRange, selectedBubble, selectedAdmissionTypes, selectedStatuses]);


  const allKeys = useMemo(() => {
    const keySet = new Set();
    rawData.forEach((row) => {
      Object.keys(row || {}).forEach((key) => keySet.add(key));
    });
    return Array.from(keySet);
  }, [rawData]);

  return (
    <div className="mb-10">
      <div className="flex flex-col mx-5 mt-5">
        <h2 className="text-xl font-semibold">{t("homepage.visualizations.inactive_students.title")}</h2>

        <div className="flex flex-row gap-6 w-full">
          {/* Sidebar: Display options */}
          <div className="flex flex-col gap-3 mt-6 bg-white p-4 rounded shadow w-60">
            <div className="flex flex-col gap-2 text-sm">
              <h2 className="text-md font-semibold text-md">Επιλογή προβολής</h2>

              <div className="flex border border-gray-300 rounded overflow-hidden">
                {[
                  { value: "individual", label: "Ατομικά" },
                  { value: "grouped", label: "Ομαδοποιημένα" }
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`w-full text-center px-3 py-2 cursor-pointer transition-all duration-200
                        ${viewMode === option.value
                        ? "bg-secondary text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"}`}
                  >
                    <input
                      type="radio"
                      name="viewMode"
                      value={option.value}
                      checked={viewMode === option.value}
                      onChange={() => setViewMode(option.value)}
                      className="hidden"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {viewMode === "grouped" && (
                <select
                  value={groupedMode}
                  onChange={(e) => setGroupedMode(e.target.value)}
                  className="px-2 py-2 bg-secondary text-white text-sm w-full rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  {groupOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="border-t border-gray-200"></div>

            <div className="flex flex-col gap-2 text-sm">
              <h2 className="text-md font-semibold">Φίλτρα</h2>

              <div className="text-sm text-gray-700 font-base">

                <label className="font-medium">Έτος εγγραφής</label>

                {minYear && maxYear && (
                  <MultiRangeSlider
                    min={minYear}
                    max={maxYear}
                    value={{
                      min: range.start,
                      max: range.end,
                    }}
                    onChange={({ min, max }) => {
                      setRange({
                        start: min,
                        end: max,
                      });
                    }}
                  />
                )}
              </div>

              <div className="text-sm text-gray-700 font-base">
                <label className="font-medium">Περασμένα μαθημάτα</label>

                {availableCourses.length > 0 && (
                  <MultiRangeSlider
                    min={Math.min(...availableCourses)}
                    max={Math.max(...availableCourses)}
                    value={{
                      min: courseRange.start,
                      max: courseRange.end,
                    }}
                    onChange={({ min, max }) => {
                      setCourseRange({
                        start: min,
                        end: max,
                      });
                    }}
                  />
                )}
              </div>

              <CheckboxFilter
                title="Κατάσταση φοίτησης"
                options={statuses}
                selected={selectedStatuses}
                setSelected={setSelectedStatuses}
                descriptions={statusDescriptions}
              />

              <CheckboxFilter
                title="Τρόπος εισαγωγής"
                options={admissionTypes}
                selected={selectedAdmissionTypes}
                setSelected={setSelectedAdmissionTypes}
                descriptions={admissionTypeDescriptions}
              />

            </div>

          </div>
          {/* Main content (bubble chart and legend) */}
          <div id="graph" className="flex flex-row bg-white shadow shadow-lg rounded-lg mt-6 w-full">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 items-baseline">
              <div className="flex flex-col justify-center items-left gap-2 text-sm bg-white border-gray-300 border-[1px] shadow-sm m-2 px-2 py-2">
                <span className="text-gray-600">Έτη ανενεργός/ή</span>
                <div className="flex flex-col gap-2 mt-2 flex-wrap">
                  {inactivityLevels.map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                      {label}
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Chart container */}
            <div className="w-full m-4">
              {viewMode === "individual" && (
                <div>
                  <div ref={containerRef} style={{ height: "90vh", width: "100%" }} className="relative">
                    <div ref={packedRef} className="absolute inset-0"></div>
                  </div>
                </div>
              )}

              {(viewMode === "grouped" && groupedMode === "byYear") && (
                <div>
                  <h3 className="text-lg font-medium">Ομαδοποίηση ανά έτος εγγραφής</h3>
                  <div ref={yearContainerRef} style={{ height: "90vh", width: "100%" }} className="relative">
                    <div ref={yearPackedRef} className="absolute inset-0"></div>
                  </div>
                </div>
              )}
              {(viewMode === "grouped" && groupedMode === "byCategory") && (
                <div>
                  <h3 className="text-lg font-medium">Ομαδοποίηση ανά κατηγορία ανενεργών</h3>
                  <div ref={categoryContainerRef} style={{ height: "90vh", width: "100%" }} className="relative">
                    <div ref={categoryPackedRef} className="absolute inset-0" />
                  </div>
                </div>
              )}

              {viewMode === "grouped" && groupedMode === "byAdmissionType" && (
                <div>
                  <h3 className="text-lg font-medium">Ομαδοποίηση ανά τρόπο εισαγωγής</h3>
                  <div ref={admissionContainerRef} style={{ height: "90vh", width: "100%" }} className="relative">
                    <div ref={admissionPackedRef} className="absolute inset-0" />
                  </div>
                </div>
              )}
              {viewMode === "grouped" && groupedMode === "byStatus" && (
                <div>
                  <h3 className="text-lg font-medium">Ομαδοποίηση ανά κατάσταση φοίτησης</h3>
                  <div ref={statusContainerRef} style={{ height: "90vh", width: "100%" }} className="relative">
                    <div ref={statusPackedRef} className="absolute inset-0" />
                  </div>
                </div>
              )}
              {viewMode === "grouped" && groupedMode === "byStudyDuration" && (
                <div>
                  <h3 className="text-lg font-medium">	Ομαδοποίηση ανά διάρκεια φοίτησης</h3>
                  <div ref={durationContainerRef} style={{ height: "90vh", width: "100%" }} className="relative">
                    <div ref={durationPackedRef} className="absolute inset-0" />
                  </div>
                </div>
              )}
            </div>
          </div>


          <div className="max-w-[20%] mt-6 w-full">
            <div className="p-2 relative w-full bg-white shadow shadow-lg rounded-lg w-full">
              <p className="text-lg font-medium">
                {inactiveBubbleData.filter(b => selectedYears.includes(b.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"])).length} Φοιτητές/ριες
              </p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed whitespace-pre-line">
                Με έτος εγγραφής
                {range.start !== range.end ? ` ${range.start}–${range.end}` : ` ${range.start}`}
                , περασμένα μαθήματα {courseRange.start}–{courseRange.end}
                , κατάσταση φοίτησης {selectedStatuses.length > 0 ? selectedStatuses.join(", ") : "Καμία"}
                {' '} και τρόπους εισαγωγής {selectedAdmissionTypes.length > 0 ? displayedAdmissions : "Κανένα"}
              </p>

              {selectedAdmissionTypes.length > 5 && (
                <button
                  onClick={() => setShowFullDetails(!showFullDetails)}
                  className="text-xs text-blue-600 hover:underline mt-1"
                >
                  {showFullDetails ? "Προβολή συνοπτικά" : "Προβολή αναλυτικά"}
                </button>
              )}
            </div>

            {/* Details panel */}
            {selectedBubble && (
              <div className="relative w-full p-2 text-sm bg-white shadow shadow-lg rounded-lg mt-2 w-full">
                <button
                  onClick={() => setSelectedBubble(null)}
                  className="absolute top-0 right-1 text-gray-500 hover:text-gray-800 text-3xl font-bold"
                  aria-label="Close"
                >
                  &times;
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: getColorByInactivity(selectedBubble.lastAction) }}
                  />
                  <p className="text-md font-semibold">Επιλεγμένος/η φοιτητής/τρια</p>
                </div>
                <div className="text-xs space-y-1">
                  <p><span className="font-semibold">Ημ/νία τελευταίας ενέργειας:</span>   {formatDateToYearMonth(selectedBubble.lastAction)}</p>
                  <p><span className="font-semibold">Έτη ανενεργός/ή:</span>{formatYearsAndMonths(selectedBubble.size)}</p>
                  <p><span className="font-semibold">Έτος εγγραφής:</span> {selectedBubble.raw?.["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"]}</p>
                  <p><span className="font-semibold">Πλήθος περασμένων μαθημάτων:</span> {selectedBubble.r}</p>
                  <p><span className="font-semibold">Κατάσταση φοίτησης:</span> {selectedBubble.raw?.["ΚΑΤΑΣΤΑΣΗ"]}</p>
                  <p><span className="font-semibold">Τρόπος εισαγωγής:</span> {selectedBubble.raw?.["ΤΡΟΠΟΣ ΕΙΣΑΓΩΓΗΣ"]}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tooltip */}
        <div
          id="bubble-tooltip"
          className="fixed text-xs bg-white border border-gray-300 text-gray-900 px-2 py-1 rounded shadow-lg z-50 opacity-0 pointer-events-none whitespace-pre-line"
        ></div>
      </div>

      <div className="mx-5 mt-5">
        <button
          onClick={() => setShowRawData(!showRawData)}
          className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-white bg-[#36abcc] rounded transition hover:bg-[#2c9cb7]"
        >
          <span>{showRawData ? "Απόκρυψη δεδομένων" : "Εμφάνιση δεδομένων"}</span>
          <svg
            className={`w-5 h-5 transform transition-transform duration-300 ${showRawData ? "rotate-180" : "rotate-0"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${showRawData ? "max-h-[1000px]" : "max-h-0"}`}
        >
          <div className="bg-white p-4 rounded-b shadow">
            {/* Pagination Controls */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              goToPage={goToPage}
              nextPage={nextPage}
              prevPage={prevPage}
              canGoNext={canGoNext}
              canGoPrev={canGoPrev}
            />

            {/* Table */}
            <div className="overflow-x-auto bg-gray-50 mt-4 border rounded max-h-[400px] overflow-y-auto text-sm">
              <table className="min-w-full border text-xs text-left">
                <thead className="bg-white sticky top-0 z-10">
                  <tr>
                    {allKeys.map((key) => (
                      <th key={key} className="px-2 py-1 border-b whitespace-nowrap">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-100 border-t">
                      {allKeys.map((key, j) => (
                        <td key={j} className="px-2 py-1 border-b whitespace-nowrap">
                          {row && row[key] != null && row[key] !== "" ? String(row[key]) : "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default InactiveStudents;
