# Provider-Specific Certification Setup

This document outlines the setup for each certification provider's Google Apps Script and Google Sheet.

## Providers

1. **AWS** - `certified-aws-yatris`
2. **Azure** - `certified-azure-yatris`
3. **GCP** - `certified-gcp-yatris`
4. **GitHub** - `certified-github-yatris`
5. **Oracle** - `certified-oracle-yatris`
6. **Salesforce** - `certified-salesforce-yatris`
7. **ServiceNow** - `certified-servicenow-yatris`

## Environment Variables

Add these to your `.env` file:

```env
# AWS Certifications
VITE_AWS_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_AWS_WEBHOOK_URL/exec

# Azure Certifications
VITE_AZURE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_AZURE_WEBHOOK_URL/exec

# GCP Certifications
VITE_GCP_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_GCP_WEBHOOK_URL/exec

# GitHub Certifications
VITE_GITHUB_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_GITHUB_WEBHOOK_URL/exec

# Oracle Certifications
VITE_ORACLE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_ORACLE_WEBHOOK_URL/exec

# Salesforce Certifications
VITE_SALESFORCE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SALESFORCE_WEBHOOK_URL/exec

# ServiceNow Certifications
VITE_SERVICENOW_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SERVICENOW_WEBHOOK_URL/exec

# General/Default (fallback for Azure)
VITE_GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_GENERAL_WEBHOOK_URL/exec
```

## Setup Instructions for Each Provider

### 1. Create Google Sheet
- Create a new Google Sheet for each provider
- Name the main sheet: `certified-{provider}-yatris` (e.g., `certified-gcp-yatris`)
- Copy the Sheet ID from the URL

