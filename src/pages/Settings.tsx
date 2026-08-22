export default function Settings(){
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <div className="text-[11px] tracking-[0.12em] font-medium text-muted uppercase">Settings</div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight">Settings</h1>
        <p className="text-[13px] text-muted mt-1">Workspace preferences • Self-managed local storage</p>
      </div>
      <div className="bg-white border border-line rounded-xl">
        <div className="px-5 py-4 border-b border-line"><h3 className="text-[13px] font-semibold">DayFlow data layer</h3></div>
        <div className="p-5">
          <div className="text-[12px] font-mono bg-paper border border-line rounded-lg p-3 leading-relaxed">
            Database: PostgreSQL 16 • API: Express<br/>
            Storage: local protected uploads • No third-party backend service
          </div>
          <div className="mt-3 text-[11px] text-muted">Passwords use PBKDF2-SHA256. Sessions use HttpOnly cookies. Attachments stay on the application server and require an authenticated download.</div>
        </div>
      </div>
      <div className="bg-white border border-line rounded-xl p-5">
        <h3 className="text-[13px] font-semibold">About Dayflow</h3>
        <p className="text-[12px] text-muted mt-2 leading-relaxed">Dayflow is an intelligent workforce command center. Every metric is derived from the seeded attendance and leave data in this prototype. Smart Leave Guard, Workforce Pulse, Heatmap and Dayflow AI are included in the demo.</p>
      </div>
    </div>
  )
}
