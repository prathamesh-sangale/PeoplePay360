import { Building, IndianRupee } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Organization preferences, statutory configurations, and currency formatting.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Building className="text-primary" size={20} />
            <h3 className="text-base font-semibold text-foreground">Company Entity Information</h3>
          </div>
          <p className="text-xs text-muted-foreground">PeoplePay360 Technologies Private Limited (CIN: U72200KA2026PTC089123)</p>
          <div className="text-xs text-foreground space-y-1">
            <p>Registered Address: Outer Ring Road, Kadubeesanahalli, Bengaluru, Karnataka 560103</p>
            <p>PAN: AABCP1234F • TAN: BLRP12345D • GSTIN: 29AABCP1234F1Z8</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center gap-2">
            <IndianRupee className="text-emerald-500" size={20} />
            <h3 className="text-base font-semibold text-foreground">Statutory Rates (FY 2026-27)</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-muted-foreground">EPF Employee Contribution</span>
              <div className="text-sm font-bold text-foreground mt-0.5">12.00% of Basic</div>
            </div>
            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-muted-foreground">Professional Tax (PT)</span>
              <div className="text-sm font-bold text-foreground mt-0.5">₹200 / Month</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
