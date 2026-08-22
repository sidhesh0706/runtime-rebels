# DayFlow Requirements and Acceptance Checklist

This file is the implementation source of truth for the DayFlow base build.

Sources:

- Problem statement: `C:\Users\Sidhesh\Downloads\probstatement.pdf`
- Detailed workflow board: https://app.excalidraw.com/l/65VNwvy7c4X/58RLEJ4oOwh

The PDF defines the mandatory scope. The Excalidraw board supplies the detailed UI,
workflow, field, and calculation behavior. A feature is not complete until its
acceptance checks below pass for both the UI and server-side authorization.

## Decisions where the sources differ

- The public sign-up form creates the first company administrator and captures the
  company name and logo. Normal employees cannot self-assign an HR role.
- HR/Admin provisions employee accounts. The employee receives a generated login ID
  and temporary password and must change that password on first login.
- Employees receive a read-only payroll/payslip view. The detailed Salary Info
  configuration tab is visible and editable only to HR/Admin.
- Other employees' directory profiles are view-only and expose only safe workplace
  information. Private, bank, document, and salary data remain protected.

## P0 - Authentication and onboarding

- [ ] Company administrator can sign up with company name, name, email, phone,
      password, password confirmation, and company logo.
- [ ] Password fields have show/hide controls and enforce password-strength rules.
- [ ] Email verification is required before the first normal session.
- [ ] Users can sign in with login ID or email plus password.
- [ ] Incorrect credentials and unverified accounts receive clear error messages.
- [ ] Successful sign-in redirects to the employee directory/dashboard.
- [ ] The avatar menu contains **My Profile** and **Log Out**.
- [ ] HR/Admin can create an employee; normal employees cannot self-register or
      choose an elevated role.
- [ ] Employee login IDs are generated from company code, employee initials, joining
      year, and that year's serial number (for example `OITODO20230001`).
- [ ] A unique temporary password is generated for a new employee.
- [ ] A new employee is forced to replace the temporary password on first login.
- [ ] Employee ID, login ID, and email are unique and validated server-side.

## P0 - Roles and authorization

- [ ] Supported roles are `admin`, `hr`, and `employee`.
- [ ] Employees can read and edit only the explicitly permitted parts of their own
      records.
- [ ] HR/Admin can manage employee, attendance, leave, and salary records.
- [ ] Protected data stays protected when a user changes a URL or sends a crafted API
      request; hiding a button is not considered authorization.
- [ ] Salary, bank, private profile, and document access is logged.
- [ ] Approval, rejection, salary change, and employee update actions create audit
      records containing actor, action, target, and timestamp.

## P0 - Application shell and employee directory

- [ ] Primary navigation shows company logo, **Employees**, **Attendance**, and
      **Time Off**.
- [ ] The post-login landing page shows an employee card directory.
- [ ] Each card shows the employee's photo, name, basic job information, and work
      status.
- [ ] Status indicators are: green dot for present, airplane for approved leave, and
      yellow dot for absent without approved time off.
- [ ] Cards open a safe, view-only employee information page.
- [ ] Directory search works by employee name, ID, department, and job title.
- [ ] **New Employee** is visible only to HR/Admin.
- [ ] The employee dashboard also exposes profile, attendance, leave, logout, recent
      activity, alerts, and relevant quick totals.
- [ ] Empty, loading, success, and error states are designed and readable.

## P0 - Profile management

- [ ] My Profile displays photo, name, login ID, job position, email, mobile,
      company, department, manager, and location.
- [ ] Resume tab contains About, What I Love About My Job, Interests and Hobbies,
      Skills, and Certifications.
- [ ] Skills and certifications can be added and removed with validation.
- [ ] Private Info contains date of birth, residential/mailing address, nationality,
      personal email, gender, marital status, and joining date.
- [ ] Bank details contain account number, bank name, IFSC code, PAN, UAN, and
      employee code.
- [ ] Documents and profile picture are viewable according to role permissions.
- [ ] Employees can edit only address, mobile/phone, profile photo, and other fields
      explicitly marked employee-editable.
- [ ] HR/Admin can edit all employee fields.
- [ ] Security tab supports password change and first-login password replacement.
- [ ] Detailed Salary Info configuration is visible only to HR/Admin.

## P0 - Attendance

- [ ] A red/offline attendance indicator is shown before check-in.
- [ ] Check-in records the timestamp and changes the indicator to green.
- [ ] After check-in, the systray shows elapsed time and a **Check Out** action.
- [ ] Check-out records the timestamp and calculates work hours and extra hours.
- [ ] Invalid sequences are blocked: duplicate check-in, check-out before check-in,
      and multiple open sessions.
- [ ] Attendance states include Present, Absent, Half-day, and Leave.
- [ ] Employees can see only their own daily, weekly, and current-month attendance.
- [ ] Employee attendance shows date, check-in, check-out, work hours, extra hours,
      days present, leave count, and total working days.
