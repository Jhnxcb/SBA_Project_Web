const INQUIRY_SHEET_ID = "1UMpNrUgBUEASkohoDSBjCmhZZpnOXELY1jAqj0H6h70";
const INQUIRY_TAB = "Inquiries";
const INQUIRY_HEADERS = ["Received at", "Name", "Email", "Phone", "Topic", "Message", "Staff status", "Confirmation email", "Request ID"];

function setupInquiries() {
  const book = SpreadsheetApp.openById(INQUIRY_SHEET_ID);
  const sheet = book.getSheetByName(INQUIRY_TAB) || book.insertSheet(INQUIRY_TAB);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, INQUIRY_HEADERS.length).setValues([INQUIRY_HEADERS]).setFontWeight("bold").setBackground("#f1f3f4");
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, 9, 160);
    sheet.setColumnWidth(3, 235);
    sheet.setColumnWidth(6, 380);
  }
  // Request permission to send email without sending a setup message.
  MailApp.getRemainingDailyQuota();
}

function doPost(event) {
  const reply = (data) => ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  const secret = PropertiesService.getScriptProperties().getProperty("SBA_INQUIRY_SECRET");
  let inquiry;
  try {
    inquiry = JSON.parse(event.postData.contents);
  } catch (_) {
    return reply({ ok: false });
  }
  if (!secret || inquiry?.secret !== secret) return reply({ ok: false });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return reply({ ok: false });
  try {
    const sheet = SpreadsheetApp.openById(INQUIRY_SHEET_ID).getSheetByName(INQUIRY_TAB);
    if (!sheet) return reply({ ok: false });
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const prior = sheet.getRange(2, 9, lastRow - 1, 1).createTextFinder(inquiry.requestId).matchEntireCell(true).findNext();
      if (prior) return reply({ ok: true, confirmationSent: sheet.getRange(prior.getRow(), 8).getValue() === "Sent" });
    }

    const cache = CacheService.getScriptCache();
    const clientKey = "client:" + inquiry.clientKey;
    const requests = Number(cache.get(clientKey) || 0);
    if (requests >= 3) return reply({ ok: false, code: "rate_limit" });
    cache.put(clientKey, String(requests + 1), 600);

    sheet.appendRow([
      new Date(), safeCell(inquiry.name), safeCell(inquiry.email), inquiry.phone ? "'" + inquiry.phone : "",
      safeCell(inquiry.topic), safeCell(inquiry.message), "New", "Pending", inquiry.requestId,
    ]);
    SpreadsheetApp.flush();
    const confirmationCell = sheet.getRange(sheet.getLastRow(), 8);
    const recipientKey = "recipient:" + inquiry.email.toLowerCase();
    let confirmation = "Not sent";
    try {
      if (!cache.get(recipientKey) && MailApp.getRemainingDailyQuota() > 0) {
        cache.put(recipientKey, "1", 600);
        MailApp.sendEmail({
          to: inquiry.email,
          subject: "We received your SBA inquiry",
          body: "Thank you for contacting the School of Business and Accountancy at Southland College. We’ve received your inquiry and our team will get back to you.\n\nSBA Office\n(034) 4713 280",
          name: "Southland College SBA",
        });
        confirmation = "Sent";
      }
    } catch (_) {
      confirmation = "Send failed";
    }
    confirmationCell.setValue(confirmation);
    SpreadsheetApp.flush();
    return reply({ ok: true, confirmationSent: confirmation === "Sent" });
  } finally {
    lock.releaseLock();
  }
}

function safeCell(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}
