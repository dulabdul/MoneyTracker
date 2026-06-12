import { useState, useRef, useEffect, useMemo } from "react";

export interface FilterState {
  type: "all" | "income" | "spend";
  period: "month" | "year" | "date";
  year: number;
  month: number;
  date?: string; // YYYY-MM-DD
}

interface FilterControlsProps {
  type: "all" | "income" | "spend";
  period: "month" | "year" | "date";
  year: number;
  month: number;
  date?: string;
  onChange?: (state: FilterState) => void;
}

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

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agt",
  "Sep",
  "Okt",
  "Nov",
  "Des"
];

const YEARS = [2024, 2025, 2026, 2027];

export default function FilterControls({
  type,
  period,
  year,
  month,
  date,
  onChange
}: FilterControlsProps) {
  // Dropdown states
  const [yearOpen, setYearOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Calendar navigation state
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month); // 1-12

  // Refs for closing dropdowns on click outside
  const yearRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewYear(year);
    setViewMonth(month);
  }, [year, month]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setYearOpen(false);
      }
      if (monthRef.current && !monthRef.current.contains(event.target as Node)) {
        setMonthOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Central change handler that handles optional onChange or navigates
  const handleFilterChange = (newState: FilterState) => {
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

  // Calendar math
  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayIndex = useMemo(() => {
    // getDay() is 0 for Sun, 1 for Mon... 6 for Sat
    // We want to align with grid where column 0 = Sun, 1 = Mon ...
    return new Date(viewYear, viewMonth - 1, 1).getDay();
  }, [viewYear, viewMonth]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectDate = (day: number) => {
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

  return (
    <div className="w-full mb-6 bg-card border border-border/85 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all space-y-6">
      {/* Top row: Selectors, switches and pick date */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        {/* Switches Container */}
        <div className="flex flex-wrap items-center gap-4">

          {/* Income / Spend sliding switch */}
          <div className="relative flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-full border border-border/50 select-none w-52 h-10">
            {/* Sliding active indicator block */}
            <div
              className="absolute top-1 bottom-1 bg-primary rounded-full transition-all duration-200 shadow shadow-primary/20"
              style={{
                left: type === "spend" ? "104px" : "4px",
                width: "100px"
              }}
            />
            <button
              onClick={() => handleFilterChange({ type: "income", period, year, month, date })}
              type="button"
              className={`relative flex-1 text-center text-xs font-bold transition-colors duration-200 z-10 focus:outline-none ${type !== "spend" ? "text-white" : "text-muted-foreground"
                }`}
            >
              Income
            </button>
            <button
              onClick={() => handleFilterChange({ type: "spend", period, year, month, date })}
              type="button"
              className={`relative flex-1 text-center text-xs font-bold transition-colors duration-200 z-10 focus:outline-none ${type === "spend" ? "text-white" : "text-muted-foreground"
                }`}
            >
              Spend
            </button>
          </div>

          {/* Month / Year sliding switch */}
          <div className="relative flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-full border border-border/50 select-none w-48 h-10">
            <div
              className="absolute top-1 bottom-1 bg-primary rounded-full transition-all duration-200 shadow shadow-primary/20"
              style={{
                left: period === "year" ? "94px" : "4px",
                width: "90px"
              }}
            />
            <button
              onClick={() => handleFilterChange({ type, period: "month", year, month, date })}
              type="button"
              className={`relative flex-1 text-center text-xs font-bold transition-colors duration-200 z-10 focus:outline-none ${period !== "year" ? "text-white" : "text-muted-foreground"
                }`}
            >
              Month
            </button>
            <button
              onClick={() => handleFilterChange({ type, period: "year", year, month, date })}
              type="button"
              className={`relative flex-1 text-center text-xs font-bold transition-colors duration-200 z-10 focus:outline-none ${period === "year" ? "text-white" : "text-muted-foreground"
                }`}
            >
              Year
            </button>
          </div>
        </div>

        {/* Datepicker & Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 relative z-30">

          {/* Year Selector */}
          <div className="relative" ref={yearRef}>
            <button
              onClick={() => setYearOpen(!yearOpen)}
              type="button"
              className={`h-10 px-4 rounded-full border bg-background hover:bg-muted text-xs font-bold flex items-center gap-1.5 transition-colors focus:outline-none ${yearOpen ? "border-primary text-primary" : "border-border text-foreground"
                }`}
            >
              <span>{year}</span>
              <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${yearOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {yearOpen && (
              <div className="absolute top-12 left-0 w-32 bg-card border border-border/80 rounded-2xl shadow-xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                {YEARS.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => {
                      handleFilterChange({ type, period, year: yr, month, date });
                      setYearOpen(false);
                    }}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-foreground ${yr === year ? "bg-primary/5 text-primary font-bold" : ""
                      }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Month Selector (hidden if Year mode is active) */}
          {period !== "year" && (
            <div className="relative" ref={monthRef}>
              <button
                onClick={() => setMonthOpen(!monthOpen)}
                type="button"
                className={`h-10 px-4 rounded-full border bg-background hover:bg-muted text-xs font-bold flex items-center gap-1.5 transition-colors focus:outline-none ${monthOpen ? "border-primary text-primary" : "border-border text-foreground"
                  }`}
              >
                <span>{MONTHS_INDONESIAN[month - 1]}</span>
                <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${monthOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {monthOpen && (
                <div className="absolute top-12 left-0 w-36 bg-card border border-border/80 rounded-2xl shadow-xl p-1.5 max-h-56 overflow-y-auto z-50">
                  {MONTHS_INDONESIAN.map((mth, idx) => (
                    <button
                      key={mth}
                      onClick={() => {
                        handleFilterChange({ type, period, year, month: idx + 1, date });
                        setMonthOpen(false);
                      }}
                      type="button"
                      className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-foreground ${idx + 1 === month ? "bg-primary/5 text-primary font-bold" : ""
                        }`}
                    >
                      {mth}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom Datepicker Button */}
          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => setCalendarOpen(!calendarOpen)}
              type="button"
              className={`h-10 px-4 rounded-full font-bold text-xs flex items-center gap-2 border shadow-sm transition-colors focus:outline-none ${period === "date"
                ? "bg-[#2F7E79]/15 text-[#2F7E79] dark:text-teal-400 border-[#2F7E79]/30"
                : "bg-background border-border text-foreground hover:bg-muted"
                }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{period === "date" && formattedSelectedDate ? formattedSelectedDate : "Pick Date"}</span>
            </button>

            {calendarOpen && (
              <div className="absolute top-12 right-0 bg-card border border-border/80 rounded-3xl p-4 shadow-2xl w-64 z-50 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-bold border-b border-border/40 pb-2 mb-2">
                  <button type="button" onClick={handlePrevMonth} className="hover:text-primary px-1.5 py-0.5 rounded hover:bg-muted text-foreground transition-colors">&lt;</button>
                  <span className="text-foreground">{MONTHS_INDONESIAN[viewMonth - 1]} {viewYear}</span>
                  <button type="button" onClick={handleNextMonth} className="hover:text-primary px-1.5 py-0.5 rounded hover:bg-muted text-foreground transition-colors">&gt;</button>
                </div>

                {/* Week Day Labels */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground mb-1">
                  <span>M</span><span>S</span><span>S</span><span>R</span><span>K</span><span>J</span><span>S</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Empty cells for padding */}
                  {Array.from({ length: firstDayIndex }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="h-6 w-6" />
                  ))}

                  {/* Actual Days */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const isSelected =
                      period === "date" &&
                      date &&
                      new Date(date).getDate() === dayNum &&
                      new Date(date).getMonth() + 1 === viewMonth &&
                      new Date(date).getFullYear() === viewYear;

                    return (
                      <button
                        key={`day-${dayNum}`}
                        type="button"
                        onClick={() => selectDate(dayNum)}
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${isSelected
                          ? "bg-primary text-white shadow shadow-primary/20"
                          : "hover:bg-primary/10 hover:text-primary text-foreground"
                          }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: Sub-filter chips */}
      <div className="flex items-center gap-2.5 border-t border-border/40 pt-4">
        <button
          onClick={() => handleFilterChange({ type: "all", period, year, month, date })}
          type="button"
          className={`h-9 px-5 rounded-full text-xs font-bold transition-all border ${type === "all"
            ? "bg-primary/15 text-primary border-primary/25"
            : "border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
        >
          All
        </button>
        <button
          onClick={() => handleFilterChange({ type: "income", period, year, month, date })}
          type="button"
          className={`h-9 px-5 rounded-full text-xs font-bold transition-all border ${type === "income"
            ? "bg-primary/15 text-primary border-primary/25"
            : "border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
        >
          Income
        </button>
        <button
          onClick={() => handleFilterChange({ type: "spend", period, year, month, date })}
          type="button"
          className={`h-9 px-5 rounded-full text-xs font-bold transition-all border ${type === "spend"
            ? "bg-primary/15 text-primary border-primary/25"
            : "border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
        >
          Spend
        </button>
      </div>
    </div>
  );
}
