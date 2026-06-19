"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Smartphone } from "lucide-react"

export default function PwaInstallModal() {
  const [open, setOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    // Detect if running in standalone PWA mode
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://")

    const dismissed = localStorage.getItem("pwa-install-dismissed")

    if (!dismissed && !isStandalone) {
      // Small timeout to let the page settle before popping up
      const timer = setTimeout(() => setOpen(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (dontShowAgain) {
        localStorage.setItem("pwa-install-dismissed", "true")
      }
    }
    setOpen(newOpen)
  }

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("pwa-install-dismissed", "true")
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-card/95 border border-border rounded-3xl p-6 text-foreground shadow-2xl backdrop-blur-xl">
        <DialogHeader className="space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <Smartphone className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold tracking-tight text-foreground">
            Install Monty App
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground text-xs">
            Pasang Monty di layar utama ponsel Anda untuk akses cepat, performa optimal, dan tampilan layar penuh seperti aplikasi native.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2">
          <Tabs defaultValue="android" className="w-full">
            <TabsList className="grid grid-cols-2 bg-muted border border-border p-1 rounded-xl h-10">
              <TabsTrigger value="android" className="rounded-lg text-xs font-bold transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                Android
              </TabsTrigger>
              <TabsTrigger value="ios" className="rounded-lg text-xs font-bold transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                iPhone / iOS
              </TabsTrigger>
            </TabsList>

            {/* Android Instructions */}
            <TabsContent value="android" className="mt-4 space-y-3 bg-muted/40 p-4 border border-border/60 rounded-2xl">
              <div className="flex gap-3 items-start">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">1</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Buka Monty di Google Chrome, klik ikon <strong>tiga titik vertikal</strong> di pojok kanan atas.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">2</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pilih menu <strong>"Install app"</strong> atau <strong>"Tambahkan ke Layar utama"</strong>.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">3</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Konfirmasi instalasi pada dialog pop-up, lalu Monty siap digunakan di home screen ponsel Anda!
                </p>
              </div>
            </TabsContent>

            {/* iOS Instructions */}
            <TabsContent value="ios" className="mt-4 space-y-3 bg-muted/40 p-4 border border-border/60 rounded-2xl">
              <div className="flex gap-3 items-start">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">1</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Buka Monty di browser <strong>Safari</strong> pada iPhone Anda.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">2</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Klik tombol <strong>"Share"</strong> (ikon kotak dengan anak panah ke atas di bilah navigasi bawah Safari).
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">3</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Scroll ke bawah dan pilih opsi <strong>"Add to Home Screen"</strong> (atau <strong>"Tambahkan ke Layar Utama"</strong>).
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">4</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tekan tombol <strong>"Add"</strong> di pojok kanan atas untuk memasang Monty App.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex items-center gap-2 mt-4 px-1 py-1 select-none">
          <input
            id="dont-show-again"
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-muted focus:ring-emerald-500 text-emerald-600 cursor-pointer accent-emerald-500"
          />
          <label htmlFor="dont-show-again" className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            Jangan tampilkan lagi
          </label>
        </div>

        <DialogFooter className="mt-6 flex flex-row gap-2 justify-end">
          <Button
            onClick={handleClose}
            className="w-full sm:w-auto h-10 px-6 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white font-bold transition-all shadow-lg shadow-emerald-500/10 cursor-pointer border-none"
          >
            Mengerti, Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
