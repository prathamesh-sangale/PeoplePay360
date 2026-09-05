import { Bell, Search } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border">
      <div className="flex items-center gap-4">
        {/* Breadcrumb placeholder */}
        <span className="text-sm text-muted-foreground">Home / Dashboard</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Global search..." className="h-9 w-64 rounded-md border border-input bg-background px-9 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        </div>
        <button className="p-2 rounded-full hover:bg-accent/50 transition-colors">
          <Bell size={20} />
        </button>
        <button className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full hover:bg-accent/50 transition-colors border border-border bg-background">
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-xs font-medium">U</div>
          <span className="text-sm font-medium">Admin</span>
        </button>
      </div>
    </header>
  );
}
