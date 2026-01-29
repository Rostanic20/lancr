import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { AppState } from "react-native";
import { getActiveTimer, startTimer, stopTimer } from "../services/timeService";
import { getProject } from "../services/projectService";
import { TimeEntry } from "../types";

interface TimerContextType {
  activeTimer: TimeEntry | null;
  elapsed: number;
  projectName: string | null;
  start: (projectId: number) => Promise<void>;
  stop: () => Promise<void>;
  refresh: () => Promise<void>;
}

const TimerContext = createContext<TimerContextType>({
  activeTimer: null,
  elapsed: 0,
  projectName: null,
  start: async () => {},
  stop: async () => {},
  refresh: async () => {},
});

export function useTimer() {
  return useContext(TimerContext);
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [projectName, setProjectName] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<TimeEntry | null>(null);

  function clearTick() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  const refresh = useCallback(async () => {
    try {
      const timer = await getActiveTimer();
      timerRef.current = timer;
      setActiveTimer(timer);
      clearTick();
      if (timer) {
        const proj = await getProject(timer.projectId);
        setProjectName(proj?.name || null);
        setElapsed(Math.floor((Date.now() - timer.startedAt) / 1000));
        intervalRef.current = setInterval(() => {
          setElapsed(Math.floor((Date.now() - timer.startedAt) / 1000));
        }, 1000);
      } else {
        setProjectName(null);
        setElapsed(0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    return clearTick;
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refresh();
      }
    });
    return () => sub.remove();
  }, []);

  const start = useCallback(async (projectId: number) => {
    await startTimer(projectId);
    await refresh();
  }, []);

  const stop = useCallback(async () => {
    const timer = timerRef.current || await getActiveTimer();
    if (timer) {
      await stopTimer(timer.id);
      clearTick();
      timerRef.current = null;
      setActiveTimer(null);
      setProjectName(null);
      setElapsed(0);
    }
  }, []);

  return (
    <TimerContext.Provider value={{ activeTimer, elapsed, projectName, start, stop, refresh }}>
      {children}
    </TimerContext.Provider>
  );
}
