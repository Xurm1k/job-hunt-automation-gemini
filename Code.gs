// ==========================================
// AUTOMATED JOB SEARCH PIPELINE VIA GEMINI API
// Description: Automated email parser, AI-scorer, 
// PDF cover letter generator, and CRM logger.
// ==========================================

function processJobEmails() {
  const inputLabel = GmailApp.getUserLabelByName(CONFIG.GMAIL_LABEL_INPUT);
  if (!inputLabel) {
    Logger.log("Input label not found: " + CONFIG.GMAIL_LABEL_INPUT);
    return;
  }

  let processedLabel = GmailApp.getUserLabelByName(CONFIG.GMAIL_LABEL_PROCESSED);
  if (!processedLabel) {
    processedLabel = GmailApp.createLabel(CONFIG.GMAIL_LABEL_PROCESSED);
  }

  const threads = inputLabel.getThreads();
  if (threads.length === 0) {
    Logger.log("No unread email threads found with label: " + CONFIG.GMAIL_LABEL_INPUT);
    return;
  }

  Logger.log("Found email threads to process: " + threads.length);

  const currentDate = Utilities.formatDate(new Date(), "GMT+2", "dd.MM.yyyy");

  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i];
    const messages = thread.getMessages();
    const lastMessage = messages[messages.length - 1];
    
    const emailSubject = lastMessage.getSubject();
    const emailBody = lastMessage.getPlainBody();

    Logger.log("Processing email (" + currentDate + "): " + emailSubject);

    try {
      Utilities.sleep(1500);

      const aiResponse = analyzeJobWithGemini(emailBody, currentDate);

      if (!aiResponse) {
        Logger.log("Skipping: Gemini returned invalid JSON.");
        continue;
      }

      aiResponse.tracker_data.date = currentDate;

      Logger.log("Gemini Result: Score=" + aiResponse.match_score + "%, Verdict=" + aiResponse.verdict);

      if (aiResponse.verdict === "APPLY" && aiResponse.match_score >= CONFIG.MIN_MATCH_SCORE) {
        
        try {
          generateCoverLetterPDF(aiResponse);
        } catch (pdfErr) {
          Logger.log("PDF Generation Error: " + pdfErr.toString());
        }

        writeToSheet(aiResponse);

        if (aiResponse.contact_email) {
          createGmailDraft(aiResponse, emailSubject);
        } else {
          Logger.log("Email not found. External application (PDF generated in Drive).");
        }

        thread.removeLabel(inputLabel);
        thread.addLabel(processedLabel);
        Logger.log("Email moved to processed label: " + CONFIG.GMAIL_LABEL_PROCESSED);

      } else {
        Logger.log("Job skipped (Score < " + CONFIG.MIN_MATCH_SCORE + "% or SKIP). Moving to trash.");
        thread.moveToTrash();
      }

    } catch (e) {
      Logger.log("Error processing email thread: " + e.toString());
    }
  }
}

// ==========================================
// GEMINI API INTEGRATION (Using current efficient models)
// ==========================================
function analyzeJobWithGemini(emailContent, currentDate) {
  // Using efficient current model endpoint
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + CONFIG.GEMINI_API_KEY;

  const systemInstruction = `
    ${CONFIG.FILTER_RULES}

    DATE:
    Current execution date: ${currentDate}. In tracker_data.date use strictly "${currentDate}".

    COVER LETTER REQUIREMENTS:
    - No placeholder tags.
    - Professional sign-off with sender name.

    OUTPUT JSON STRUCTURE (ONLY clean JSON):
    {
      "match_score": <integer from 0 to 100>,
      "verdict": "<APPLY or SKIP>",
      "template_used": "<Key from CV_FILES mapping>",
      "contact_email": "<email from text or null>",
      "cover_letter": "<Cover letter text starting with proper greeting>",
      "company_address": {
        "name": "<Company name>",
        "street": "<Street or 'Personalabteilung'>",
        "city": "<Postal code and city>"
      },
      "tracker_data": {
        "company": "<Company name>",
        "date": "${currentDate}",
        "status": "Applied",
        "source": "<Indeed, StepStone, LinkedIn, etc.>",
        "channel": "<E-Mail or Website>",
        "bereich": "<Department / Role Category>"
      }
    }
  `;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: systemInstruction + "\n\nEmail content:\n" + emailContent }]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const jsonText = response.getContentText();
  
  try {
    const parsedResponse = JSON.parse(jsonText);
    if (!parsedResponse.candidates || !parsedResponse.candidates[0].content) {
      return null;
    }
    const resultText = parsedResponse.candidates[0].content.parts[0].text;
    return JSON.parse(resultText);
  } catch (err) {
    Logger.log("JSON parsing error: " + err);
    return null;
  }
}

