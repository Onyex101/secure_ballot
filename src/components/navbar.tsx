"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { LanguageSelector } from "./language-selector"
import { useAuthStore } from "@/store/useStore"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { t } = useLanguage()
  const { isAuthenticated } = useAuthStore()

  // Memoize toggle function
  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev)
  }, [])

  return (
    <>
      <nav className="glassmorphism sticky top-0 z-50 w-full py-3">
        <div className="container mx-auto flex items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-10 w-10 overflow-hidden">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/a2ab155c-d9f2-4496-8348-6166795a6b83-ufZ6Y3SuWgCxad1rVS0orIIbndoZBK.webp"
                alt="Secure Ballot Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold">{t("common.appName")}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/about" className="text-sm font-medium hover:text-primary">
              {t("nav.about")}
            </Link>
            <Link href="/faq" className="text-sm font-medium hover:text-primary">
              {t("nav.faq")}
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-primary">
              {t("nav.contact")}
            </Link>
            <LanguageSelector />
            <ThemeToggle />
            {!isAuthenticated && (
              <Button asChild>
                <Link href="/login">{t("nav.login")}</Link>
              </Button>
            )}
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSelector />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={toggleMenu}>
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </nav>
      {/* Mobile Navigation Menu (sibling, not child) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur p-4 md:hidden flex flex-col">
          {/* Mobile Menu Header: Logo, App Name, Close Button */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
              <div className="relative h-10 w-10 overflow-hidden">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/a2ab155c-d9f2-4496-8348-6166795a6b83-ufZ6Y3SuWgCxad1rVS0orIIbndoZBK.webp"
                  alt="Secure Ballot Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xl font-bold">{t("common.appName")}</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Close menu">
              <X />
            </Button>
          </div>
          {/* Mobile Menu Links */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
              {t("nav.about")}
            </Link>
            <Link href="/faq" className="text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
              {t("nav.faq")}
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
              {t("nav.contact")}
            </Link>
            {!isAuthenticated && (
              <Button asChild>
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>{t("nav.login")}</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
