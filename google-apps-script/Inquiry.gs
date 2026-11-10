const INQUIRY_SHEET_ID = "1UMpNrUgBUEASkohoDSBjCmhZZpnOXELY1jAqj0H6h70";
const INQUIRY_TAB = "Inquiries";
const INQUIRY_HEADERS = ["Received at", "Name", "Email", "Phone", "Topic", "Message", "Staff status", "Confirmation email", "Request ID", "Ticket number"];

function setupInquiries() {
  const book = SpreadsheetApp.openById(INQUIRY_SHEET_ID);
  const sheet = book.getSheetByName(INQUIRY_TAB) || book.insertSheet(INQUIRY_TAB);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, INQUIRY_HEADERS.length).setValues([INQUIRY_HEADERS]).setFontWeight("bold").setBackground("#f1f3f4");
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, INQUIRY_HEADERS.length, 160);
    sheet.setColumnWidth(3, 235);
    sheet.setColumnWidth(6, 380);
  }
  const ticketHeader = sheet.getRange(1, 10);
  if (!ticketHeader.getValue()) {
    ticketHeader.setValue(INQUIRY_HEADERS[9]).setFontWeight("bold").setBackground("#f1f3f4");
    sheet.setColumnWidth(10, 160);
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
    if (!sheet || sheet.getRange(1, 10).getValue() !== INQUIRY_HEADERS[9]) return reply({ ok: false });
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const prior = sheet.getRange(2, 9, lastRow - 1, 1).createTextFinder(inquiry.requestId).matchEntireCell(true).findNext();
      if (prior) return reply({
        ok: true,
        confirmationSent: sheet.getRange(prior.getRow(), 8).getValue() === "Sent",
        ticket: sheet.getRange(prior.getRow(), 10).getValue(),
      });
    }

    const cache = CacheService.getScriptCache();
    const clientKey = "client:" + inquiry.clientKey;
    const requests = Number(cache.get(clientKey) || 0);
    if (requests >= 3) return reply({ ok: false, code: "rate_limit" });
    cache.put(clientKey, String(requests + 1), 600);

    const ticket = createTicketNumber(sheet, lastRow);
    sheet.appendRow([
      new Date(), safeCell(inquiry.name), safeCell(inquiry.email), inquiry.phone ? "'" + inquiry.phone : "",
      safeCell(inquiry.topic), safeCell(inquiry.message), "New", "Pending", inquiry.requestId, ticket,
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
          subject: "We received your SBA inquiry · " + ticket,
          body: "Thank you for contacting Southland College SBA. We’ve received your inquiry. Your ticket number is " + ticket + ". Keep it handy if you follow up.\n\nSBA Office\n(034) 4713 280",
          htmlBody: confirmationEmail(ticket),
          name: "Southland College SBA",
        });
        confirmation = "Sent";
      }
    } catch (_) {
      confirmation = "Send failed";
    }
    confirmationCell.setValue(confirmation);
    SpreadsheetApp.flush();
    return reply({ ok: true, confirmationSent: confirmation === "Sent", ticket });
  } finally {
    lock.releaseLock();
  }
}

function createTicketNumber(sheet, lastRow) {
  const existingTickets = lastRow > 1 ? sheet.getRange(2, 10, lastRow - 1, 1) : null;
  let ticket;
  do {
    const digits = parseInt(Utilities.getUuid().slice(0, 8), 16) % 1000000000;
    ticket = "SBA-" + String(digits).padStart(9, "0");
  } while (existingTickets && existingTickets.createTextFinder(ticket).matchEntireCell(true).findNext());
  return ticket;
}

function confirmationEmail(ticket) {
  return `
    <div style="background:#f2f5fa;padding:24px;font-family:Arial,sans-serif;color:#17233b">
      <div style="max-width:540px;margin:0 auto;background:#fff;border:1px solid #dbe5f2;border-radius:12px">
        <div style="background:#003399;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;font-weight:bold">
          Southland College · School of Business and Accountancy
        </div>
        <div style="padding:24px;line-height:1.6">
          <h1 style="margin:0 0 12px;font-size:22px">We received your inquiry</h1>
          <p>Thank you for contacting SBA. Our team will review your inquiry and get back to you.</p>
          <p style="background:#edf3ff;border-radius:8px;padding:12px 16px;color:#003399">
            Your ticket number<br><strong style="font-size:20px">${ticket}</strong>
          </p>
          <p>Please include this ticket number if you follow up with the SBA office.</p>
          <p style="margin-bottom:0">SBA Office · <a href="tel:+63344713280" style="color:#003399">(034) 4713 280</a></p>
        </div>
      </div>
    </div>`;
}

function safeCell(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}
