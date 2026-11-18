# Portfolio case study: AI-Assisted Job Application Pipeline

## The project

I created a Google Workspace automation to reduce repetitive work in reviewing job-alert emails and preparing application materials. It connects Gmail, Gemini, Google Drive, and Google Sheets, with configurable criteria and resume mappings.

The intended role for automation is preparation and organization: identify potentially relevant vacancies, generate a draft cover letter, record the application, and prepare an email draft for human review.

## What the pipeline does

- Reads messages from a configured Gmail label.
- Sends vacancy text and configurable filtering instructions to Gemini for a structured suitability assessment.
- Applies a minimum match score and role criteria from configuration.
- Generates a cover-letter PDF in Google Drive.
- Appends vacancy and match details to a Google Sheets tracker.
- Creates a Gmail draft with a mapped resume attached when a contact email is available.
- Supports scheduled runs through Google Apps Script triggers.

## A decision I had to make

A match score can help prioritize a queue, but it cannot make a reliable hiring decision by itself. The workflow therefore prepares application materials as drafts rather than sending an application automatically. The score and generated letter still need a person to check the job details, factual claims, and fit before applying.

The current implementation also has operational choices that deserve care: messages below the configured threshold are moved to Trash, and generated PDFs are shared with anyone who has the link. Those defaults should be reviewed for a real account; a safer next version would use a review label or archive and restricted Drive access.

## What I personally contributed

- Defined the repetitive steps to automate and the information to track.
- Set up configurable role, location, exclusion, and minimum-score criteria.
- Specified the connection between vacancy assessment, resume selection, cover-letter generation, CRM logging, and email-draft preparation.
- Designed setup guidance so users can provide their own Gmail labels, Drive IDs, spreadsheet, and resume files.
- Kept the final application decision under human control.

I used AI as both a coding aid and a component of the workflow. My contribution was the process design, criteria, integration requirements, configuration, and review points.

## Limits

Gemini can misread an email, return an inaccurate score, or draft unsupported statements. Email alerts vary in format, and a score is not a calibrated probability of getting a job. The automation depends on correct Google permissions, IDs, configuration, and quotas. Personal information and API credentials require careful handling in the browser, generated script, Google services, and Drive.

## What I would do next

1. Replace automatic Trash actions with a review label and a clear retention policy.
2. Restrict generated files to the account owner by default.
3. Add structured validation for Gemini responses and clearer handling of malformed messages.
4. Record model version, criteria version, and a short explanation for each assessment.
5. Add duplicate detection and a manual approval step before creating application drafts.
6. Test using anonymized sample emails and document Google Apps Script permissions.

## How I would present it in an interview

Explain the workflow as an operations problem: alerts arrive in different formats, relevant vacancies need consistent screening, and the same details then have to be copied into documents and a tracker. Show how the integrations reduce that repetition, then discuss where human review remains essential and how privacy and error handling should improve before relying on it day to day.

## Resume wording

- Designed a Google Apps Script workflow connecting Gmail, Gemini, Drive, and Sheets to screen job alerts and prepare application drafts.
- Defined configurable vacancy criteria, resume mappings, PDF generation, and CRM logging for a human-reviewed application process.
- Identified privacy and operational safeguards, including safer handling of rejected emails and generated documents.
