import{u as z,a as J,r as o,j as e,g as Y,d as Z}from"./index-1cp8W1EB.js";import{A as ee}from"./AppLayout-lDA5Fy-O.js";import{u as ae,i as te,h as ie,f as ne,a as oe,e as re,b as se,c as le,j as ce,k as de,l as me,m as ue}from"./useAgentStream-BG7xUIEq.js";import{g as pe}from"./errorUtils-COCPCau8.js";import"./Button-nzyE8n7V.js";const f=[{id:"ecommerce",name:"E-commerce Pipeline",english:"When a new order comes in, check our inventory. If we have the items, review the customer's history for fraud. If the score is higher than 80, ask a human to approve. Otherwise, charge the card and tell the warehouse.",xml:`<?xml version='1.0' encoding='utf-8'?>
<PLAN Key="EcommerceOrderProcessor" Topic="E-commerce Order Processing" Goal="Process customer orders">

  <AGENT Name="OrderIntake">
    <FETCH Key="receiveOrder" From="api://orders/new" Query="Status=unprocessed" SaveAs="Order" />
    <FETCH Key="checkInventory" From="api://inventory/check" Query="Items={Order.items}" SaveAs="Stock" />
    <BRANCH Decision="Stock.available">
      <PATH When="true" GoTo="FraudCheck" />
      <PATH When="false" GoTo="CancelOrder" />
    </BRANCH>
  </AGENT>

  <AGENT Name="FraudCheck">
    <FETCH Key="getHistory" From="api://customers/history" Query="Email={Order.email}" SaveAs="History" />
    <THINK Key="analyzeRisk" About="Analyze {Order} against {History}" SaveAs="Risk" />
    <BRANCH Decision="Risk.score">
      <PATH When="> 80" GoTo="ManualReview" />
      <PATH When="<= 80" GoTo="Payment" />
    </BRANCH>
  </AGENT>

  <AGENT Name="ManualReview">
    <ASK Key="fraudReview" Prompt="High risk order ({Risk.score}). Approve?" Options="Approve,Reject" SaveAs="Decision" />
    <BRANCH Decision="Decision">
      <PATH When="Approve" GoTo="Payment" />
      <PATH When="Reject" GoTo="CancelOrder" />
    </BRANCH>
  </AGENT>

  <AGENT Name="Payment">
    <ACT Key="chargeCard" Action="Execute" To="api://payments/capture" Params="Amount={Order.total}" SaveAs="Status" />
    <ACT Key="notifyWarehouse" Action="Create" To="api://warehouse/picklist" Params="Items={Order.items}" />
    <DONE Summary="Order Processed" />
  </AGENT>

</PLAN>`},{id:"support",name:"Support Routing",english:"When a Zendesk ticket arrives, check if the customer is an Enterprise client. If they are, analyze the sentiment of the message. If it's negative, alert the Account Manager on Slack immediately. Otherwise, route it to the standard support queue.",xml:`<?xml version='1.0' encoding='utf-8'?>
<PLAN Key="SupportTriage" Topic="Ticket Routing" Goal="Route support tickets based on tier and sentiment">

  <AGENT Name="TicketIntake">
    <FETCH Key="pollZendesk" From="api://zendesk/tickets" Query="Status=new" SaveAs="Ticket" />
    <FETCH Key="checkCRM" From="api://salesforce/account" Query="Email={Ticket.email}" SaveAs="ClientData" />
    
    <BRANCH Decision="ClientData.Tier">
      <PATH When="Enterprise" GoTo="VIPAnalysis" />
      <PATH When="*" GoTo="StandardQueue" />
    </BRANCH>
  </AGENT>

  <AGENT Name="VIPAnalysis">
    <THINK Key="sentimentCheck" About="Analyze sentiment of {Ticket.body}" SaveAs="Sentiment" />
    
    <BRANCH Decision="Sentiment.Type">
      <PATH When="Negative" GoTo="EscalateToAM" />
      <PATH When="*" GoTo="VIPQueue" />
    </BRANCH>
  </AGENT>

  <AGENT Name="EscalateToAM">
    <ACT Key="slackAlert" Action="Send" To="api://slack/message" Params="Channel=@{ClientData.AccountManager},Message='Urgent: {Ticket.subject}'" />
    <DONE Summary="Escalated to Account Manager" />
  </AGENT>

</PLAN>`},{id:"onboarding",name:"IT Onboarding",english:"When a new hire is added to Workday, send a request to IT to provision a Macbook. Then, wait for up to 3 days until the laptop is shipped. Once shipped, generate a welcome email draft and ask the Hiring Manager to review and send it.",xml:`<?xml version='1.0' encoding='utf-8'?>
<PLAN Key="EmployeeOnboarding" Topic="New Hire Provisioning" Goal="Setup hardware and welcome communications">

  <AGENT Name="ITProvisioning">
    <FETCH Key="newHireData" From="api://workday/hires" Query="Status=onboarding" SaveAs="Employee" />
    <ACT Key="orderLaptop" Action="Create" To="api://it/hardware/request" Params="Type=MacbookPro,User={Employee.id}" SaveAs="Request" />
    
    <WATCH Key="waitForShipping" Measure="{Request.status}" Threshold="Shipped" Interval="3600" Duration="259200" SaveAs="ShipmentStatus" OnFail="warn" />
    
    <BRANCH Decision="ShipmentStatus">
      <PATH When="Shipped" GoTo="WelcomeEmailDrafting" />
      <PATH When="*" GoTo="Escalation" />
    </BRANCH>
  </AGENT>

  <AGENT Name="WelcomeEmailDrafting">
    <THINK Key="draftEmail" About="Write welcome email for {Employee.name} starting on {Employee.startDate}." SaveAs="EmailDraft" />
    
    <ASK Key="managerApproval" Prompt="Review Welcome Email for {Employee.name}" From="EmailDraft" InputType="textarea" Approver="{Employee.managerId}" RequireApproval="true" SaveAs="FinalEmail" />
    
    <ACT Key="sendWelcome" Action="Send" To="email://{Employee.email}" Params="Body={FinalEmail},Subject='Welcome aboard!'" />
    <DONE Summary="Onboarding complete" />
  </AGENT>

</PLAN>`},{id:"helpdesk",name:"Helpdesk Automation",english:"Whenever someone joins the #it-helpdesk slack channel and asks about a password reset, look up their email in Okta. If their account is locked, unlock it and send them a temporary password via DM. If it's not locked, just point them to the wiki article.",xml:`<?xml version='1.0' encoding='utf-8'?>
<PLAN Key="HelpdeskPasswordReset" Topic="IT Support" Goal="Automate password reset requests via Slack">

  <AGENT Name="SlackListener">
    <FETCH Key="listenChannel" From="api://slack/channels" Query="Channel=#it-helpdesk,Intent=password_reset" SaveAs="Message" />
    <FETCH Key="checkOkta" From="api://okta/users" Query="Email={Message.userEmail}" SaveAs="OktaUser" />
    
    <BRANCH Decision="OktaUser.Status">
      <PATH When="LOCKED_OUT" GoTo="UnlockAccount" />
      <PATH When="ACTIVE" GoTo="SendWikiArticle" />
    </BRANCH>
  </AGENT>

  <AGENT Name="UnlockAccount">
    <ACT Key="unlockOkta" Action="Update" To="api://okta/users/{OktaUser.id}" Params="Status=ACTIVE" />
    <ACT Key="generateTempPass" Action="Execute" To="api://okta/users/{OktaUser.id}/lifecycle/reset_password" SaveAs="TempPass" />
    <ACT Key="dmUser" Action="Send" To="api://slack/directMessage" Params="User={Message.userId},Text='I unlocked your account. Temp password: {TempPass.value}'" />
    <DONE Summary="Account unlocked and password sent" />
  </AGENT>

</PLAN>`},{id:"invoice",name:"Overdue Invoices",english:"Every Friday at 9am, pull a list of all invoices from Stripe that are more than 15 days overdue. For each one, draft a polite reminder email. If the total is over $10,000, don't send the email automatically—ask the VP of Finance to approve it first.",xml:`<?xml version='1.0' encoding='utf-8'?>
<PLAN Key="OverdueInvoiceChaser" Topic="Finance Automation" Goal="Chase overdue Stripe invoices">

  <AGENT Name="CronTrigger">
    <FETCH Key="getStripeInvoices" From="api://stripe/invoices" Query="Status=overdue,Days>15" SaveAs="OverdueInvoices" />
    <ACT Key="loopInvoices" Action="Iterate" To="ProcessInvoiceAgent" Params="List={OverdueInvoices}" />
  </AGENT>

  <AGENT Name="ProcessInvoiceAgent">
    <THINK Key="draftReminder" About="Write polite collection email for invoice {CurrentItem.id}" SaveAs="DraftEmail" />
    <BRANCH Decision="CurrentItem.total">
      <PATH When="> 10000" GoTo="VPApproval" />
      <PATH When="<= 10000" GoTo="SendReminder" />
    </BRANCH>
  </AGENT>

  <AGENT Name="VPApproval">
    <ASK Key="approveLargeInvoiceEmail" Prompt="Approve collection email for {CurrentItem.customerName} (\${CurrentItem.total})?" From="DraftEmail" Approver="vp.finance@company.com" SaveAs="Decision" />
    <BRANCH Decision="Decision">
      <PATH When="Approve" GoTo="SendReminder" />
      <PATH When="Reject" GoTo="EndProcess" />
    </BRANCH>
  </AGENT>

</PLAN>`},{id:"legal",name:"Contract Reviewer",english:"When a new PDF is uploaded to the 'Draft Contracts' Google Drive folder, read the document. Find the 'governing law' clause. If it says anything other than Delaware or New York, flag the document and assign a review task to the legal team in Asana.",xml:`<?xml version='1.0' encoding='utf-8'?>
<PLAN Key="LegalContractTriage" Topic="Legal Review" Goal="Triage draft contracts via Google Drive">

  <AGENT Name="DriveListener">
    <FETCH Key="watchFolder" From="api://gdrive/folders/Draft-Contracts" Query="Event=Upload" SaveAs="Document" />
    <THINK Key="extractClause" About="Read {Document.fileUrl} and extract 'governing law' clause" SaveAs="ExtractedClause" />
    
    <BRANCH Decision="ExtractedClause.State">
      <PATH When="Delaware" GoTo="MarkSafe" />
      <PATH When="New York" GoTo="MarkSafe" />
      <PATH When="*" GoTo="EscalateLegal" />
    </BRANCH>
  </AGENT>

  <AGENT Name="EscalateLegal">
    <ACT Key="createAsanaTask" Action="Create" To="api://asana/tasks" Params="Project=LegalReview,Title='Flagged Contract: {Document.name}',Notes='Governing law is {ExtractedClause.State}'" />
    <DONE Summary="Task created for legal review" />
  </AGENT>

</PLAN>`},{id:"sre",name:"Website Auto-Fixer",english:"Monitor the Datadog API for our main checkout service. If the error rate goes above 5% for more than 2 minutes, automatically restart the Kubernetes pods. If that doesn't fix it within 5 minutes, page the on-call engineer via PagerDuty.",xml:`<?xml version='1.0' encoding='utf-8'?>
<PLAN Key="CheckoutAutoFix" Topic="SRE Automation" Goal="Auto-remediate checkout service errors">

  <AGENT Name="DatadogMonitor">
    <FETCH Key="checkErrorRate" From="api://datadog/metrics" Query="Metric=checkout.errors,Window=2m" SaveAs="Metrics" />
    <BRANCH Decision="Metrics.rate">
      <PATH When="> 5" GoTo="RestartPods" />
      <PATH When="<= 5" GoTo="HealthyEnd" />
    </BRANCH>
  </AGENT>

  <AGENT Name="RestartPods">
    <ACT Key="k8sRollout" Action="Execute" To="api://kubernetes/deployments/checkout/restart" />
    <WATCH Key="verifyHealth" Measure="api://datadog/metrics?Metric=checkout.errors" Threshold="< 1" Interval="60" Duration="300" SaveAs="RecoveryStatus" OnFail="Escalate" />
    <BRANCH Decision="RecoveryStatus">
      <PATH When="Failed" GoTo="PageEngineer" />
      <PATH When="Success" GoTo="HealthyEnd" />
    </BRANCH>
  </AGENT>

  <AGENT Name="PageEngineer">
    <ACT Key="triggerPD" Action="Create" To="api://pagerduty/incidents" Params="Service=Checkout,Urgency=High,Title='Checkout error rate > 5% and auto-restart failed'" />
    <DONE Summary="Escalated to PagerDuty" />
  </AGENT>

</PLAN>`},{id:"sales",name:"Cold Lead Reactivator",english:"Look at our HubSpot CRM. Find any leads that we haven't spoken to in 6 months but who have visited our pricing page this week. Draft a personalized email mentioning they were looking at pricing, but ask me before sending them out.",xml:`<?xml version='1.0' encoding='utf-8'?>
<PLAN Key="LeadReactivator" Topic="Sales Automation" Goal="Draft emails for warm, inactive leads">

  <AGENT Name="LeadFinder">
    <FETCH Key="queryHubspot" From="api://hubspot/contacts" Query="LastContactDays>180,RecentPageVisit=pricing" SaveAs="HotLeads" />
    <ACT Key="iterateLeads" Action="Iterate" To="DraftEmailAgent" Params="List={HotLeads}" />
  </AGENT>

  <AGENT Name="DraftEmailAgent">
    <THINK Key="draftPersonalized" About="Draft friendly email for {CurrentItem.name} mentioning their recent visit to our pricing page." SaveAs="EmailDraft" />
    <ASK Key="reviewDraft" Prompt="Review outbound email for {CurrentItem.name}" From="EmailDraft" Approver="{System.currentUser}" SaveAs="FinalEmail" />
    <BRANCH Decision="FinalEmail">
      <PATH When="Approved" GoTo="SendEmail" />
      <PATH When="Rejected" GoTo="SkipLead" />
    </BRANCH>
  </AGENT>

</PLAN>`},{id:"hr",name:"HR Expense Auditor",english:"When an expense report is filed in Expensify, check the meal receipts. If any single dinner receipt is over $150, look up the employee's level in Workday. If they are a Director or above, approve it. If they are below, route it to their manager for manual review.",xml:`<?xml version='1.0' encoding='utf-8'?>
<PLAN Key="ExpenseAuditor" Topic="HR Compliance" Goal="Audit high-value meal expenses">

  <AGENT Name="ExpenseIntake">
    <FETCH Key="getExpense" From="api://expensify/reports" Query="Status=submitted" SaveAs="Report" />
    <THINK Key="checkMeals" About="Find meal receipts > $150 in {Report}" SaveAs="FlaggedMeals" />
    <BRANCH Decision="FlaggedMeals.length">
      <PATH When="> 0" GoTo="CheckSeniority" />
      <PATH When="0" GoTo="AutoApprove" />
    </BRANCH>
  </AGENT>

  <AGENT Name="CheckSeniority">
    <FETCH Key="getWorkdayProfile" From="api://workday/employees" Query="Email={Report.employeeEmail}" SaveAs="EmployeeInfo" />
    <BRANCH Decision="EmployeeInfo.Level">
      <PATH When="Director" GoTo="AutoApprove" />
      <PATH When="VP" GoTo="AutoApprove" />
      <PATH When="C-Suite" GoTo="AutoApprove" />
      <PATH When="*" GoTo="ManagerReview" />
    </BRANCH>
  </AGENT>

  <AGENT Name="ManagerReview">
    <ASK Key="flagManager" Prompt="Pls review out-of-policy meal expense for {Report.employeeName}" Approver="{EmployeeInfo.ManagerEmail}" />
    <DONE Summary="Routed to manager" />
  </AGENT>

</PLAN>`},{id:"marketing",name:"Social Media Triage",english:"Listen to Twitter for mentions of our brand. When a tweet is negative and has more than 100 followers, create a high-priority ticket in Jira. If it's positive, just drop it in the #marketing-kudos Slack channel.",xml:`<?xml version='1.0' encoding='utf-8'?>
<PLAN Key="SocialTriage" Topic="Brand Monitoring" Goal="Triage brand mentions on social media">

  <AGENT Name="SocialListener">
    <FETCH Key="pollTwitter" From="api://twitter/mentions" Query="Query=@OurBrand" SaveAs="Tweet" />
    <THINK Key="analyzeTweet" About="Determine sentiment of {Tweet.text}" SaveAs="Sentiment" />
    <BRANCH Decision="Sentiment">
      <PATH When="Negative" GoTo="CheckFollowers" />
      <PATH When="Positive" GoTo="SlackKudos" />
    </BRANCH>
  </AGENT>

  <AGENT Name="CheckFollowers">
    <BRANCH Decision="Tweet.user.followers">
      <PATH When="> 100" GoTo="JiraTicket" />
      <PATH When="<= 100" GoTo="Ignore" />
    </BRANCH>
  </AGENT>

  <AGENT Name="JiraTicket">
    <ACT Key="createJira" Action="Create" To="api://jira/issues" Params="Project=PR,Priority=High,Summary='Negative PR: {Tweet.url}'" />
    <DONE Summary="Jira ticket created" />
  </AGENT>

</PLAN>`}];function ve({kind:S="agentic"}){const{tenantSlug:s}=z(),K=J(),h=S==="procedural",A=h?"Procedural":"Agentic",j=h?"/plans/agent/author-procedural":"/plans/agent/author",W=h?"procedural-studio":"studio",C=h?"Procedural Studio":"Studio",k=h?"procedural-copilot":"agentic-copilot",L=`${A} Copilot`,[M,O]=o.useState(f[0]),[v,P]=o.useState(f[0].english),[x,y]=o.useState([]),[r,T]=o.useState(""),[H,l]=o.useState(""),[n,c]=o.useState("idle"),[E,N]=o.useState(null),[G,w]=o.useState(!1),d=ae(),B=t=>{d.isStreaming||(O(t),P(t.english),T(""),l(""),y([]),N(null),c("idle"))},R=o.useCallback((t,a,u)=>{s&&(y([]),T(""),l(""),N(null),c(u),d.start({path:`/t/${s}${t}`,body:a,surface:k,onEvent:i=>y(p=>[...p,i]),onDone:i=>{c("done"),N(i),i.xml&&T(i.xml);const p=i.remainingIssueCount;i.reason?l(p?`${i.reason} (${p} issue(s) remaining)`:i.reason):p&&l(`${p} issue(s) remaining after stream completion.`)},onError:i=>{c("done"),l(i),N(null)}}))},[d,k,s]),D=()=>R(j,{intent:v},"generating"),$=()=>R("/plans/agent/fix",{xml:r,kind:S},"fixing"),Q=()=>{d.stop(),c("done")},U=async()=>{if(!(!s||!r.trim()||G)){w(!0);try{const a=await Y().createPlan(s,new Z({name:`Copilot Draft ${new Date().toLocaleString()}`,kind:A,contentXml:r}));if(!a.planId)throw new Error("Plan was created without an ID.");K(`/t/${s}/app/${W}/${a.planId}`)}catch(t){l(pe(t,`Failed to open generated plan in ${C}.`))}finally{w(!1)}}},V=(()=>{for(let t=x.length-1;t>=0;t--){const a=x[t];if(te(a))return`Agent: ${a.agentName}`;if(ie(a))return`Progress: iteration ${a.iteration}/${a.maxIterations}${typeof a.remainingValidationIssues=="number"?` • ${a.remainingValidationIssues} issue(s) remaining`:""}`;if(ne(a))return`Warning: ${a.message}`;if(oe(a))return`Tool: ${a.toolName}`;if(re(a))return a.chunk.slice(0,80);if(se(a))return`Draft iteration ${a.iteration}…`;if(le(a)){const u=ce(a)[0];if(u){const i=[u.severity,u.code].filter(Boolean).join("/");return`Fixing: ${i?`${i}: `:""}${u.message}`}return`Fixing: ${de(a)[0]??"validation error"}`}if(me(a))return"Done ✓";if(ue(a))return`Stopped: ${a.reason}`}return n==="generating"?"Starting…":n==="fixing"?"Fixing…":""})(),m=d.isStreaming,g=n==="done"&&!!r,I=!m&&(n==="generating"||n==="fixing")&&!r,X=(n==="done"||I)&&!r,b=g&&!!E?.reason,q=b?"Best Effort":g?"Validated":"Engine Rule",F=b?H||"Stream ended early. Review the best-effort XML before using it.":E?.remainingIssueCount?`${E.remainingIssueCount} issue(s) still remain in the generated output.`:"",_=H||d.error||(I?"Generation ended without XML or a structured error response.":"Generation did not produce a valid plan.");return e.jsx(ee,{children:e.jsxs("div",{className:"playground-container fade-in",children:[e.jsxs("header",{className:"playground-header",children:[e.jsxs("div",{className:"header-titles",children:[e.jsx("h1",{children:L}),e.jsxs("p",{children:["Describe your workflow in plain English, and watch the cymoth engine translate it into a reliable, enterprise-grade ",A.toLowerCase()," XML plan."]})]}),e.jsx("div",{className:"header-actions",children:m?e.jsxs("button",{className:"cymoth-btn secondary",onClick:Q,children:[e.jsx("span",{className:"material-icons-outlined",children:"stop_circle"})," Stop"]}):e.jsxs(e.Fragment,{children:[g&&e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"cymoth-btn secondary",onClick:$,children:[e.jsx("span",{className:"material-icons-outlined",children:"build"})," Fix"]}),e.jsxs("button",{className:"cymoth-btn secondary",onClick:U,disabled:G,children:[e.jsx("span",{className:"material-icons-outlined",children:"design_services"})," Open in ",C]})]}),e.jsxs("button",{className:"cymoth-btn primary",onClick:D,disabled:v.trim()==="",children:[e.jsx("span",{className:"material-icons-outlined",children:"auto_awesome"}),"Generate XML"]})]})})]}),e.jsxs("div",{className:"template-selector",children:[e.jsx("span",{className:"template-label",children:"English Templates:"}),f.map(t=>e.jsx("button",{className:`template-chip ${M.id===t.id?"active":""}`,onClick:()=>B(t),children:t.name},t.id))]}),e.jsxs("div",{className:"playground-workspace",children:[e.jsxs("div",{className:"workspace-panel left-panel",children:[e.jsxs("div",{className:"panel-header",children:[e.jsx("span",{className:"panel-title",children:"1. Plain English Input"}),e.jsx("span",{className:"panel-badge",children:"Human"})]}),e.jsxs("div",{className:"panel-body",children:[e.jsx("textarea",{className:"english-textarea",value:v,onChange:t=>{P(t.target.value),n==="done"&&(T(""),c("idle"))},placeholder:"Describe what you want the agent to do...",disabled:m}),m&&e.jsxs("div",{className:"pg-live-status",children:[e.jsx("span",{className:"material-icons-outlined spin",children:"sync"}),e.jsx("span",{className:"pg-live-text",children:V})]})]})]}),e.jsx("div",{className:"workspace-divider",children:e.jsx("div",{className:"divider-icon material-icons-outlined",children:"arrow_forward"})}),e.jsxs("div",{className:"workspace-panel right-panel",children:[e.jsxs("div",{className:"panel-header",children:[e.jsxs("span",{className:"panel-title",children:["2. ",A," XML Output"]}),e.jsx("span",{className:`panel-badge ${g?"engine":""}`,children:q})]}),e.jsxs("div",{className:`panel-body ${m?"generating":""}`,children:[m&&e.jsxs("div",{className:"generation-overlay",children:[e.jsx("span",{className:"material-icons-outlined spin",children:"sync"}),e.jsx("p",{children:n==="fixing"?"Fixing plan…":"Compiling logic to deterministic XML…"})]}),g&&e.jsxs(e.Fragment,{children:[F&&e.jsxs("div",{className:"pg-live-status",style:{marginBottom:12},children:[e.jsx("span",{className:"material-icons-outlined",children:"info"}),e.jsx("span",{className:"pg-live-text",children:F})]}),e.jsx("pre",{className:"xml-preview fade-in",children:e.jsx("code",{children:r})})]}),X&&e.jsxs("div",{className:"pg-error-state",children:[e.jsx("span",{className:"material-icons-outlined",children:"error_outline"}),e.jsx("p",{children:_}),e.jsx("button",{className:"cymoth-btn secondary",onClick:D,children:"Try Again"})]}),n==="idle"&&e.jsxs("div",{className:"empty-state",children:[e.jsx("div",{className:"material-icons-outlined placeholder-icon",children:"code_off"}),e.jsxs("p",{className:"placeholder-text",children:['Click "Generate XML" to compile your English text into ',A," XML."]})]})]})]})]})]})})}export{ve as CopilotPage,ve as default};
