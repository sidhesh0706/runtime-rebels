import { useAuth } from '../lib/store'
import { formatCurrency } from '../lib/utils'

export default function Payroll(){
  const { employees, user, data } = useAuth()
  const isAdmin=user?.role==='admin'
  const me = employees.find(e=>e.email===user?.email) || employees[0]
  const list = isAdmin? employees : [me]
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] tracking-[0.12em] font-medium text-muted uppercase">Payroll</div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight">Payroll</h1>
        <p className="text-[13px] text-muted mt-1">Salary visibility • {isAdmin? 'Manage structures':'Read-only'}</p>
      </div>
      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="hidden lg:grid grid-cols-[1.6fr_0.9fr_0.9fr_0.9fr_1fr_80px] gap-0 text-[11px] tracking-[0.06em] font-medium text-muted uppercase bg-paper border-b border-line px-4 py-3">
          <div>Employee</div><div>Base</div><div>Bonus</div><div>Deductions</div><div>Net pay</div><div></div>
        </div>
        <div className="divide-y divide-line">
          {list.map(emp=>{
            const p=data.payroll.find(x=>x.employeeId===emp.id)!
            return (
              <div key={emp.id} className="px-4 py-4 flex flex-wrap lg:grid lg:grid-cols-[1.6fr_0.9fr_0.9fr_0.9fr_1fr_80px] gap-3 lg:gap-0 items-center">
                <div className="flex items-center gap-3 min-w-[180px] flex-1 lg:flex-none">
                  <img src={emp.avatar} className="w-8 h-8 rounded-full"/>
                  <div>
                    <div className="text-[13px] font-medium leading-none">{emp.name}</div>
                    <div className="text-[11px] text-muted">{emp.department} • {p.month}</div>
                  </div>
                </div>
                <div className="text-[13px] tabular-nums">{formatCurrency(p.base)}</div>
                <div className="text-[13px] tabular-nums text-accent">+{formatCurrency(p.bonus)}</div>
                <div className="text-[13px] tabular-nums text-[#8b3a3a]">-{formatCurrency(p.deductions)}</div>
                <div className="text-[13px] font-semibold tabular-nums">{formatCurrency(p.net)}</div>
                <div className="ml-auto lg:ml-0">{isAdmin && <button className="px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium hover:bg-paper">Edit</button>}</div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="text-[11px] text-muted">Payroll data is read-only for employees. Admin can update salary structure.</div>
    </div>
  )
}
