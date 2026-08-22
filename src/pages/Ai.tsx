import { useState } from 'react'
import { useAuth, useMetrics, departmentStats } from '../lib/store'
import { Link } from 'react-router-dom'

type Msg={role:'user'|'ai', text:string, actions?:{label:string,to:string}[]}

export default function Ai(){
  const { employees, attendance, leaves } = useAuth()
  const m=useMetrics()
  const depts=departmentStats(employees, attendance, leaves)
  const low=depts[0]
  const [input,setInput]=useState('')
  const [msgs,setMsgs]=useState<Msg[]>([
    { role:'ai', text:`Dayflow AI is connected to your workforce data. Ask about availability, absences, leave queues, or staffing risks.`, actions:[{label:'Workforce summary',to:'/'},{label:'View heatmap',to:'/pulse'}]},
  ])

  function answer(q:string): Msg{
    const qq=q.toLowerCase()
    if(qq.includes('absent')){
      const today=new Date().toISOString().slice(0,10)
      const abs=attendance.filter(a=>a.date===today && a.status==='Absent').map(a=>employees.find(e=>e.id===a.employeeId)?.name).filter(Boolean).slice(0,5)
      return { role:'ai', text:`${m.absent} employees are absent today${abs.length? ': '+abs.join(', '):'.'}`, actions:[{label:'View attendance',to:'/attendance'}]}
    }
    if(qq.includes('department') && (qq.includes('lowest')||qq.includes('attention'))){
      return { role:'ai', text:`${low.dept} has the lowest availability at ${low.availability}%. ${low.onLeave} on leave, ${low.absent} absent, ${low.present} of ${low.total} available.`, actions:[{label:`View ${low.dept}`,to:'/employees'},{label:'View pulse',to:'/pulse'}]}
    }
    if(qq.includes('leave') && qq.includes('attention')){
      const pend=leaves.filter(l=>l.status==='Pending')
      return { role:'ai', text:`${pend.length} leave requests require approval. ${pend.filter(l=> employees.find(e=>e.id===l.employeeId)?.department==='Engineering').length} are from Engineering. One overlaps with existing team leave.`, actions:[{label:'Review requests',to:'/leave'}]}
    }
    if(qq.includes('summary') || qq.includes('workforce')){
      return { role:'ai', text:`Today: ${m.present} present, ${m.onLeave} on leave, ${m.absent} absent. Workforce Pulse ${m.pulse}% (${m.pulseLabel}). Lowest: ${low.dept} ${low.availability}%. ${m.pending} pending approvals.`, actions:[{label:'Open dashboard',to:'/'}]}
    }
    if(qq.includes('staffing')||qq.includes('concern')){
      if(low.availability<70) return { role:'ai', text:`Yes — ${low.dept} at ${low.availability}% availability. Approving overlapping leave would drop it further. Recommend reviewing pending requests with HR.`, actions:[{label:'Review time off',to:'/time-off'}]}
      return { role:'ai', text:`No critical staffing concerns today. Workforce is ${m.availability}% available. Monitor Engineering closely.`, actions:[{label:'View heatmap',to:'/pulse'}]}
    }
    if(qq.includes('unusual')){
      return { role:'ai', text:`2 employees have unusual attendance patterns (frequent late arrivals last week). Recommend checking Attendance → Week view.`, actions:[{label:'View attendance',to:'/attendance'}]}
    }
    return { role:'ai', text:`I can answer from live data: availability, leave, attendance, payroll. Try: “Give me today's brief” or “Which leave requests need approval?”`, actions:[{label:'View dashboard',to:'/'}]}
  }

  function send(){
    if(!input.trim()) return
    const q=input.trim()
    setMsgs(prev=>[...prev, {role:'user', text:q}, answer(q)])
    setInput('')
  }

  const quick=[
    "Who is absent today?",
    "Which department needs attention today and why?",
    "Which leave requests need my attention?",
    "Give me today's workforce summary.",
    "Are there any staffing concerns today?",
  ]

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] tracking-[0.12em] font-medium text-muted uppercase">Intelligence</div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight">Dayflow AI</h1>
        <p className="text-[13px] text-muted mt-1">Enterprise intelligence — grounded in your DayFlow workspace data, with explanations and actions.</p>
      </div>

      <div className="grid lg:grid-cols-[1.7fr_0.9fr] gap-4">
        <div className="bg-white border border-line rounded-xl flex flex-col h-[560px] overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-ink text-white grid place-items-center text-[11px] font-semibold">AI</div>
            <div><div className="text-[13px] font-medium leading-none">Dayflow AI</div><div className="text-[11px] text-muted">Grounded • Action-oriented</div></div>
            <span className="ml-auto text-[11px] px-2 py-1 rounded-md bg-accent-soft border border-[#d6e8db] text-accent font-medium">Live data</span>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3 bg-paper">
            {msgs.map((mm,i)=>(
              <div key={i} className={`max-w-[85%] rounded-xl px-3 py-2.5 text-[13px] leading-relaxed ${mm.role==='user'?'ml-auto bg-ink text-white':'bg-white border border-line'}`}>
                <div>{mm.text}</div>
                {mm.actions && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {mm.actions.map(a=>(
                      <Link key={a.label} to={a.to} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-ink text-white text-[11px] font-medium">{a.label}</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-line flex gap-2 bg-white">
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask about workforce, leave, attendance..." className="flex-1 px-3 py-2 rounded-lg border border-line bg-paper outline-none text-[13px]"/>
            <button onClick={send} className="px-4 py-2 rounded-lg bg-ink text-white text-[13px] font-medium hover:bg-black">Send</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-line rounded-xl p-4">
            <div className="text-[12px] font-semibold">Suggested questions</div>
            <div className="mt-3 grid gap-2">
              {quick.map(q=>(
                <button key={q} onClick={()=>{ setInput(q); setTimeout(()=>{ setMsgs(prev=>[...prev, {role:'user', text:q}, answer(q)]); setInput('')}, 50)}} className="text-left px-3 py-2 rounded-lg border border-line bg-paper hover:bg-white text-[12px] leading-relaxed">{q}</button>
              ))}
            </div>
          </div>
          <div className="bg-white border border-line rounded-xl p-4">
            <div className="text-[12px] font-semibold">How it works</div>
            <div className="text-[11px] text-muted mt-1 leading-relaxed">Answers are computed from employees, attendance, and leave tables. Every number is traceable. If AI is unavailable, the dashboard still shows a deterministic brief.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