### 2. Create Google Apps Script
- Go to [script.google.com](https://script.google.com)
- Click "New Project"
- Copy the contents from `appscript/{provider}-certifications.gs`
- Update `SPREADSHEET_ID` with your Sheet ID
- Save the project

### 3. Deploy as Web App
- Click "Deploy" > "New deployment"
- Click the gear icon ⚙️ and choose "Web app"
- Set:
  - Description: "{Provider} Certifications API"
  - Execute as: "Me"
  - Who has access: "Anyone"
- Click "Deploy"
- Copy the web app URL

### 4. Add to Environment
- Add the web app URL to your `.env` file as `VITE_{PROVIDER}_CERTIFICATIONS_WEBHOOK_URL`
- Restart your dev server

## Available Logos

Logos are loaded from: https://github.com/yatricloud/yatri-images/tree/main/certification.yatricloud.com/logo/certifications

- **AWS**: `aws.svg` (dark), `aws-light.png` (light)
- **Azure**: `Microsoft_Azure.svg`
- **GCP**: `google_cloud.svg`
- **Oracle**: `Oracle_logo.svg`
- **Salesforce**: `Salesforce.com_logo.svg`
- **ServiceNow**: `ServiceNow_logo.svg`
- **GitHub**: No logo available yet

## Certification Lists

### AWS (13 certifications)
- AWS Certified Cloud Practitioner
- AWS Certified AI Practitioner
- AWS Certified CloudOps Engineer - Associate
- AWS Certified Solutions Architect - Associate
- AWS Certified Developer - Associate
- AWS Certified Data Engineer - Associate
- AWS Certified Machine Learning Engineer - Associate
- AWS Certified Solutions Architect - Professional
- AWS Certified DevOps Engineer - Professional
- AWS Certified Generative AI Developer - Professional (Beta)
- AWS Certified Advanced Networking - Specialty
- AWS Certified Security - Specialty
- AWS Certified Machine Learning - Specialty

### Azure (27 certifications)
- AZ-900, AI-900, DP-900, SC-900, AB-902, MS-900, MB-910, MB-920
- AZ-104, AZ-204, AZ-700, AZ-500, DP-100, DP-300, AI-102, SC-200
- DP-600, DP-700, PL-300
- AZ-305, AZ-400, SC-100
- AZ-140, AZ-500 SAP, AZ-720, DP-420, AB-1001

### GCP (12 certifications)
- Cloud Digital Leader
- Generative AI Leader
- Associate Cloud Engineer
- Professional Cloud Architect
- Professional Data Engineer
- Professional Cloud Developer
- Professional Cloud DevOps Engineer
- Professional Cloud Network Engineer
- Professional Cloud Security Engineer
- Professional Machine Learning Engineer
- Professional Cloud Database Engineer
- Professional Google Workspace Administrator

### GitHub (5 certifications)
- GitHub Foundations GH-900
- GitHub Copilot Certification GH-1001
- GitHub Actions GH-400
- GitHub Advanced Security GH-500
- GitHub Administration GH-300

### Oracle (24 certifications)
- OCI Foundations Associate
- Oracle Database Foundations
- Java Foundations Certified Junior Associate
- Oracle AI Foundations Specialist
- Oracle Fusion Cloud Applications Fundamentals
- Oracle MySQL Database Fundamentals
- OCI Architect Associate
- OCI Developer Associate
- OCI Data Management Foundations Associate
- OCI Multicloud Architect Associate
- Oracle Database SQL Certified Associate
- OCI Architect Professional
- OCI Data Science Professional
- OCI Application Integration Professional
- Oracle Autonomous Database Cloud Professional
- Oracle Cloud Database@AWS Architect Professional
- Oracle Certified Professional Java SE 21/17/11 Developer
- Oracle AI Cloud Database Services 2025 Professional
- Oracle Analytics Cloud 2024 Professional
- Oracle AI Agent Studio for Fusion Applications Developer 2025
- OCI Database Migration & Integration Specialist
- OCI Data Integration Specialist

### Salesforce (50 certifications)
- Platform Foundations, Sales Foundations, Marketing Cloud Engagement Foundations
- Tableau Desktop Foundations, MuleSoft Integration Foundations
- Slack Administrator, Tableau Server Administrator, CPQ Administrator
- Slack Consultant, AI Associate
- Platform Administrator, Platform Administrator II, Platform App Builder
- Platform Developer, JavaScript Developer, Industries CPQ Developer
- B2C Commerce Developer
- Sales Cloud Consultant, Service Cloud Consultant, Experience Cloud Consultant
- Field Service Cloud Consultant, Data Cloud Consultant, Agentforce Specialist
- MuleSoft Developer, Slack Developer
- Identity & Access Management Architect, Business Analyst
- Platform Developer II, OmniStudio Developer, OmniStudio Consultant
- Marketing Cloud Administrator, Marketing Cloud Engagement Consultant
- Marketing Cloud Engagement Developer, Marketing Cloud Email Specialist
- Marketing Cloud Account Engagement Consultant, Marketing Cloud Account Engagement Specialist
- B2C Solution Architect, Platform Strategy Designer, Platform User Experience Designer
- Nonprofit Cloud Consultant, Nonprofit Success Pack Consultant, Education Cloud Consultant
- Tableau CRM & Einstein Discovery Consultant, Platform Sharing & Visibility Architect
- MuleSoft Developer II, MuleSoft Hyperautomation Developer
- Platform Dev Lifecycle & Deployment Architect
- System Architect, Application Architect
- B2B Solution Architect, B2C Commerce Architect, Heroku Architect, Tableau Architect
- MuleSoft Platform Architect, MuleSoft Integration Architect
- Platform Integration Architect, Platform Data Architect, Technical Architect

### ServiceNow (35 certifications)
- Certified Technical Architect (CTA)
- Certified Master Architect (CMA)
- Certified System Administrator (CSA)
- Certified Application Developer (CAD)
- CIS - IT Service Management (CIS-ITSM)
- CIS - IT Operations Management (CIS-ITOM)
- CIS - Customer Service Management (CIS-CSM)
- CIS - HR Service Delivery (CIS-HR)
- CIS - Security Incident Response (CIS-SIR)
- CIS - Vulnerability Response (CIS-VR)
- CIS - Discovery (CIS-Discovery)
- CIS - Event Management (CIS-EM)
- CIS - Software Asset Management (CIS-SAM)
- CIS - Hardware Asset Management (CIS-HAM)
- CIS - Risk and Compliance (CIS-RC)
- CIS - Cloud Provisioning and Governance
- CIS - Field Service Management (CIS-FSM)
- CIS - Application Portfolio Management (CIS-APM)
- CIS - Strategic Portfolio Management (CIS-SPM)
- CIS - Integrated Risk Management (CIS-IRM)
- CIS - App Engine (CIS-APE)
- MC - Welcome to ServiceNow
- MC - Predictive Intelligence
- MC - Virtual Agent
- MC - Automated Test Framework
- MC - Flow Designer
- MC - Integration Hub
- MC - Performance Analytics
- MC - Service Portal
- MC - Agile Development
- MC - Application Developer Process Creator
- MC - Citizen Developer Application Creator
- MC - Generative AI (Executive)
- MC - Now Assist (NEW 2025)
- Cloud Cost Management Accreditation (NEW)

