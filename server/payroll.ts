export type SalaryComponent={id:string;name:string;type:'Fixed'|'Percent of Wage'|'Percent of Basic'|'Remainder';value:number}
export type PayrollConfig={components?:SalaryComponent[];pfEmployeePercent?:number;pfEmployerPercent?:number;professionalTax?:number}

const defaultComponents:SalaryComponent[]=[
  {id:'basic',name:'Basic Salary',type:'Percent of Wage',value:50},
  {id:'hra',name:'House Rent Allowance',type:'Percent of Basic',value:50},
  {id:'standard',name:'Standard Allowance',type:'Fixed',value:4167},
  {id:'performance',name:'Performance Bonus',type:'Percent of Wage',value:8.33},
  {id:'lta',name:'Leave Travel Allowance',type:'Percent of Wage',value:8.33},
  {id:'fixed',name:'Fixed Allowance',type:'Remainder',value:0},
]

export function payrollForWage(employeeId:string,wage:number,month=new Date().toISOString().slice(0,7),payableDays=22,workingDays=22,config:PayrollConfig={}){
  const customComponents=Boolean(config.components?.length)
  const components=(customComponents?config.components!:defaultComponents).map(component=>({...component,value:Number(component.value)||0}))
  const basicDefinition=components.find(component=>component.id==='basic'||component.name==='Basic Salary')||defaultComponents[0]
  const compute=(component:SalaryComponent,basic:number)=>component.type==='Fixed'?component.value:component.type==='Percent of Basic'?basic*component.value/100:component.type==='Percent of Wage'?wage*component.value/100:0
  const basic=Math.max(0,Math.round(compute(basicDefinition,0)))
  const amounts=new Map<string,number>()
  for(const component of components){
    if(component===basicDefinition)amounts.set(component.id,Math.min(wage,basic))
    else if(component.type!=='Remainder'){
      const calculated=Math.max(0,Math.round(compute(component,basic)))
      const already=Array.from(amounts.values()).reduce((sum,value)=>sum+value,0)
      amounts.set(component.id,customComponents?calculated:Math.min(calculated,Math.max(0,wage-already)))
    }
  }
  const nonRemainder=Array.from(amounts.values()).reduce((sum,value)=>sum+value,0)
  if(nonRemainder>wage)throw new Error('Salary components cannot exceed the monthly wage')
  const remainder=components.find(component=>component.type==='Remainder'||component.id==='fixed')
  if(remainder)amounts.set(remainder.id,Math.max(0,wage-nonRemainder))
  const amount=(id:string,name:string)=>amounts.get(components.find(component=>component.id===id||component.name===name)?.id||'')||0
  const hra=amount('hra','House Rent Allowance')
  const standardAllowance=amount('standard','Standard Allowance')
  const performanceBonus=amount('performance','Performance Bonus')
  const lta=amount('lta','Leave Travel Allowance')
  const fixedAllowance=amount('fixed','Fixed Allowance')
  const pfEmployeePercent=config.pfEmployeePercent??12
  const pfEmployerPercent=config.pfEmployerPercent??12
  const pfEmployee=Math.round(basic*pfEmployeePercent/100)
  const pfEmployer=Math.round(basic*pfEmployerPercent/100)
  const ratio=Math.min(1,Math.max(0,payableDays/workingDays))
  const gross=Math.round(wage*ratio)
  const professionalTax=Math.min(config.professionalTax??200,Math.max(0,gross-pfEmployee))
  const deductions=Math.min(gross,pfEmployee+professionalTax)
  const net=Math.max(0,gross-deductions)
  return {employeeId,month,wage,base:basic,hra,standardAllowance,performanceBonus,lta,fixedAllowance,pfEmployee,pfEmployer,professionalTax,payableDays,workingDays,gross,deductions,net,components:components.map(component=>({...component,computed:amounts.get(component.id)||0}))}
}
