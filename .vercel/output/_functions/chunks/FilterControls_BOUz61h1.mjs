import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useRef, useEffect, useMemo } from 'react';

const MONTHS_INDONESIAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember"
];
const YEARS = [2024, 2025, 2026, 2027];
function FilterControls({
  type,
  period,
  year,
  month,
  date,
  onChange
}) {
  const [yearOpen, setYearOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month);
  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const calendarRef = useRef(null);
  useEffect(() => {
    setViewYear(year);
    setViewMonth(month);
  }, [year, month]);
  useEffect(() => {
    function handleClickOutside(event) {
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setYearOpen(false);
      }
      if (monthRef.current && !monthRef.current.contains(event.target)) {
        setMonthOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleFilterChange = (newState) => {
    if (onChange) {
      onChange(newState);
    } else if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams();
      searchParams.set("type", newState.type);
      searchParams.set("period", newState.period);
      searchParams.set("year", String(newState.year));
      searchParams.set("month", String(newState.month));
      if (newState.date) {
        searchParams.set("date", newState.date);
      }
      window.location.search = searchParams.toString();
    }
  };
  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth, 0).getDate();
  }, [viewYear, viewMonth]);
  const firstDayIndex = useMemo(() => {
    return new Date(viewYear, viewMonth - 1, 1).getDay();
  }, [viewYear, viewMonth]);
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };
  const selectDate = (day) => {
    const paddedMonth = String(viewMonth).padStart(2, "0");
    const paddedDay = String(day).padStart(2, "0");
    const dateStr = `${viewYear}-${paddedMonth}-${paddedDay}`;
    handleFilterChange({
      type,
      period: "date",
      year: viewYear,
      month: viewMonth,
      date: dateStr
    });
    setCalendarOpen(false);
  };
  const formattedSelectedDate = useMemo(() => {
    if (!date) return "";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }).format(d);
    } catch {
      return "";
    }
  }, [date]);
  return /* @__PURE__ */ jsxs("div", { className: "w-full mb-6 bg-card border border-border/85 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-full border border-border/50 select-none w-52 h-10", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute top-1 bottom-1 bg-primary rounded-full transition-all duration-200 shadow shadow-primary/20",
              style: {
                left: type === "spend" ? "104px" : "4px",
                width: "100px"
              }
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleFilterChange({ type: "income", period, year, month, date }),
              type: "button",
              className: `relative flex-1 text-center text-xs font-bold transition-colors duration-200 z-10 focus:outline-none ${type !== "spend" ? "text-white" : "text-muted-foreground"}`,
              children: "Income"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleFilterChange({ type: "spend", period, year, month, date }),
              type: "button",
              className: `relative flex-1 text-center text-xs font-bold transition-colors duration-200 z-10 focus:outline-none ${type === "spend" ? "text-white" : "text-muted-foreground"}`,
              children: "Spend"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-full border border-border/50 select-none w-48 h-10", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute top-1 bottom-1 bg-primary rounded-full transition-all duration-200 shadow shadow-primary/20",
              style: {
                left: period === "year" ? "94px" : "4px",
                width: "90px"
              }
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleFilterChange({ type, period: "month", year, month, date }),
              type: "button",
              className: `relative flex-1 text-center text-xs font-bold transition-colors duration-200 z-10 focus:outline-none ${period !== "year" ? "text-white" : "text-muted-foreground"}`,
              children: "Month"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleFilterChange({ type, period: "year", year, month, date }),
              type: "button",
              className: `relative flex-1 text-center text-xs font-bold transition-colors duration-200 z-10 focus:outline-none ${period === "year" ? "text-white" : "text-muted-foreground"}`,
              children: "Year"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 relative z-30", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", ref: yearRef, children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setYearOpen(!yearOpen),
              type: "button",
              className: `h-10 px-4 rounded-full border bg-background hover:bg-muted text-xs font-bold flex items-center gap-1.5 transition-colors focus:outline-none ${yearOpen ? "border-primary text-primary" : "border-border text-foreground"}`,
              children: [
                /* @__PURE__ */ jsx("span", { children: year }),
                /* @__PURE__ */ jsx("svg", { className: `h-3.5 w-3.5 transition-transform duration-200 ${yearOpen ? "rotate-180" : ""}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) })
              ]
            }
          ),
          yearOpen && /* @__PURE__ */ jsx("div", { className: "absolute top-12 left-0 w-32 bg-card border border-border/80 rounded-2xl shadow-xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-150 z-50", children: YEARS.map((yr) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                handleFilterChange({ type, period, year: yr, month, date });
                setYearOpen(false);
              },
              type: "button",
              className: `w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-foreground ${yr === year ? "bg-primary/5 text-primary font-bold" : ""}`,
              children: yr
            },
            yr
          )) })
        ] }),
        period !== "year" && /* @__PURE__ */ jsxs("div", { className: "relative", ref: monthRef, children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setMonthOpen(!monthOpen),
              type: "button",
              className: `h-10 px-4 rounded-full border bg-background hover:bg-muted text-xs font-bold flex items-center gap-1.5 transition-colors focus:outline-none ${monthOpen ? "border-primary text-primary" : "border-border text-foreground"}`,
              children: [
                /* @__PURE__ */ jsx("span", { children: MONTHS_INDONESIAN[month - 1] }),
                /* @__PURE__ */ jsx("svg", { className: `h-3.5 w-3.5 transition-transform duration-200 ${monthOpen ? "rotate-180" : ""}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) })
              ]
            }
          ),
          monthOpen && /* @__PURE__ */ jsx("div", { className: "absolute top-12 left-0 w-36 bg-card border border-border/80 rounded-2xl shadow-xl p-1.5 max-h-56 overflow-y-auto z-50", children: MONTHS_INDONESIAN.map((mth, idx) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                handleFilterChange({ type, period, year, month: idx + 1, date });
                setMonthOpen(false);
              },
              type: "button",
              className: `w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-foreground ${idx + 1 === month ? "bg-primary/5 text-primary font-bold" : ""}`,
              children: mth
            },
            mth
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative", ref: calendarRef, children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setCalendarOpen(!calendarOpen),
              type: "button",
              className: `h-10 px-4 rounded-full font-bold text-xs flex items-center gap-2 border shadow-sm transition-colors focus:outline-none ${period === "date" ? "bg-[#2F7E79]/15 text-[#2F7E79] dark:text-teal-400 border-[#2F7E79]/30" : "bg-background border-border text-foreground hover:bg-muted"}`,
              children: [
                /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }) }),
                /* @__PURE__ */ jsx("span", { children: period === "date" && formattedSelectedDate ? formattedSelectedDate : "Pick Date" })
              ]
            }
          ),
          calendarOpen && /* @__PURE__ */ jsxs("div", { className: "absolute top-12 right-0 bg-card border border-border/80 rounded-3xl p-4 shadow-2xl w-64 z-50 animate-in fade-in duration-200", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs font-bold border-b border-border/40 pb-2 mb-2", children: [
              /* @__PURE__ */ jsx("button", { type: "button", onClick: handlePrevMonth, className: "hover:text-primary px-1.5 py-0.5 rounded hover:bg-muted text-foreground transition-colors", children: "<" }),
              /* @__PURE__ */ jsxs("span", { className: "text-foreground", children: [
                MONTHS_INDONESIAN[viewMonth - 1],
                " ",
                viewYear
              ] }),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: handleNextMonth, className: "hover:text-primary px-1.5 py-0.5 rounded hover:bg-muted text-foreground transition-colors", children: ">" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground mb-1", children: [
              /* @__PURE__ */ jsx("span", { children: "M" }),
              /* @__PURE__ */ jsx("span", { children: "S" }),
              /* @__PURE__ */ jsx("span", { children: "S" }),
              /* @__PURE__ */ jsx("span", { children: "R" }),
              /* @__PURE__ */ jsx("span", { children: "K" }),
              /* @__PURE__ */ jsx("span", { children: "J" }),
              /* @__PURE__ */ jsx("span", { children: "S" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-7 gap-1 text-center", children: [
              Array.from({ length: firstDayIndex }).map((_, idx) => /* @__PURE__ */ jsx("div", { className: "h-6 w-6" }, `empty-${idx}`)),
              Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const isSelected = period === "date" && date && new Date(date).getDate() === dayNum && new Date(date).getMonth() + 1 === viewMonth && new Date(date).getFullYear() === viewYear;
                return /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => selectDate(dayNum),
                    className: `h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${isSelected ? "bg-primary text-white shadow shadow-primary/20" : "hover:bg-primary/10 hover:text-primary text-foreground"}`,
                    children: dayNum
                  },
                  `day-${dayNum}`
                );
              })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 border-t border-border/40 pt-4", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => handleFilterChange({ type: "all", period, year, month, date }),
          type: "button",
          className: `h-9 px-5 rounded-full text-xs font-bold transition-all border ${type === "all" ? "bg-primary/15 text-primary border-primary/25" : "border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground"}`,
          children: "All"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => handleFilterChange({ type: "income", period, year, month, date }),
          type: "button",
          className: `h-9 px-5 rounded-full text-xs font-bold transition-all border ${type === "income" ? "bg-primary/15 text-primary border-primary/25" : "border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground"}`,
          children: "Income"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => handleFilterChange({ type: "spend", period, year, month, date }),
          type: "button",
          className: `h-9 px-5 rounded-full text-xs font-bold transition-all border ${type === "spend" ? "bg-primary/15 text-primary border-primary/25" : "border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground"}`,
          children: "Spend"
        }
      )
    ] })
  ] });
}

export { FilterControls as F };
