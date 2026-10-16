# 🤖 Automated Job Search & AI Scoring Pipeline

An autonomous background worker built entirely within the **Google Workspace ecosystem (Google Apps Script + Gemini API)** to streamline the job search process, eliminate manual screening friction, and maintain a structured application tracking CRM.

## 🚀 Key Features

* **Smart Gmail Integration:** Automatically monitors incoming job alerts based on custom Gmail labels.
* **AI-Powered Matching (Gemini API):** Evaluates job descriptions against customizable filtering rules (location constraints, time limits, and role exclusions) defined directly in the config.
* **Automated Document Generation:** Dynamically generates professional German cover letters (DIN 5008 compliant) as PDFs and stores them directly in Google Drive.
* **Flexible CV Mapping:** Easily support 1, 2, or multiple CV templates by mapping their Google Drive File IDs in the config dictionary.
* **CRM Logging:** Appends structured tracking data directly into Google Sheets.
* **Draft Preparation:** Automatically creates Gmail drafts with the correct targeted CV attached when a direct email is available.
* **Autonomous Triggers:** Runs completely in the background on a custom schedule (e.g., **every Tuesday and Friday**).

---

## 📋 Step-by-Step Setup Guide

### Step 1: Job Board Alert Setup
1. Go to job platforms (Indeed, StepStone, LinkedIn) and set up saved job alerts to be delivered to your Gmail inbox.
2. In Gmail, create two custom labels: `Job-Alerts` (where incoming alerts will land) and `Job-Processed` (where handled emails will move). Set up a Gmail filter so incoming alerts automatically get tagged with `Job-Alerts`.

### Step 2: Google Drive & Sheets Setup
1. **Google Sheets:** Create a new Google Spreadsheet to track your applications. Copy its **Spreadsheet ID** from the URL (the long alphanumeric string between `/d/` and `/edit`).
2. **Google Drive Folder:** Create a folder for generated PDF cover letters. Open it and copy its **Folder ID** from the URL.
3. **PDF Resumes:** Upload your PDF resume(s) to Google Drive, right-click each file, select *Share -> Copy link*, and extract the file ID from the link to use in your config.

### Step 3: Get Your Free Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com).
2. Sign in with your Google account and generate a free **API Key**.

### Step 4: Google Apps Script Installation
1. Go to [script.google.com](https://script.google.com) and click **New project**.
2. Create two script files: `Code.gs` and `Config.gs`.
3. Paste the provided code into `Code.gs` and use `Config.gs.example` to create your `Config.gs` file, filling in your API key, Spreadsheet ID, Drive IDs, and customizing `FILTER_RULES` for your target profession.
4. **Set up Autonomous Triggers:** Click on the clock icon (Triggers) on the left sidebar in Apps Script -> *Add Trigger* -> select function `processJobEmails` -> select event source *Time-driven* -> choose *Week timer* and configure it to run **every Tuesday and Friday**.