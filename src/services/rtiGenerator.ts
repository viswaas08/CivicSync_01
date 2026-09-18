/**
 * Automated Civic RTI & Escalation Dossier Generator
 * Pre-formats legally compliant Right to Information (RTI) applications under
 * Section 6(1) of the Indian Right to Information Act, 2005 for statutory SLA breaches.
 */

import { Complaint, ComplaintSLA } from '../types';

export interface RTIDossierContent {
  applicationId: string;
  generatedDate: string;
  actTitle: string;
  addresseeTitle: string;
  publicAuthorityName: string;
  publicAuthorityAddress: string;
  applicantName: string;
  applicantAddress: string;
  complaintReferenceNumber: string;
  wardName: string;
  departmentName: string;
  slaBreachDays: number;
  statutoryFeeDetails: string;
  prescribedQuestions: string[];
  fullMarkdownDraft: string;
}

/**
 * Calculates days breached past the statutory Citizen Charter SLA
 */
export function calculateSlaBreachDays(sla: ComplaintSLA): number {
  const targetTime = new Date(sla.extendedUntil || sla.expectedResolutionAt || sla.initialResponseDueAt).getTime();
  const now = Date.now();
  const diffDays = (now - targetTime) / (1000 * 3600 * 24);
  return Math.max(0, Math.floor(diffDays));
}

/**
 * Generates an official Section 6(1) RTI Application Dossier for a complaint
 */
export function generateRTIDossier(
  complaint: Complaint,
  applicantName: string = 'Authorized Citizen / Resident',
  applicantContact: string = 'CivicSync Verified Registered User'
): RTIDossierContent {
  const breachDays = calculateSlaBreachDays(complaint.sla);
  const nowStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const applicationId = `RTI/CCMC/${new Date().getFullYear()}/${complaint.complaintId}`;
  const publicAuthority = complaint.assignedDepartmentName || 'Municipal Administration & Water Supply Department';
  const wardStr = complaint.locationSnapshot?.wardName || complaint.locationSnapshot?.localBodyName || 'City Ward';

  const prescribedQuestions = [
    `Please provide daily certified progress logs and action-taken reports recorded by the Junior Engineer / Ward Officer regarding Grievance #${complaint.complaintId} since its submission on ${new Date(complaint.createdAt).toLocaleDateString('en-IN')}.`,
    `Please provide the names, official designations, and contact numbers of the municipal officers / contractors accountable for rectifying this defect as per the statutory Citizen Charter SLA.`,
    `As per the Citizen Charter, this defect should have been resolved within statutory timeline, but has exceeded by ${Math.max(1, breachDays)} days. Please disclose reasons recorded on official file for this delay.`,
    `Please provide copies of any file notes, internal memoranda, work orders, or fund sanctions issued in connection with this civic defect.`,
    `Under Section 7(1) of the RTI Act 2005, please furnish certified copies of the site inspection reports carried out by the Zonal Executive Engineer.`
  ];

  const fullMarkdownDraft = `
# FORM 'A' — APPLICATION FOR INFORMATION UNDER SECTION 6(1) OF THE RTI ACT, 2005

**Application Reference No:** ${applicationId}  
**Date of Filing:** ${nowStr}

---

### TO:
**The Public Information Officer (PIO) / Assistant PIO**  
Office of the Municipal Commissioner  
Coimbatore City Municipal Corporation (CCMC)  
Big Bazaar Street, Town Hall, Coimbatore – 641001, Tamil Nadu  
*Department Reference:* ${publicAuthority}

---

### 1. FULL PARTICULARS OF THE APPLICANT:
- **Name:** ${applicantName}
- **Contact / Identification:** ${applicantContact}
- **Grievance Reference Number:** #${complaint.complaintId}
- **Jurisdiction / Ward:** ${wardStr}

---

### 2. PARTICULARS OF INFORMATION SOUGHT:
**Subject:** Request for certified documents and progress disclosure regarding neglected civic defect (Complaint #${complaint.complaintId}) – *"${complaint.title}"*.

**Statutory Background:**  
The applicant lodged a formal grievance under the municipal portal on **${new Date(complaint.createdAt).toLocaleDateString('en-IN')}**.  
Under the Citizen Charter and statutory municipal bylaws, the assigned department (**${publicAuthority}**) was mandated to resolve this problem within the specified SLA.  
As on date, the grievance remains unrectified with an official SLA breach duration of **${Math.max(1, breachDays)} day(s)**.

**Specific Information Required:**
${prescribedQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n\n')}

---

### 3. PRESCRIBED STATUTORY FEE:
- **Mode of Payment:** Prescribed RTI application fee of **₹10.00 (Rupees Ten Only)** tendered via Indian Postal Order (IPO) / Court Fee Stamp / Treasury Challan.

---

### 4. DECLARATION:
I hereby declare that I am a citizen of India and that the information sought above falls squarely within the purview of the Right to Information Act, 2005, and is not exempted under Section 8 or 9.

**Date:** ${nowStr}  
**Place:** Coimbatore, Tamil Nadu  

*(Digitally Formatted Dossier generated via CivicSync Citizen Charter Integrity Shield)*
`.trim();

  return {
    applicationId,
    generatedDate: nowStr,
    actTitle: 'Right to Information Act, 2005 [Act No. 22 of 2005]',
    addresseeTitle: 'The Public Information Officer (PIO)',
    publicAuthorityName: publicAuthority,
    publicAuthorityAddress: 'Coimbatore City Municipal Corporation, Town Hall, Coimbatore',
    applicantName,
    applicantAddress: applicantContact,
    complaintReferenceNumber: complaint.complaintId,
    wardName: wardStr,
    departmentName: publicAuthority,
    slaBreachDays: breachDays,
    statutoryFeeDetails: '₹10.00 via Indian Postal Order (IPO) / Court Fee Stamp / e-RTI Portal',
    prescribedQuestions,
    fullMarkdownDraft
  };
}
