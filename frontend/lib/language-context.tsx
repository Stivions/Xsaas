"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { copy, type Language, type AppCopy } from "@/lib/copy"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: AppCopy
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  useEffect(() => {
    const saved = localStorage.getItem("xsaas-language") as Language | null
    if (saved === "en" || saved === "es") {
      setLanguageState(saved)
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("xsaas-language", lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: copy[language] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