// ==========================================
// PDF COVER LETTER GENERATION
// ==========================================
function generateCoverLetterPDF(aiData) {
  const company = aiData.company_address.name || aiData.tracker_data.company || "Company";
  const street = aiData.company_address.street ? aiData.company_address.street + "<br>" : "";
  const city = aiData.company_address.city || "City";
  
  const department = aiData.tracker_data.bereich || "Employee";
  const dateStr = aiData.tracker_data.date;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #222222; margin: 40px; }
        .sender { font-size: 9pt; color: #555555; margin-bottom: 35px; border-bottom: 1px solid #dddddd; padding-bottom: 6px; }
        .recipient { margin-bottom: 35px; line-height: 1.4; }
        .date { text-align: right; margin-bottom: 30px; font-size: 10pt; color: #444444; }
        .subject { font-size: 12pt; font-weight: bold; margin-bottom: 25px; color: #000000; }
        .content { text-align: justify; white-space: pre-line; }
      </style>
    </head>
    <body>
      <div class="sender">
        <strong>${CONFIG.SENDER_INFO.name}</strong> • ${CONFIG.SENDER_INFO.street} ${CONFIG.SENDER_INFO.city}<br>
        ${CONFIG.SENDER_INFO.phone} • ${CONFIG.SENDER_INFO.email}
      </div>

      <div class="recipient">
        Personalabteilung<br>
        <strong>${company}</strong><br>
        ${street}${city}
      </div>

      <div class="date">
        ${dateStr}
      </div>

      <div class="subject">
        Bewerbung als ${department}
      </div>

      <div class="content">
        ${aiData.cover_letter}
      </div>
    </body>
    </html>
  `;

  const safeCompanyName = company.replace(/[^a-zA-Z0-9]/g, "_");
  const blob = Utilities.newBlob(htmlContent, "text/html", `CoverLetter_${safeCompanyName}.html`);
  const pdfBlob = blob.getAs(MimeType.PDF);

  let folder = DriveApp.getRootFolder();
  if (CONFIG.PDF_FOLDER_ID) {
    try {
      folder = DriveApp.getFolderById(CONFIG.PDF_FOLDER_ID);
    } catch (e) {
      Logger.log("Drive folder not found by ID.");
    }
  }

  const file = folder.createFile(pdfBlob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

// ==========================================
// GOOGLE SHEETS LOGGER
// ==========================================
function writeToSheet(aiData) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getActiveSheet();
  
  const tracker = aiData.tracker_data;
  
  const rowData = [
    tracker.date,
    tracker.company || "Unknown",
    tracker.bereich || "Office",
    tracker.source || "Email-Alert",
    tracker.status || "Applied",
    tracker.channel || (aiData.contact_email ? "E-Mail" : "Website"),
    aiData.match_score + "%",
    aiData.template_used,
    aiData.contact_email || "-"
  ];
  
  sheet.appendRow(rowData);
  Logger.log("Row added to Google Sheet.");
}

// ==========================================
// GMAIL DRAFT CREATOR
// ==========================================
function createGmailDraft(aiData, originalSubject) {
  const recipient = aiData.contact_email;
  const subject = "Bewerbung - " + (aiData.tracker_data.bereich || "Employee");
  const body = aiData.cover_letter;
  
  const templateKey = aiData.template_used;
  const fileId = CONFIG.CV_FILES[templateKey];
  
  let attachments = [];
  if (fileId) {
    try {
      const file = DriveApp.getFileById(fileId);
      attachments.push(file.getAs(MimeType.PDF));
    } catch (e) {
      Logger.log("Error loading PDF CV: " + e.toString());
    }
  }

  GmailApp.createDraft(recipient, subject, body, {
    attachments: attachments
  });

  Logger.log("Draft created for: " + recipient);
}