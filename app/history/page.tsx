import { Header } from "@/components/dashboard/header"
import { HistoryClient } from "./HistoryClient"

// Force dynamic rendering to prevent build-time prerendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-2">History</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View, export, and manage your generated ASO reports.
          </p>
        </div>
        <HistoryClient />
      </main>
    </div>
  )
}
