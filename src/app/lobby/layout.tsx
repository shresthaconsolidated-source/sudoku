import Navbar from '@/components/navbar'

export default function LobbyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground flex flex-col relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-40 -right-20 w-[500px] h-[500px] bg-secondary/10 blur-[150px] rounded-full -z-10" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      <Navbar />
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        {children}
      </main>
    </div>
  )
}
