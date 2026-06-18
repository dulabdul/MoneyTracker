import { useState, useRef, useEffect, useMemo } from "react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
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

export default function DatePicker({
  value,
  onChange,
  placeholder = "Pilih Tanggal",
  className = "",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Timezone-safe parsing of YYYY-MM-DD
  const parsedDate = useMemo(() => {
    if (!value) return null;
    const parts = value.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return { year, month, day };
      }
    }
    return null;
  }, [value]);

  const [viewYear, setViewYear] = useState(() => parsedDate?.year ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parsedDate?.month ?? (new Date().getMonth() + 1)); // 1-12

  // Sync view when value changes from outside
  useEffect(() => {
    if (parsedDate) {
      setViewYear(parsedDate.year);
      setViewMonth(parsedDate.month);
    }
  }, [parsedDate]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayIndex = useMemo(() => {
    // getDay() is 0 for Sun, 1 for Mon... 6 for Sat
    // We want column 0 = Mon, 1 = Tue, ..., 6 = Sun
    const day = new Date(viewYear, viewMonth - 1, 1).getDay();
    return day === 0 ? 6 : day - 1;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
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
    onChange(dateStr);
    setOpen(false);
  };

  const formattedValue = useMemo(() => {
    if (!parsedDate) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    return `${parsedDate.day} ${months[parsedDate.month - 1]} ${parsedDate.year}`;
  }, [parsedDate]);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-sm font-semibold flex items-center justify-between text-foreground hover:bg-muted/40 transition-all select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2F7E79]/40 focus:border-[#2F7E79]/60"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground font-normal"}>
          {formattedValue || placeholder}
        </span>
        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-12 left-0 right-0 bg-card border border-border/80 rounded-3xl p-4 shadow-2xl z-50 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-bold border-b border-border/40 pb-2 mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="h-6 w-6 rounded hover:bg-muted text-foreground flex items-center justify-center transition-colors cursor-pointer"
            >
              &lt;
            </button>
            <span className="text-foreground">{MONTHS_INDONESIAN[viewMonth - 1]} {viewYear}</span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="h-6 w-6 rounded hover:bg-muted text-foreground flex items-center justify-center transition-colors cursor-pointer"
            >
              &gt;
            </button>
          </div>

          {/* Week Day Labels (Mon-Sun in ID) */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground mb-1 select-none">
            <span>S</span><span>S</span><span>R</span><span>K</span><span>J</span><span>S</span><span>M</span>
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
              const isSelected = parsedDate !== null &&
                parsedDate.day === dayNum &&
                parsedDate.month === viewMonth &&
                parsedDate.year === viewYear;

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => selectDate(dayNum)}
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#2F7E79] dark:bg-teal-600 text-white shadow shadow-primary/20"
                      : "hover:bg-primary/10 hover:text-[#2F7E79] dark:hover:text-teal-400 text-foreground"
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
  );
}
