"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface QuizStatusContextType {
  started: boolean;
  setStarted: (s: boolean) => void;
}

const QuizStatusContext = createContext<QuizStatusContextType>({
  started: false,
  setStarted: () => {},
});

export function QuizStatusProvider({ children }: { children: ReactNode }) {
  const [started, setStarted] = useState(false);

  return (
    <QuizStatusContext.Provider value={{ started, setStarted }}>
      {children}
    </QuizStatusContext.Provider>
  );
}

export const useQuizStatus = () => useContext(QuizStatusContext);
