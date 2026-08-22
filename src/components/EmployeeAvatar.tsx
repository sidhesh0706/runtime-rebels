type AvatarEmployee = { id:string; name:string }

export function EmployeeAvatar({employee,className='w-8 h-8'}:{employee:AvatarEmployee;className?:string}){
  const numeric=Number(employee.id.replace(/\D/g,''))
  const fallback=[...employee.name].reduce((total,char)=>total+char.charCodeAt(0),0)
  const index=((Number.isFinite(numeric)&&numeric>0?numeric-1001:fallback)%48+48)%48
  const column=index%6
  const row=Math.floor(index/6)
  return <span role="img" aria-label={`${employee.name} profile photo`} title={employee.name} className={`${className} inline-block shrink-0 rounded-full border border-line bg-paper bg-no-repeat shadow-sm`} style={{backgroundImage:"url('/assets/employee-portraits-v1.png')",backgroundSize:'600% 800%',backgroundPosition:`${column*20}% ${row*(100/7)}%`}}/>
}
