import Navbar from '@/components/navbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background decorative glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/5 blur-[100px] rounded-full -z-10" />
      
      <Navbar />
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        {children}
      </main>
    </div>
  )
}
