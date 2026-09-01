import * as React from "react"
import enLocale from "@/lib/locales/en.json"
import viLocale from "@/lib/locales/vi.json"

export type Lang = "en" | "vi"

export interface LangContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LangContext = React.createContext<LangContextType | undefined>(undefined)

const translations: Record<Lang, any> = {
  en: enLocale,
  vi: viLocale,
}

function getInitialLang(): Lang {
  try {
    const saved = localStorage.getItem("lang")
    if (saved === "en" || saved === "vi") {
      return saved
    }
  } catch {
    // ignore
  }

  if (typeof navigator !== "undefined" && navigator.language) {
    if (navigator.language.toLowerCase().startsWith("vi")) {
      return "vi"
    }
  }

  return "en"
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>(getInitialLang)

  const setLang = React.useCallback((newLang: Lang) => {
    setLangState(newLang)
    try {
      localStorage.setItem("lang", newLang)
    } catch {
      // ignore
    }
  }, [])

  const t = React.useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split(".")
      let current: any = translations[lang]

      for (const k of keys) {
        if (current && typeof current === "object" && k in current) {
          current = current[k]
        } else {
          // fallback to en
          let fallback: any = translations.en
          for (const fbKey of keys) {
            if (fallback && typeof fallback === "object" && fbKey in fallback) {
              fallback = fallback[fbKey]
            } else {
              fallback = undefined
              break
            }
          }
          current = fallback !== undefined ? fallback : key
          break
        }
      }

      if (typeof current !== "string") {
        return key
      }

      if (params) {
        return Object.entries(params).reduce((str, [paramKey, paramVal]) => {
          return str.replace(new RegExp(`{{${paramKey}}}`, "g"), String(paramVal))
        }, current)
      }

      return current
    },
    [lang]
  )

  const value = React.useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  const context = React.useContext(LangContext)
  if (!context) {
    throw new Error("useLang must be used within a LangProvider")
  }
  return context
}

export default LangContext
