// Saudi Arabia calendar context: Hijri date + national holidays + prayer-time windows.
// Pure computation, no external API.

export interface CalendarContext {
  hijri_date: string;
  hijri_month: number;
  hijri_day: number;
  is_ramadan: boolean;
  is_iftar_window: boolean;
  is_suhoor_window: boolean;
  is_friday_prayer: boolean;
  is_rush_hour: boolean;
  holiday_name?: string;
  holiday_factor: number; // 1.0 - 1.5
  notes: string[];
}

function getHijriParts(date: Date): { day: number; month: number; year: number; formatted: string } {
  // Intl supports islamic-umalqura in Node ≥ 18
  const fmt = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const day = get("day");
  const month = get("month");
  const year = get("year");
  const formatted = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(date);
  return { day, month, year, formatted };
}

function getRiyadhParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    hour12: false,
    minute: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Riyadh",
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    weekday: get("weekday"), // Mon Tue Wed Thu Fri Sat Sun
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    month: Number(get("month")),
    day: Number(get("day")),
  };
}

export function getCalendarContext(now: Date = new Date()): CalendarContext {
  const hijri = getHijriParts(now);
  const r = getRiyadhParts(now);
  const notes: string[] = [];

  const isRamadan = hijri.month === 9;
  // Iftar: 18:00-19:30 in Saudi; Suhoor: 03:00-04:30
  const isIftar = isRamadan && ((r.hour === 18) || (r.hour === 19 && r.minute < 30));
  const isSuhoor = isRamadan && ((r.hour === 3) || (r.hour === 4 && r.minute < 30));
  // Friday prayer ~11:30-13:00
  const isFridayPrayer = r.weekday === "Fri" && r.hour >= 11 && r.hour < 13;
  // Rush hours in KSA: 7-9 morning, 15-18 evening
  const isRush = (r.hour >= 7 && r.hour < 9) || (r.hour >= 15 && r.hour < 18);

  let holidayName: string | undefined;
  let holidayFactor = 1.0;

  // Static Gregorian holidays
  if (r.month === 9 && r.day === 23) { holidayName = "اليوم الوطني السعودي"; holidayFactor = 1.4; }
  if (r.month === 2 && r.day === 22) { holidayName = "يوم التأسيس"; holidayFactor = 1.3; }

  // Hijri holidays
  if (hijri.month === 10 && hijri.day <= 3) { holidayName = "عيد الفطر"; holidayFactor = 1.5; }
  if (hijri.month === 12 && hijri.day >= 10 && hijri.day <= 13) { holidayName = "عيد الأضحى"; holidayFactor = 1.5; }
  if (hijri.month === 12 && hijri.day >= 8 && hijri.day <= 13) { notes.push("موسم الحج — توقّع ازدحام في المشاعر"); }

  if (isRamadan) notes.push("شهر رمضان المبارك");
  if (isIftar) { notes.push("نافذة الإفطار — ذروة عالية متوقعة"); holidayFactor = Math.max(holidayFactor, 1.4); }
  if (isSuhoor) notes.push("نافذة السحور — طلبات إضافية");
  if (isFridayPrayer) notes.push("صلاة الجمعة");
  if (isRush) notes.push("ساعة الذروة اليومية");

  return {
    hijri_date: hijri.formatted,
    hijri_month: hijri.month,
    hijri_day: hijri.day,
    is_ramadan: isRamadan,
    is_iftar_window: isIftar,
    is_suhoor_window: isSuhoor,
    is_friday_prayer: isFridayPrayer,
    is_rush_hour: isRush,
    holiday_name: holidayName,
    holiday_factor: holidayFactor,
    notes,
  };
}
