import{u as Ce,a as Se,r as o,j as e,g as Y,C as xe}from"./index-C1ZuDfIG.js";import{A as ke,g as Pe,G as Ge,l as He}from"./AppLayout-B0JPG7t_.js";import{u as we,h as Z,j as ee,i as be,k as Ie,f as Re,a as je,e as De,b as Fe,c as Ke,l as Le,m as We}from"./useAgentStream-CGYtyCh1.js";import{g as Me}from"./errorUtils-BG0eygap.js";import{J as Oe}from"./JournalSelector-BAmUNUvq.js";import{b as Be,g as $e,a as Qe}from"./groundingConnections-BKoyV7VN.js";import"./Button-BGv74kFi.js";const R=[{id:"ecommerce",name:"E-commerce Pipeline",english:"When a new order comes in, check our inventory. If we have the items, review the customer's history for fraud. If the score is higher than 80, ask a human to approve. Otherwise, charge the card and tell the warehouse.",xml:`<?xml version='1.0' encoding='utf-8'?>
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

</PLAN>`}];function Ye({kind:S="agentic"}){const{tenantSlug:r}=Ce(),ae=Se(),T=S==="procedural",N=T?"Procedural":"Agentic",te=T?"/plans/agent/author-procedural":"/plans/agent/author",ne=T?"procedural-studio":"studio",j=T?"Procedural Studio":"Studio",D=T?"procedural-copilot":"agentic-copilot",oe=`${N} Copilot`,[ie,se]=o.useState(R[0]),[x,F]=o.useState(R[0].english),[K,k]=o.useState([]),[p,g]=o.useState(""),[L,d]=o.useState(""),[l,m]=o.useState("idle"),[P,h]=o.useState(null),[W,M]=o.useState(!1),[f,re]=o.useState([]),[G,O]=o.useState(""),[y,le]=o.useState([]),[H,B]=o.useState([]),[w,ce]=o.useState([]),[u,de]=o.useState([]),[b,$]=o.useState(""),[E,Q]=o.useState(!0),[I,me]=o.useState(!1),A=we();o.useEffect(()=>{if(!r)return;let a=!1;return(async()=>{Q(!0),$("");try{const s=Y(),[n,i]=await Promise.all([s.listConnections(r,void 0),He(r,void 0)]);if(a)return;const z=$e(n||[]),ye=Qe(n||[]);re(z),le(ye),ce(i||[]),O(Ee=>Ee||z[0]?.connectionId||"")}catch{if(a)return;$("Failed to load LLM connections or journals. Copilot grounding options are unavailable until this reloads.")}finally{a||Q(!1)}})(),()=>{a=!0}},[r]),o.useEffect(()=>{if(I)return;const a=Array.from(new Set(w.filter(t=>u.includes(t.journalId||"")).flatMap(t=>t.relatedConnectionIds||[]).filter(t=>y.some(s=>s.connectionId===t))));B(a)},[w,y,I,u]);const ue=a=>{A.isStreaming||(se(a),F(a.english),g(""),d(""),k([]),h(null),m("idle"))},U=o.useCallback((a,t,s)=>{r&&(k([]),g(""),d(""),h(null),m(s),A.start({path:`/t/${r}${a}`,body:t,surface:D,onEvent:n=>{if(k(i=>[...i,n]),Z(n)&&(m("done"),h({xml:n.xml,planId:n.planId??void 0}),g(n.xml),d("")),ee(n)){const i=n;m("done"),h({xml:i.bestEffortXml??void 0,reason:i.reason,code:i.code}),i.bestEffortXml&&g(i.bestEffortXml),i.reason&&d(i.reason)}},onDone:n=>{m("done"),h(n),n.xml&&g(n.xml);const i=n.remainingIssueCount;n.reason?d(i?`${n.reason} (${i} issue(s) remaining)`:n.reason):i&&d(`${i} issue(s) remaining after stream completion.`)},onError:n=>{m("done"),d(n),h(null)}}))},[A,D,r]),V=f.find(a=>a.connectionId===G)?.alias,C=Be(y,H),pe=!!G,X=()=>U(te,{intent:x,kind:S,connectionAlias:V||void 0,journalIds:u.length>0?u:void 0,groundingConnectionAliases:C.length>0?C:void 0},"generating"),ge=()=>U("/plans/agent/fix",{planXml:p,planKind:S,connectionAlias:V||void 0,journalIds:u.length>0?u:void 0,groundingConnectionAliases:C.length>0?C:void 0},"fixing"),he=()=>{A.stop(),m("done")},Ae=async()=>{if(!(!r||!p.trim()||W)){M(!0);try{const t=await Y().createPlan(r,new xe({name:`Copilot Draft ${new Date().toLocaleString()}`,kind:N,contentXml:p}));if(!t.planId)throw new Error("Plan was created without an ID.");ae(`/t/${r}/app/${ne}/${t.planId}`)}catch(a){d(Me(a,`Failed to open generated plan in ${j}.`))}finally{M(!1)}}},Te=(()=>{for(let a=K.length-1;a>=0;a--){const t=K[a];if(be(t))return`Agent: ${t.agentName}`;if(Ie(t))return`Progress: iteration ${t.iteration}/${t.maxIterations}${typeof t.remainingValidationIssues=="number"?` • ${t.remainingValidationIssues} issue(s) remaining`:""}`;if(Re(t))return`Warning: ${t.message}`;if(je(t))return`Tool: ${t.toolName}`;if(De(t))return t.chunk.slice(0,80);if(Fe(t))return`Draft iteration ${t.iteration}…`;if(Ke(t)){const s=Le(t)[0];if(s){const n=[s.severity,s.code].filter(Boolean).join("/");return`Fixing: ${n?`${n}: `:""}${s.message}`}return`Fixing: ${We(t)[0]??"validation error"}`}if(Z(t))return"Done ✓";if(ee(t))return`Stopped: ${t.reason}`}return l==="generating"?"Starting…":l==="fixing"?"Fixing…":""})(),c=A.isStreaming,v=l==="done"&&!!p,J=!c&&(l==="generating"||l==="fixing")&&!p,Ne=(l==="done"||J)&&!p,q=v&&!!P?.reason,ve=q?"Best Effort":v?"Validated":"Engine Rule",_=q?L||"Stream ended early. Review the best-effort XML before using it.":P?.remainingIssueCount?`${P.remainingIssueCount} issue(s) still remain in the generated output.`:"",fe=L||A.error||(J?"Generation ended without XML or a structured error response.":"Generation did not produce a valid plan.");return e.jsx(ke,{children:e.jsxs("div",{className:"playground-container fade-in",children:[e.jsxs("header",{className:"playground-header",children:[e.jsxs("div",{className:"header-titles",children:[e.jsx("h1",{children:oe}),e.jsxs("p",{children:["Describe the workflow you want, then review and refine the generated ",N.toLowerCase()," XML before using it."]})]}),e.jsx("div",{className:"header-actions",children:c?e.jsxs("button",{className:"cymoth-btn secondary",onClick:he,children:[e.jsx("span",{className:"material-icons-outlined",children:"stop_circle"})," Stop"]}):e.jsxs(e.Fragment,{children:[v&&e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"cymoth-btn secondary",onClick:ge,children:[e.jsx("span",{className:"material-icons-outlined",children:"build"})," Fix"]}),e.jsxs("button",{className:"cymoth-btn secondary",onClick:Ae,disabled:W,children:[e.jsx("span",{className:"material-icons-outlined",children:"design_services"})," Open in ",j]})]}),e.jsxs("button",{className:"cymoth-btn primary",onClick:X,disabled:x.trim()===""||!pe,children:[e.jsx("span",{className:"material-icons-outlined",children:"auto_awesome"}),"Generate XML"]})]})})]}),e.jsxs("div",{className:"template-selector",children:[e.jsx("span",{className:"template-label",children:"English Templates:"}),R.map(a=>e.jsx("button",{className:`template-chip ${ie.id===a.id?"active":""}`,onClick:()=>ue(a),children:a.name},a.id))]}),e.jsxs("div",{className:"playground-workspace",children:[e.jsxs("div",{className:"workspace-panel left-panel",children:[e.jsxs("div",{className:"panel-header",children:[e.jsx("span",{className:"panel-title",children:"1. Plain English Input"}),e.jsx("span",{className:"panel-badge",children:"Human"})]}),e.jsxs("div",{className:"panel-body",children:[e.jsx("textarea",{className:"english-textarea",value:x,onChange:a=>{F(a.target.value),l==="done"&&(g(""),m("idle"))},placeholder:"Describe what you want the agent to do...",disabled:c}),c&&e.jsxs("div",{className:"pg-live-status",children:[e.jsx("span",{className:"material-icons-outlined spin",children:"sync"}),e.jsx("span",{className:"pg-live-text",children:Te})]}),e.jsxs("div",{className:"copilot-grounding-panel",children:[e.jsxs("div",{className:"copilot-grounding-header",children:[e.jsx("span",{className:"panel-title",children:"Grounding Context"}),e.jsx("span",{className:"panel-badge",children:"Optional"})]}),e.jsxs("div",{className:"copilot-grounding-fields",children:[e.jsx("label",{className:"copilot-grounding-label",htmlFor:"copilot-llm-connection",children:"LLM Connection"}),e.jsxs("select",{id:"copilot-llm-connection",className:"mac-select",value:G,onChange:a=>O(a.target.value),disabled:c||E,children:[f.length===0&&e.jsx("option",{value:"",children:"No LLM connections available"}),f.map(a=>e.jsx("option",{value:a.connectionId,children:Pe(a)},a.connectionId))]}),e.jsx("label",{className:"copilot-grounding-label",children:"Knowledge Journals"}),e.jsx(Oe,{availableJournals:w,selectedJournalIds:u,onToggle:a=>de(t=>t.includes(a)?t.filter(s=>s!==a):[...t,a]),loading:E,error:b||null,disabled:c,maxHeight:180}),e.jsx("label",{className:"copilot-grounding-label",children:"Operational Connections"}),e.jsx(Ge,{availableConnections:y,selectedConnectionIds:H,onToggle:a=>{me(!0),B(t=>t.includes(a)?t.filter(s=>s!==a):[...t,a])},loading:E,error:b||null,disabled:c,maxHeight:180}),!I&&u.length>0&&H.length>0&&e.jsx("div",{className:"copilot-grounding-help",children:"Suggested operational connections were preselected from the selected journals. You can change them before generating."}),!E&&!b&&f.length===0&&e.jsx("div",{className:"copilot-grounding-help",children:"Create or enable an LLM connection before using Copilot generation."})]})]})]})]}),e.jsx("div",{className:"workspace-divider",children:e.jsx("div",{className:"divider-icon material-icons-outlined",children:"arrow_forward"})}),e.jsxs("div",{className:"workspace-panel right-panel",children:[e.jsxs("div",{className:"panel-header",children:[e.jsxs("span",{className:"panel-title",children:["2. ",N," XML Output"]}),e.jsx("span",{className:`panel-badge ${v?"engine":""}`,children:ve})]}),e.jsxs("div",{className:`panel-body ${c?"generating":""}`,children:[c&&e.jsxs("div",{className:"generation-overlay",children:[e.jsx("span",{className:"material-icons-outlined spin",children:"sync"}),e.jsx("p",{children:l==="fixing"?"Fixing plan…":"Compiling logic to deterministic XML…"})]}),v&&e.jsxs(e.Fragment,{children:[_&&e.jsxs("div",{className:"pg-live-status",style:{marginBottom:12},children:[e.jsx("span",{className:"material-icons-outlined",children:"info"}),e.jsx("span",{className:"pg-live-text",children:_})]}),e.jsx("pre",{className:"xml-preview fade-in",children:e.jsx("code",{children:p})})]}),Ne&&e.jsxs("div",{className:"pg-error-state",children:[e.jsx("span",{className:"material-icons-outlined",children:"error_outline"}),e.jsx("p",{children:fe}),e.jsx("button",{className:"cymoth-btn secondary",onClick:X,children:"Try Again"})]}),l==="idle"&&e.jsxs("div",{className:"empty-state",children:[e.jsx("div",{className:"material-icons-outlined placeholder-icon",children:"code_off"}),e.jsxs("p",{className:"placeholder-text",children:['Click "Generate XML" to compile your English text into ',N," XML."]})]})]})]})]})]})})}export{Ye as CopilotPage,Ye as default};
