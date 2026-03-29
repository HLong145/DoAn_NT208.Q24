import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccountInformation() {
  const navigate = useNavigate();

  const rows = [
    { label: 'Username', value: 'janedoe' },
    { label: 'Phone', value: '+1 555 555 5555' },
    { label: 'Email', value: 'jane@example.com' },
    { label: 'Birth date', value: 'March 12, 1998' },
    { label: 'Account creation', value: 'March 2021' },
  ];

  return (
    <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
      <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border p-3 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-border/50 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight">Account information</h1>
          <p className="text-[13px] text-text-muted">See your account details</p>
        </div>
      </div>

      <div className="max-w-[620px]">
        <p className="px-4 py-3 text-sm text-text-muted">
          Review and update the information associated with your account.
        </p>

        <div className="border-y border-border">
          {rows.map((row) => (
            <button
              key={row.label}
              className="w-full px-4 py-4 hover:bg-border/50 transition-colors flex items-center justify-between text-left"
            >
              <div>
                <p className="text-sm text-text-muted">{row.label}</p>
                <p className="text-[15px] text-text-base mt-0.5">{row.value}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted" />
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