- [ ] Previous/next period and month controls work.
- [ ] HR/Admin list view supports search, date/day filters, and employee switching.
- [ ] HR/Admin attendance lists employee, check-in, check-out, work hours, and extra
      hours.
- [ ] Configured breaks and working schedule are used in work-hour calculations.
- [ ] Approved leave immediately changes the corresponding attendance state.

## P0 - Time off and leave approvals

- [ ] Time-off dashboard shows paid and sick leave balances.
- [ ] An annual calendar shows employee leave, request states, and public holidays.
- [ ] Leave types include Paid Time Off, Sick Leave, and Unpaid Leave.
- [ ] New request captures employee, type, start/end date, calculated allocation,
      remarks, and optional attachment.
- [ ] A sick-leave certificate can be attached and securely stored.
- [ ] Request states are Pending/To Approve, Approved/Validated, and Rejected/Refused.
- [ ] Employees can view only their own requests and balances.
- [ ] HR/Admin can search and view requests for all employees.
- [ ] HR/Admin can approve or reject from the list and add a comment.
- [ ] Approval/rejection is reflected immediately in employee records and alerts.
- [ ] Requests cannot overlap existing active requests.
- [ ] Paid/sick requests cannot exceed the available balance.
- [ ] Rejection requires a comment; approval records the reviewer and timestamp.
- [ ] Weekend and public-holiday treatment is consistent in allocation calculations.

## P0 - Payroll and salary

- [ ] Employee payroll is read-only and exposes only the logged-in employee's data.
- [ ] HR/Admin can view and update salary data for every employee.
- [ ] Salary setup contains monthly wage, yearly wage, working days per week, break
      time, and working schedule.
- [ ] Salary components include Basic Salary, House Rent Allowance, Standard
      Allowance, Performance Bonus, Leave Travel Allowance, and Fixed Allowance.
- [ ] Each component supports fixed-amount or percentage-based computation.
- [ ] Default/reference calculations from the board are supported:
  - [ ] Basic Salary: 50% of wage.
  - [ ] HRA: 50% of Basic Salary.
  - [ ] Standard Allowance: fixed amount (board example: INR 4,167).
  - [ ] Performance Bonus: 8.33%.
  - [ ] Leave Travel Allowance: 8.33%.
  - [ ] Fixed Allowance: wage minus the other salary components.
- [ ] Component values recalculate automatically when wage or configuration changes.
- [ ] Total salary components cannot exceed the defined wage.
- [ ] Employee PF and employer PF are configurable, with 12% board defaults based on
      Basic Salary.
- [ ] Professional Tax is configurable, with an INR 200 board default.
- [ ] Attendance records determine payable days for payslip generation.
- [ ] Unpaid leave and missing attendance reduce payable days and calculated pay.
- [ ] Employees can view a clear earnings/deductions/net-pay breakdown.
- [ ] HR/Admin edits preserve payroll accuracy and produce audit history.

## P1 - Notifications, analytics, and reports

- [ ] In-app alerts cover account creation, check-in anomalies, leave submission,
      approval/rejection, and salary/payslip availability.
- [ ] Email alerts are sent for account activation and leave decisions.
- [ ] HR dashboard shows present, absent, on-leave, pending approvals, and attendance
      trends.
- [ ] Attendance report can be filtered and exported.
- [ ] Salary slip can be downloaded as a polished PDF.
- [ ] Recent activity timeline links back to the affected record.

## Non-functional acceptance criteria

- [ ] The interface works on laptop and mobile widths without clipped controls.
- [ ] Forms are keyboard usable and have labels, validation, and accessible contrast.
- [ ] All dates and attendance calculations use `Asia/Kolkata` consistently.
- [ ] Mutating actions have pending/disabled states and cannot be double-submitted.
- [ ] Sensitive errors do not expose database, authentication, or storage details.
- [ ] Database constraints protect uniqueness, valid date ranges, non-negative salary
      values, and one open attendance session per employee.
- [ ] Seeded HR and employee demo accounts exercise every role-specific workflow.
- [ ] The production build, database migrations, and seed process are reproducible
      from the README.
- [ ] The latest deploy is generated from `main` and contains no secrets in Git.

## End-to-end acceptance scenario

The base build is ready only when this complete scenario passes:

1. An administrator creates an employee and the system generates a login ID and
   temporary password.
2. The employee logs in, changes the temporary password, and updates permitted
   profile fields.
3. The employee checks in and later checks out; calculated hours appear in both
   employee and HR attendance views.
4. The employee submits sick leave with dates, remarks, and a certificate.
5. HR sees the pending request, reviews it, and approves it with a comment.
6. The employee receives an alert; the annual calendar, balance, and attendance
   record update immediately.
7. Payroll uses attendance and unpaid/missing days to calculate payable days while
   applying the configured salary components, PF, and professional tax.
8. The employee sees only their read-only payslip; HR sees the salary configuration
   and audit trail.

