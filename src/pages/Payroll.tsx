import { useAuth } from '../lib/store'
import { formatCurrency } from '../lib/utils'
import { useState } from 'react'
import { EmployeeAvatar } from '../components/EmployeeAvatar'

export default function Payroll(){
  const { employees, user, data, updatePayrollWage } = useAuth()
  const isAdmin=user?.role==='admin'||user?.role==='hr'
  const me = employees.find(e=>e.email===user?.email) || employees[0]
  const list = isAdmin? employees : [me]
  const [selected,setSelected]=useState(me.id)
  const [wage,setWage]=useState(me.salary)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const selectedEmployee=employees.find(e=>e.id===selected)||me
  const selectedPayroll=data.payroll.find(p=>p.employeeId===selectedEmployee.id)
  async function recalculate(){
    setSaving(true);setError('')
    const result=await updatePayrollWage(selectedEmployee.id,wage)
    if(!result.ok)setError(result.error||'Could not update payroll')
    setSaving(false)
  }
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
            const p=data.payroll.find(x=>x.employeeId===emp.id)
            if(!p)return null
            return (
              <div key={emp.id} className="px-4 py-4 flex flex-wrap lg:grid lg:grid-cols-[1.6fr_0.9fr_0.9fr_0.9fr_1fr_80px] gap-3 lg:gap-0 items-center">
                <div className="flex items-center gap-3 min-w-[180px] flex-1 lg:flex-none">
                  <EmployeeAvatar employee={emp} className="w-8 h-8"/>
                  <div>
                    <div className="text-[13px] font-medium leading-none">{emp.name}</div>
                    <div className="text-[11px] text-muted">{emp.department} • {p.month}</div>
                  </div>
                </div>
                <div className="text-[13px] tabular-nums">{formatCurrency(emp.salary)}</div>
                <div className="text-[13px] tabular-nums text-accent">+{formatCurrency(p.bonus)}</div>
                <div className="text-[13px] tabular-nums text-[#8b3a3a]">-{formatCurrency(p.deductions)}</div>
                <div className="text-[13px] font-semibold tabular-nums">{formatCurrency(p.net)}</div>
                <div className="ml-auto lg:ml-0"><button onClick={()=>{setSelected(emp.id);setWage(emp.salary)}} className="px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium hover:bg-paper">{isAdmin?'Edit':'View'}</button></div>
              </div>
            )
          })}
        </div>
      </div>
      {selectedPayroll&&<div className="bg-white border border-line rounded-xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-[14px] font-semibold">{selectedEmployee.name} · Salary structure</h2><p className="text-[11px] text-muted mt-1">{isAdmin?'Editable wage with automatically calculated components':'Read-only earnings and deductions'}</p></div>{isAdmin&&<div className="flex gap-2"><input type="number" min="0" value={wage} onChange={e=>setWage(Number(e.target.value))} className="w-32 px-3 py-2 rounded-lg border border-line bg-paper text-[12px]"/><button disabled={saving} onClick={recalculate} className="px-3 py-2 rounded-lg bg-ink text-white text-[12px] font-medium disabled:opacity-60">{saving?'Saving…':'Recalculate'}</button></div>}</div>
        {error&&<div className="mt-3 text-[11px] text-[#991b1b] bg-[#fdf2f2] border border-[#f0d6d6] rounded-lg px-3 py-2">{error}</div>}
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">{[
          ['Basic salary',selectedPayroll.base],['HRA',selectedPayroll.hra],['Standard allowance',selectedPayroll.standardAllowance],['Performance bonus',selectedPayroll.performanceBonus],['Leave travel allowance',selectedPayroll.lta],['Fixed allowance',selectedPayroll.fixedAllowance],['Employee PF',selectedPayroll.pfEmployee],['Employer PF',selectedPayroll.pfEmployer],['Professional tax',selectedPayroll.professionalTax],['Net pay',selectedPayroll.net]
        ].map(([label,value])=><div key={String(label)} className="rounded-lg border border-line bg-paper p-3"><div className="text-[10px] text-muted uppercase tracking-[0.05em]">{label}</div><div className="text-[13px] font-semibold mt-1 tabular-nums">{formatCurrency(Number(value||0))}</div></div>)}</div>
        <div className="mt-4 text-[11px] text-muted">Board defaults: Basic 50% of wage · HRA 50% of Basic · PF 12% of Basic · Professional Tax ₹200 · Components never exceed wage.</div>
      </div>}
      <div className="text-[11px] text-muted">Payroll data is read-only for employees. Admin can update salary structure.</div>
    </div>
  )
}
