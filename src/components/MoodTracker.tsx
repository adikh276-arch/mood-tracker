import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, History, X, Clock, Globe } from "lucide-react";
import { useAuth } from "@/contexts/TokenAuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DAYS, MESSAGES, Day } from "@/constants/messages";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { sql } from "@/lib/neon";

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'ja', name: '日本語' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'ko', name: '한국어' },
  { code: 'ru', name: 'Русский' },
  { code: 'it', name: 'Italiano' },
  { code: 'pl', name: 'Polski' },
  { code: 'th', name: 'ไทย' },
  { code: 'tl', name: 'Filipino' }
];

const MoodTracker = () => {
  const { t, i18n } = useTranslation();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<Day | null>(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as Day;
    return DAYS.includes(today) ? today : null;
  });
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [logged, setLogged] = useState(false);
  const [viewHistory, setViewHistory] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  const MOODS = [
    { emoji: "😊", label: t("moods.5"), value: 5, colorVar: "--mood-great" },
    { emoji: "🙂", label: t("moods.4"), value: 4, colorVar: "--mood-good" },
    { emoji: "😐", label: t("moods.3"), value: 3, colorVar: "--mood-okay" },
    { emoji: "😟", label: t("moods.2"), value: 2, colorVar: "--mood-low" },
    { emoji: "😢", label: t("moods.1"), value: 1, colorVar: "--mood-struggling" },
  ];

  const selectedMoodData = MOODS.find((m) => m.value === selectedMood);

  // Fetch History
  const { data: history, isLoading: loadingHistory, error: queryError } = useQuery({
    queryKey: ['moods', userId],
    queryFn: async () => {
      console.log("Fetching history for user ID:", userId);
      try {
        const data = await sql`
          SELECT * FROM mood_entries 
          WHERE user_id = ${userId} 
          ORDER BY logged_at DESC
        `;
        return data;
      } catch (error: any) {
        console.error("Neon fetch error:", error);
        toast.error(`Fetch failed: ${error.message}`);
        throw error;
      }
    },
    enabled: !!userId,
  });

  // Log Mutation
  const logMutation = useMutation({
    mutationFn: async (entry: any) => {
      try {
        // Ensure user exists before inserting mood
        await sql`
          INSERT INTO users (id) 
          VALUES (${entry.user_id}) 
          ON CONFLICT (id) DO NOTHING
        `;

        const result = await sql`
          INSERT INTO mood_entries (user_id, mood_value, mood_label, day_name, note)
          VALUES (${entry.user_id}, ${entry.mood_value}, ${entry.mood_label}, ${entry.day_name}, ${entry.note})
          RETURNING *
        `;
        return result[0];
      } catch (error: any) {
        console.error("Neon insert error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moods', userId] });
      setLogged(true);
      toast.success("Mood logged successfully!");
    },
    onError: (error: any) => {
      console.error("Failed to log mood to Neon:", error);
      toast.error(`Failed to save: ${error.message || "Database connection error"}`);
    }
  });


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(e.target as Node)) {
        setLanguageDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLog = () => {
    if (selectedMood === null || !selectedDay || !userId) return;

    logMutation.mutate({
      user_id: userId,
      mood_value: selectedMood,
      mood_label: selectedMoodData!.label,
      day_name: selectedDay,
      note,
    });
  };

  const handleReset = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as Day;
    setSelectedDay(DAYS.includes(today) ? today : null);
    setSelectedMood(null);
    setNote("");
    setLogged(false);
    setViewHistory(false);
  };

  const personalMessage = selectedDay && selectedMood ? {
    heading: t(`messages.${selectedDay}.${selectedMood}.heading`),
    body: t(`messages.${selectedDay}.${selectedMood}.body`)
  } : null;

  if (viewHistory) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-md flex-col gap-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-foreground">{t("tracker.title")}</h2>
            <button onClick={() => setViewHistory(false)} className="rounded-full p-2 hover:bg-secondary transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {loadingHistory ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : history && history.length > 0 ? (
              history.map((entry: any) => (
                <div key={entry.id} className="flex flex-col gap-2 rounded-2xl bg-card border border-input p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{MOODS.find(m => m.value === entry.mood_value)?.emoji}</span>
                      <span className="font-bold text-foreground">{t(`moods.${entry.mood_value}`)}</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(entry.logged_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-primary">{t(`days.${entry.day_name}`)}</p>
                  {entry.note && (
                    <p className="text-sm text-muted-foreground italic mt-1 border-l-2 border-primary/20 pl-3 py-1 bg-secondary/30 rounded-r-lg">
                      "{entry.note}"
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10 px-4 rounded-3xl bg-secondary/20">
                <p className="text-muted-foreground font-medium">{t("tracker.noEntries")}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setViewHistory(false)}
            className="w-full rounded-full bg-primary py-4 font-bold text-primary-foreground shadow-lg hover:scale-[1.02] transition-transform"
          >
            {t("tracker.backToTracker")}
          </button>
        </div>
      </div>
    );
  }

  if (logged && personalMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div
          className="flex flex-col items-center gap-5 text-center max-w-sm"
          style={{ animation: "fade-up 0.5s ease-out" }}
        >
          <div className="animate-check-in flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
            <Check className="h-10 w-10 text-primary" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground leading-snug">
            {personalMessage.heading}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            {personalMessage.body}
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
            <span className="text-xl">{selectedMoodData?.emoji}</span>
            <span className="text-sm font-semibold text-secondary-foreground">
              {selectedMoodData?.label} · {selectedDay ? t(`days.${selectedDay}`) : ""}
            </span>
          </div>
          <div className="flex flex-col w-full gap-3 mt-4">
            <button
              onClick={handleReset}
              className="w-full rounded-full bg-primary px-8 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
            >
              {t("tracker.logAnother")}
            </button>
            <button
              onClick={() => setViewHistory(true)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <History className="h-4 w-4" />
              {t("tracker.viewHistory")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-7">

        <div className="absolute top-6 right-6 flex items-center gap-3">
          {/* Language Switcher */}
          <div className="relative" ref={languageDropdownRef}>
            <button
              onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-card border border-input shadow-sm text-muted-foreground hover:text-primary hover:border-primary transition-all active:scale-90"
            >
              <Globe className="h-5 w-5" />
            </button>
            {languageDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-card border border-input shadow-xl rounded-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      const url = new URL(window.location.href);
                      url.searchParams.set('lang', lang.code);
                      window.history.pushState({}, '', url);
                      setLanguageDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors ${i18n.language === lang.code ? 'bg-primary/10 text-primary font-bold' : 'text-foreground'}`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setViewHistory(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-card border border-input shadow-sm text-muted-foreground hover:text-primary hover:border-primary transition-all active:scale-90"
            title="History"
          >
            <History className="h-6 w-6" />
          </button>
        </div>

        {/* Floating emoji decoration */}
        <div className="animate-float text-5xl pt-4">🧠</div>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            {t("tracker.howAreYouFeeling")}
          </h1>
          <p className="mt-1.5 text-muted-foreground font-medium">
            {t("tracker.checkInWithYourself")}
          </p>
        </div>

        {/* Current Day Display */}
        <div className="flex w-full max-w-xs items-center justify-center rounded-2xl border border-input bg-card px-5 py-3.5 text-sm font-semibold shadow-sm">
          <span className="text-foreground">
            {selectedDay ? `📅 ${t(`days.${selectedDay}`)}` : ""}
          </span>
        </div>

        {/* Mood Options */}
        <div className="flex w-full justify-center gap-2 sm:gap-3">
          {MOODS.map((mood) => {
            const isSelected = selectedMood === mood.value;
            return (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl px-3 py-3 transition-all duration-300 ${isSelected
                  ? "animate-bounce-select scale-110 shadow-lg"
                  : "hover:scale-105 hover:bg-secondary/60"
                  }`}
                style={
                  isSelected
                    ? {
                      backgroundColor: `hsl(var(${mood.colorVar}) / 0.18)`,
                      boxShadow: `0 8px 25px -5px hsl(var(${mood.colorVar}) / 0.3)`,
                    }
                    : undefined
                }
              >
                <span className={`text-3xl sm:text-4xl transition-transform duration-300 ${isSelected ? "scale-110" : ""}`}>
                  {mood.emoji}
                </span>
                <span
                  className={`text-[11px] font-bold tracking-wide ${isSelected ? "text-foreground" : "text-muted-foreground"
                    }`}
                >
                  {mood.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Note Field */}
        <input
          type="text"
          placeholder={t("tracker.addNote")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full max-w-xs rounded-2xl border border-input bg-card px-5 py-3.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-ring focus:shadow-md"
        />

        {/* CTA */}
        <div className="flex w-full max-w-xs justify-center pt-1">
          <button
            onClick={handleLog}
            disabled={selectedMood === null || selectedDay === null || logMutation.isPending}
            className="rounded-full bg-primary px-10 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30 active:scale-95 disabled:opacity-35 disabled:shadow-none disabled:hover:scale-100"
          >
            {logMutation.isPending ? t("tracker.logging") : t("tracker.logMood")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;
