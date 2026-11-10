# SBA Website

Static website for the Southland College School of Business and Accountancy, built from the SBA Website Figma designs. Open `index.html` in a browser to start. The site includes six main pages and five news articles, with desktop and phone layouts.

## Files

- The `.html` files contain the page content and navigation.
- `design.css` contains the compiled styles used by the Figma layouts. `site.css` contains the custom layout, form, menu, and chat styles.
- `script.js` runs the menu, built-in SBA chatbot, inquiry form, and introduction video. Update the chatbot's answer lists when faculty, admissions, programs, news, or social links change.
- `assets/` contains the local artwork, icons, and Inter font.

## Configuration

Edit `site-config.js` to connect the external services.

| Setting | Value |
| --- | --- |
| `inquiryEndpoint` | Optional custom endpoint that accepts a multipart POST. Leave blank to use the Vercel `/api/inquiry` route for Google Sheets. |
| `introductionVideoUrl` | Optional local path or HTTPS URL for a direct video file to replace the default YouTube embed. |

The homepage embeds the introduction from YouTube. The chatbot runs in the browser without external configuration.

### Google Sheets inquiry setup

1. Open the **SBA Inquiries** spreadsheet as its owner and keep General access set to **Restricted**. Open **Extensions → Apps Script** and paste the contents of `google-apps-script/Inquiry.gs` into the editor.
2. Run `setupInquiries` from the Apps Script editor and approve Sheets and email permissions. This creates the **Inquiries** tab and sends no email.
3. In **Project Settings → Script properties**, add `SBA_INQUIRY_SECRET` with a long random value from a password manager. Keep that value private.
4. Choose **Deploy → New deployment → Web app**, execute as **Me**, and allow **Anyone** to call the web app. Requests still need the matching server secret to write a row or send mail. Copy the deployed `/exec` URL.
5. In the Vercel project’s **Settings → Environment Variables**, set `SBA_INQUIRY_SCRIPT_URL` to the `/exec` URL and `SBA_INQUIRY_SECRET` to the same private value. Apply both to Production and deploy the site with `api/inquiry.js` included.
6. Submit a test from the live Contact page using an email address you control. Check for a single row and a **Sent** value in the **Confirmation email** column, then check your inbox.

The sheet records an inquiry before attempting the confirmation. If the email cannot be sent, the inquiry stays in the sheet and the confirmation status shows the outcome. Apps Script sends the confirmation from the account that deploys the web app.

For hosting, upload the HTML, CSS, JavaScript, and `assets/` directory together, keeping their paths intact. No build step is required.
