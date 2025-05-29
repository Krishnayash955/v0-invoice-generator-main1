import { ThemeProvider } from "@/components/theme-provider"
import InvoiceGenerator from "./components/invoice-generator"

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <main className="min-h-screen bg-black">
        <div className="container mx-auto py-8 px-4">
          <InvoiceGenerator />
        </div>
      </main>
    </ThemeProvider>
  )
}
