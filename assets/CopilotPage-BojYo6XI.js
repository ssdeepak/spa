import{u as fe,a as Ee,r as n,j as e,g as Y,C as Ce}from"./index-CJfaYTO6.js";import{A as Se,g as xe,G as ke,l as Pe}from"./AppLayout-O1Ypx1w9.js";import{u as Ge,i as He,h as we,f as be,a as Ie,e as Re,b as je,c as De,j as Fe,k as Ke,l as Le,m as We}from"./useAgentStream-Bdd6vO-V.js";import{g as Me}from"./errorUtils-COCPCau8.js";import{J as Oe}from"./JournalSelector-CzvVgbbb.js";import{b as Be,g as $e,a as Qe}from"./groundingConnections-BKoyV7VN.js";import"./Button-DEUegeVj.js";const R=[{id:"ecommerce",name:"E-commerce Pipeline",english:"When a new order comes in, check our inventory. If we have the items, review the customer's history for fraud. If the score is higher than 80, ask a human to approve. Otherwise, charge the card and tell the warehouse.",xml:`<?xml version='1.0' encoding='utf-8'?>
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

</PLAN>`}];function Ye({kind:S="agentic"}){const{tenantSlug:s}=fe(),Z=Ee(),h=S==="procedural",A=h?"Procedural":"Agentic",ee=h?"/plans/agent/author-procedural":"/plans/agent/author",ae=h?"procedural-studio":"studio",j=h?"Procedural Studio":"Studio",D=h?"procedural-copilot":"agentic-copilot",te=`${A} Copilot`,[ne,oe]=n.useState(R[0]),[x,F]=n.useState(R[0].english),[K,k]=n.useState([]),[m,v]=n.useState(""),[L,u]=n.useState(""),[r,p]=n.useState("idle"),[P,N]=n.useState(null),[W,M]=n.useState(!1),[y,ie]=n.useState([]),[G,O]=n.useState(""),[f,se]=n.useState([]),[H,B]=n.useState([]),[w,re]=n.useState([]),[c,le]=n.useState([]),[b,$]=n.useState(""),[E,Q]=n.useState(!0),[I,ce]=n.useState(!1),g=Ge();n.useEffect(()=>{if(!s)return;let a=!1;return(async()=>{Q(!0),$("");try{const i=Y(),[o,d]=await Promise.all([i.listConnections(s,void 0),Pe(s,void 0)]);if(a)return;const z=$e(o||[]),Ne=Qe(o||[]);ie(z),se(Ne),re(d||[]),O(ye=>ye||z[0]?.connectionId||"")}catch{if(a)return;$("Failed to load LLM connections or journals. Copilot grounding options are unavailable until this reloads.")}finally{a||Q(!1)}})(),()=>{a=!0}},[s]),n.useEffect(()=>{if(I)return;const a=Array.from(new Set(w.filter(t=>c.includes(t.journalId||"")).flatMap(t=>t.relatedConnectionIds||[]).filter(t=>f.some(i=>i.connectionId===t))));B(a)},[w,f,I,c]);const de=a=>{g.isStreaming||(oe(a),F(a.english),v(""),u(""),k([]),N(null),p("idle"))},U=n.useCallback((a,t,i)=>{s&&(k([]),v(""),u(""),N(null),p(i),g.start({path:`/t/${s}${a}`,body:t,surface:D,onEvent:o=>k(d=>[...d,o]),onDone:o=>{p("done"),N(o),o.xml&&v(o.xml);const d=o.remainingIssueCount;o.reason?u(d?`${o.reason} (${d} issue(s) remaining)`:o.reason):d&&u(`${d} issue(s) remaining after stream completion.`)},onError:o=>{p("done"),u(o),N(null)}}))},[g,D,s]),V=y.find(a=>a.connectionId===G)?.alias,C=Be(f,H),me=!!G,J=()=>U(ee,{intent:x,kind:S,connectionAlias:V||void 0,journalIds:c.length>0?c:void 0,groundingConnectionAliases:C.length>0?C:void 0},"generating"),ue=()=>U("/plans/agent/fix",{planXml:m,planKind:S,connectionAlias:V||void 0,journalIds:c.length>0?c:void 0,groundingConnectionAliases:C.length>0?C:void 0},"fixing"),pe=()=>{g.stop(),p("done")},ge=async()=>{if(!(!s||!m.trim()||W)){M(!0);try{const t=await Y().createPlan(s,new Ce({name:`Copilot Draft ${new Date().toLocaleString()}`,kind:A,contentXml:m}));if(!t.planId)throw new Error("Plan was created without an ID.");Z(`/t/${s}/app/${ae}/${t.planId}`)}catch(a){u(Me(a,`Failed to open generated plan in ${j}.`))}finally{M(!1)}}},he=(()=>{for(let a=K.length-1;a>=0;a--){const t=K[a];if(He(t))return`Agent: ${t.agentName}`;if(we(t))return`Progress: iteration ${t.iteration}/${t.maxIterations}${typeof t.remainingValidationIssues=="number"?` • ${t.remainingValidationIssues} issue(s) remaining`:""}`;if(be(t))return`Warning: ${t.message}`;if(Ie(t))return`Tool: ${t.toolName}`;if(Re(t))return t.chunk.slice(0,80);if(je(t))return`Draft iteration ${t.iteration}…`;if(De(t)){const i=Fe(t)[0];if(i){const o=[i.severity,i.code].filter(Boolean).join("/");return`Fixing: ${o?`${o}: `:""}${i.message}`}return`Fixing: ${Ke(t)[0]??"validation error"}`}if(Le(t))return"Done ✓";if(We(t))return`Stopped: ${t.reason}`}return r==="generating"?"Starting…":r==="fixing"?"Fixing…":""})(),l=g.isStreaming,T=r==="done"&&!!m,X=!l&&(r==="generating"||r==="fixing")&&!m,Ae=(r==="done"||X)&&!m,q=T&&!!P?.reason,Te=q?"Best Effort":T?"Validated":"Engine Rule",_=q?L||"Stream ended early. Review the best-effort XML before using it.":P?.remainingIssueCount?`${P.remainingIssueCount} issue(s) still remain in the generated output.`:"",ve=L||g.error||(X?"Generation ended without XML or a structured error response.":"Generation did not produce a valid plan.");return e.jsx(Se,{children:e.jsxs("div",{className:"playground-container fade-in",children:[e.jsxs("header",{className:"playground-header",children:[e.jsxs("div",{className:"header-titles",children:[e.jsx("h1",{children:te}),e.jsxs("p",{children:["Describe the workflow you want, then review and refine the generated ",A.toLowerCase()," XML before using it."]})]}),e.jsx("div",{className:"header-actions",children:l?e.jsxs("button",{className:"cymoth-btn secondary",onClick:pe,children:[e.jsx("span",{className:"material-icons-outlined",children:"stop_circle"})," Stop"]}):e.jsxs(e.Fragment,{children:[T&&e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"cymoth-btn secondary",onClick:ue,children:[e.jsx("span",{className:"material-icons-outlined",children:"build"})," Fix"]}),e.jsxs("button",{className:"cymoth-btn secondary",onClick:ge,disabled:W,children:[e.jsx("span",{className:"material-icons-outlined",children:"design_services"})," Open in ",j]})]}),e.jsxs("button",{className:"cymoth-btn primary",onClick:J,disabled:x.trim()===""||!me,children:[e.jsx("span",{className:"material-icons-outlined",children:"auto_awesome"}),"Generate XML"]})]})})]}),e.jsxs("div",{className:"template-selector",children:[e.jsx("span",{className:"template-label",children:"English Templates:"}),R.map(a=>e.jsx("button",{className:`template-chip ${ne.id===a.id?"active":""}`,onClick:()=>de(a),children:a.name},a.id))]}),e.jsxs("div",{className:"playground-workspace",children:[e.jsxs("div",{className:"workspace-panel left-panel",children:[e.jsxs("div",{className:"panel-header",children:[e.jsx("span",{className:"panel-title",children:"1. Plain English Input"}),e.jsx("span",{className:"panel-badge",children:"Human"})]}),e.jsxs("div",{className:"panel-body",children:[e.jsx("textarea",{className:"english-textarea",value:x,onChange:a=>{F(a.target.value),r==="done"&&(v(""),p("idle"))},placeholder:"Describe what you want the agent to do...",disabled:l}),l&&e.jsxs("div",{className:"pg-live-status",children:[e.jsx("span",{className:"material-icons-outlined spin",children:"sync"}),e.jsx("span",{className:"pg-live-text",children:he})]}),e.jsxs("div",{className:"copilot-grounding-panel",children:[e.jsxs("div",{className:"copilot-grounding-header",children:[e.jsx("span",{className:"panel-title",children:"Grounding Context"}),e.jsx("span",{className:"panel-badge",children:"Optional"})]}),e.jsxs("div",{className:"copilot-grounding-fields",children:[e.jsx("label",{className:"copilot-grounding-label",htmlFor:"copilot-llm-connection",children:"LLM Connection"}),e.jsxs("select",{id:"copilot-llm-connection",className:"mac-select",value:G,onChange:a=>O(a.target.value),disabled:l||E,children:[y.length===0&&e.jsx("option",{value:"",children:"No LLM connections available"}),y.map(a=>e.jsx("option",{value:a.connectionId,children:xe(a)},a.connectionId))]}),e.jsx("label",{className:"copilot-grounding-label",children:"Knowledge Journals"}),e.jsx(Oe,{availableJournals:w,selectedJournalIds:c,onToggle:a=>le(t=>t.includes(a)?t.filter(i=>i!==a):[...t,a]),loading:E,error:b||null,disabled:l,maxHeight:180}),e.jsx("label",{className:"copilot-grounding-label",children:"Operational Connections"}),e.jsx(ke,{availableConnections:f,selectedConnectionIds:H,onToggle:a=>{ce(!0),B(t=>t.includes(a)?t.filter(i=>i!==a):[...t,a])},loading:E,error:b||null,disabled:l,maxHeight:180}),!I&&c.length>0&&H.length>0&&e.jsx("div",{className:"copilot-grounding-help",children:"Suggested operational connections were preselected from the selected journals. You can change them before generating."}),!E&&!b&&y.length===0&&e.jsx("div",{className:"copilot-grounding-help",children:"Create or enable an LLM connection before using Copilot generation."})]})]})]})]}),e.jsx("div",{className:"workspace-divider",children:e.jsx("div",{className:"divider-icon material-icons-outlined",children:"arrow_forward"})}),e.jsxs("div",{className:"workspace-panel right-panel",children:[e.jsxs("div",{className:"panel-header",children:[e.jsxs("span",{className:"panel-title",children:["2. ",A," XML Output"]}),e.jsx("span",{className:`panel-badge ${T?"engine":""}`,children:Te})]}),e.jsxs("div",{className:`panel-body ${l?"generating":""}`,children:[l&&e.jsxs("div",{className:"generation-overlay",children:[e.jsx("span",{className:"material-icons-outlined spin",children:"sync"}),e.jsx("p",{children:r==="fixing"?"Fixing plan…":"Compiling logic to deterministic XML…"})]}),T&&e.jsxs(e.Fragment,{children:[_&&e.jsxs("div",{className:"pg-live-status",style:{marginBottom:12},children:[e.jsx("span",{className:"material-icons-outlined",children:"info"}),e.jsx("span",{className:"pg-live-text",children:_})]}),e.jsx("pre",{className:"xml-preview fade-in",children:e.jsx("code",{children:m})})]}),Ae&&e.jsxs("div",{className:"pg-error-state",children:[e.jsx("span",{className:"material-icons-outlined",children:"error_outline"}),e.jsx("p",{children:ve}),e.jsx("button",{className:"cymoth-btn secondary",onClick:J,children:"Try Again"})]}),r==="idle"&&e.jsxs("div",{className:"empty-state",children:[e.jsx("div",{className:"material-icons-outlined placeholder-icon",children:"code_off"}),e.jsxs("p",{className:"placeholder-text",children:['Click "Generate XML" to compile your English text into ',A," XML."]})]})]})]})]})]})})}export{Ye as CopilotPage,Ye as default};
