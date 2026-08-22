type AvatarEmployee = { id:string; name:string; gender?:string }

const femaleNames=new Set([
  'isha','maya','kavya','sara','pooja','divya','tanvi','anjali','olivia','ananya','priya','sneha','neha','zara','ava','isabella','sophia','charlotte','amelia','evelyn','harper','abigail','shriya',
])

function isFemale(employee:AvatarEmployee){
  if(employee.gender)return employee.gender.toLowerCase()==='female'
  return femaleNames.has(employee.name.trim().split(/\s+/)[0].toLowerCase())
}

export function EmployeeAvatar({employee,className='w-8 h-8'}:{employee:AvatarEmployee;className?:string}){
  const female=isFemale(employee)
  return (
    <span role="img" aria-label={`${employee.name} ${female?'female':'male'} avatar`} title={employee.name} className={`${className} inline-grid shrink-0 place-items-center overflow-hidden rounded-full border border-[#d9d5cf] bg-[#f2f0ec] text-[#555b61] shadow-sm`}>
      <svg viewBox="0 0 64 64" aria-hidden="true" className="w-full h-full">
        <circle cx="32" cy="25" r="12" fill="#8b9299"/>
        {female ? <path d="M18 27c0-13 6-21 14-21s14 8 14 21c-3-3-5-7-6-11-5 6-12 9-21 10l-1 1Z" fill="#444a50"/> : <path d="M20 21c1-10 6-15 13-15 7 0 12 5 13 14-8-5-17-5-26 1Z" fill="#444a50"/>}
        <circle cx="27" cy="25" r="1.3" fill="#34383c"/><circle cx="37" cy="25" r="1.3" fill="#34383c"/>
        <path d="M28 31c2 2 6 2 8 0" fill="none" stroke="#555b61" strokeWidth="1.5" strokeLinecap="round"/>
        {female ? <path d="M11 64c1-17 9-25 21-25s20 8 21 25H11Z" fill="#66737d"/> : <path d="M9 64c2-16 10-24 23-24s21 8 23 24H9Z" fill="#66737d"/>}
        <path d="M26 40l6 8 6-8" fill="#ece9e4"/>
      </svg>
    </span>
  )
}
