# SBA Website

Static website for the Southland College School of Business and Accountancy, built from the SBA Website Figma designs. Open `index.html` in a browser to start. The site includes six main pages and five news articles, with desktop and phone layouts.

## Files

- The `.html` files contain the page content and navigation.
- `design.css` contains the compiled styles used by the Figma layouts. `site.css` contains the custom layout, form, menu, and chat styles.
- `script.js` runs the menu, built-in SBA chatbot, inquiry form, and introduction video. Edit the chatbot's answer lists there to update its replies.
- `assets/` contains the local artwork, icons, and Inter font.

## Configuration

Edit `site-config.js` to connect the external services.

| Setting | Value |
| --- | --- |
| `inquiryEndpoint` | An endpoint that accepts a multipart POST with `name`, `email`, `phone`, `topic`, and `message`. Use a same-origin endpoint or configure CORS for the deployed site. |
| `introductionVideoUrl` | Optional local path or HTTPS URL for a direct video file to replace the default YouTube embed. |

Until an inquiry endpoint is configured, the form explains that online submission is unavailable. The homepage links directly to the SBA office phone number and embeds the introduction from YouTube. The chatbot runs in the browser without external configuration.

For hosting, upload the HTML, CSS, JavaScript, and `assets/` directory together, keeping their paths intact. No build step is required.
