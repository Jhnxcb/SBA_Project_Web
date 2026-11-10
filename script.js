"use strict";

const pageMotion = matchMedia("(prefers-reduced-motion: no-preference)");
const restoredNavigation = performance.getEntriesByType("navigation")[0]?.type === "back_forward";

if (pageMotion.matches && !restoredNavigation && !location.hash) {
  const content = [...document.querySelectorAll("main")].find((main) => main.getClientRects().length);
  content?.classList.add("page-entering");
}

const config = window.SBA_CONFIG;
const chat = document.querySelector("#chat-panel");
const chatLauncher = document.querySelector("#chat-launcher");
const chatFallback = document.querySelector("#chat-fallback");
const chatBody = document.createElement("div");
chatBody.className = "sba-chat";
chatBody.innerHTML = `
  <div class="sba-chat-log" role="log" aria-label="Conversation" tabindex="0"></div>
  <form class="sba-chat-form">
    <input name="question" aria-label="Your question" placeholder="Ask about SBA…" maxlength="300" required>
    <button type="submit">Send</button>
  </form>
`;
chatFallback.replaceWith(chatBody);

const chatLog = chatBody.querySelector('[role="log"]');
const chatForm = chatBody.querySelector("form");
const chatInput = chatForm.elements.question;

function createChatAvatar() {
  const avatar = document.createElement("span");
  avatar.className = "sba-chat-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = "SBA";
  return avatar;
}

chat.querySelector("#chat-title").prepend(createChatAvatar());

const admissionsAnswers = [
  [/\b(transferee|transfer)\b/, "Transferees need an accomplished Registration and Admissions Form, official Transcript of Records, Certificate of Transfer Credential, photocopy of the NSO or PSA live birth certificate, and an advice slip from the Dean or Program Head."],
  [/\b(foreign|international)\b/, "Foreign students need an accomplished Registration and Admissions Form, scholastic records, travel documents, photocopy of the NSO or PSA live birth certificate, and an ACR I-Card."],
  [/\b(continuing|current student)\b/, "Continuing students need an accomplished Registration and Admissions Form and their prospectus with grades."],
  [/\b(new|returning|incoming|freshman|freshmen|first[- ]year)\b/, "New and returning students need an accomplished Registration and Admissions Form, School Form 9 (report card), and a photocopy of the NSO or PSA live birth certificate."],
];
const requirementsQuestion = /\b(requirements?|documents?|checklist|kailangan)\b/;
const enrollmentQuestion = /\b(apply|application|admissions?|enrol{1,2}(?:ment|ing)?|mag[- ]?enroll)\b/;
const contactReply = "I’m not sure about that. Please contact the SBA office or call (034) 4713 280 so the team can help you.";
const aboutLink = ["About SBA and the faculty directory", "about.html"];
const programsLink = ["View academic programs", "programs.html"];
const admissionsLink = ["View admissions and application steps", "admissions.html"];
const contactLink = ["Contact SBA", "contact.html"];
const facebookLinks = [
  ["SBA on Facebook", "https://www.facebook.com/SCBusinessAndAccountancy"],
  ["SCJBEX on Facebook", "https://www.facebook.com/SCJBEX/"],
  ["SCJPIA on Facebook", "https://www.facebook.com/SCJPIA"],
];
const staff = [
  ["Johnjay S. Barbadia, DM", "Dean"],
  ["Jan Mark P. Cahilig, CPA, MBA", "Program Head for BSA"],
  ["Edwin J. Banarjee, MBA", "Program Head for BSBA"],
  ["Jonalyn Torremoro, LPT", "OIC Program Head for BSEntrep"],
  ["Joey B. Orcena", "BSBA faculty member"],
  ["Mariel Ann L. Guiljon, CPA", "BSA faculty member"],
  ["Rene Talanquines, PhD", "BSA faculty member"],
  ["Adrian O. Rival, CPA", "BSA faculty member"],
];
const newsAnswers = [
  [/\bsouthland\s?fest\b/, "The Surging Dragons placed 1st Runner-Up Overall in SouthlandFest 2026 after five days of competition. The article is dated October 4, 2026.", ["SouthlandFest results", "southlandfest.html"]],
  [/\b(?:indakan|dance competition)\b/, "SBA won the championship at the 2026 Indakan Dance Competition during Southland College’s College Acquaintance Party.", ["Indakan championship story", "indakan-championship.html"]],
  [/\b(?:lakambini|lakandula|lakandiwa|ferraris|ocat)\b/, "Angel Camille Ferraris won Lakambini ng Wika 2026, Mutya ng Antigong Alab, and Binibining Liwayway. John Karlo Ocat placed 1st Runner-Up in Lakandula and won the Baganing Liwayway Award.", ["Lakambini and Lakandula results", "lakambini-and-lakandula.html"]],
  [/\b(?:freshiondayag|suyod|alvior)\b/, "At Freshiondayag on September 18, 2026, Alexander Dave Suyod represented BS Accountancy and Hazel Alvior earned the title of Ms. Freshiondayag 2026.", ["Freshiondayag story", "freshiondayag.html"]],
  [/\bsurging dragons\b/, "The Surging Dragons represent SBA. The Day 2 story covers their return to competition and their rallying cry, ‘Fall once, rise twice.’", ["Surging Dragons story", "surging-dragons.html"]],
];
const siteAnswers = [
  [/\b(?:japhet|gonzales|seminar)\b/, "The homepage features a JBEX seminar poster with guest speaker Japhet Gonzales. The poster lists October 27, 2026, from 8:00 to 11:30 AM at the Audio Visual Hall on the Southland College main campus.", [["View the seminar poster on the homepage", "index.html#announcements-title"]]],
  [/\b(?:scjbex|jbex|junior business executives)\b/, "The website links to the Southland College Junior Business Executives Facebook page.", [facebookLinks[1]]],
  [/\b(?:scjpia|jpia)\b/, "You can find SCJPIA on Facebook through the link listed on the website.", [facebookLinks[2]]],
  [/\b(?:facebook|fb|social media|socials|scbusinessandaccountancy)\b/, "The website lists three Facebook pages for department and student organization updates.", facebookLinks],
  ...newsAnswers.map(([pattern, message, link]) => [pattern, message, [link]]),
  [/\b(?:orientation|back to school|imbukada|midterm)\b/, "The homepage announcement grid includes posters for BSBA Orientation, Back to School featuring Imbukada 2026, and Midterm Exam Cutie.", [["View the homepage announcements", "index.html#announcements-title"]]],
  [/\b(?:news|announcements|sba events|recent events)\b|^events[?!.]*$/, "The News & Events page covers SouthlandFest, the Indakan championship, Lakambini and Lakandula, Freshiondayag, and the Surging Dragons.", [["Browse News & Events", "news.html"], ...newsAnswers.map(([, , link]) => link)]],
  ...staff.map(([name, role]) => {
    const surname = name.split(",")[0].split(" ").at(-1).toLowerCase();
    return [new RegExp("\\b" + surname + "\\b"), `${name} — ${role}.`, [aboutLink]];
  }),
  [/\b(?:program head|head of)\b.*\b(?:bsba|business administration)\b|\bbsba\b.*\b(?:program )?head\b/, `${staff[2][0]} is the Program Head for BSBA.`, [aboutLink]],
  [/\b(?:program head|head of)\b.*\b(?:bsa|accountancy)\b|\bbsa\b.*\b(?:program )?head\b/, `${staff[1][0]} is the Program Head for BSA.`, [aboutLink]],
  [/\b(?:program head|head of|oic)\b.*\b(?:bsentrep|entrepreneurship)\b|\bbsentrep\b.*\b(?:program )?head\b/, `${staff[3][0]} is the OIC Program Head for BSEntrep.`, [aboutLink]],
  [/\bdean\b/, `The SBA Dean is ${staff[0][0]}.`, [aboutLink]],
  [/\b(?:academic leadership|program heads?)\b/, staff.slice(0, 4).map(([name, role]) => `${name} (${role})`).join(" · "), [aboutLink]],
  [/\b(?:faculty|staff|teachers?|professors?)\b/, staff.map(([name, role]) => `${name} (${role})`).join("\n"), [aboutLink]],
  [/\b(?:mission|vision|core purpose|about sba|what is sba|what does sba stand for)\b/, "SBA is Southland College’s School of Business and Accountancy. Southland College’s mission is to develop enterprising minds and help students succeed in life and their careers. Its vision is to produce top-tier graduates who can succeed globally.", [aboutLink]],
  [/\b(?:why choose|experiential learning|curriculum)\b/, "SBA highlights industry-aligned coursework, hands-on learning through simulations and case studies, and guidance from experienced professionals and educators.", [programsLink]],
  [/\b(?:introduction video|intro video|youtube|department video)\b/, "You can watch the SBA introduction on the homepage or directly on YouTube.", [["SBA introduction on YouTube", "https://youtu.be/H1PbHxajBOk"]]],
  [/\b(?:bsba|business administration)\b/, "BSBA stands for Bachelor of Science in Business Administration. Its focus areas include Financial Management, Marketing Management, Human Resource Management, and Operations.", [programsLink]],
  [/\b(?:bsa|accountancy|cpa licensure)\b/, "BSA stands for Bachelor of Science in Accountancy. Its focus areas include Financial Reporting, Auditing and Assurance, Taxation, and Management Accounting. The program prepares students for the CPA Licensure Examination and corporate finance careers.", [programsLink]],
];
const chatAnswers = [
  [/^(?:hours?|oras)[\s?!.]*$|\b(?:office hours?|opening hours?|(?:office|sba)\s+(?:open|close)s?|(?:open|close)\s+(?:the\s+)?office)\b/i, "The SBA office is open Monday to Friday, from 8:00 AM to 5:00 PM.", [contactLink]],
  [/^(?:contact|phone|number|email|address|location)[\s?!.]*$|\b(?:contact (?:sba|you|details|number|info(?:rmation)?|the office)|phone number|office (?:phone|number|email|address|location)|campus (?:address|location)|(?:where|saan)\b.*\b(?:campus|office|sba|southland)|(?:call|email) (?:sba|you|the office))\b/i, "You can reach the SBA office at (034) 4713 280. The campus is on Rizal Street, Don Emilio Village, Kabankalan, Philippines, 6111.", [contactLink]],
  [requirementsQuestion, "Which student category applies to you? Type new, returning, continuing, transferee, or foreign student to get the right checklist.", [admissionsLink]],
  [enrollmentQuestion, "Prepare the documents for your student category, then visit the Registrar’s Office on campus to submit them and complete the final forms. After processing, you’ll receive your enrollment assessment. Ask me for the requirements for your student category.", [admissionsLink]],
  [/\b(programs?|courses?|degrees?|kurso)\b/i, "The Programs page lists the Bachelor of Science in Accountancy (BSA) and Bachelor of Science in Business Administration (BSBA).", [programsLink]],
];
const unpublishedQuestion = /\b(tuition|fees?|scholarships?|installments?|deadlines?|majors?|qualifying|retention|application status|payment|class schedules?|enrollment (dates?|schedule)|when .*(?:enroll|apply|admissions?))\b/;

function getChatReply(question) {
  const text = question.trim().toLowerCase().replace(/[’']/g, "");
  const phrase = text.replace(/[?!.]+$/, "").trim();
  if (/^(?:hi|hey|hello)(?:[ ,]+(?:there|sba|everyone|po))?$|^(?:good (?:morning|afternoon|evening|day)|kumusta|kamusta|mabuhay)(?: po)?$/.test(phrase)) {
    return ["Hi there! I’m the SBA chat assistant. Ask me about programs, admissions, faculty, news, or where to find us online."];
  }
  if (/^(?:thanks|thank you|salamat)(?: so much| very much| po)?$/.test(phrase)) {
    return ["You’re welcome! Feel free to ask if you have another question about SBA."];
  }
  if (/^(?:help|can you help(?: me)?|what can you (?:do|help me with))$/.test(phrase)) {
    return ["Of course! I can help you explore SBA programs, find your admission requirements, meet the faculty, or catch up on SBA news. What would you like to start with?"];
  }
  if (/^(?:how are you|hows it going|how are you doing)$/.test(phrase)) return ["I’m doing well, thanks for asking! What would you like to know about SBA?"];
  if (unpublishedQuestion.test(text)) return [contactReply, [contactLink]];
  if (/\bonline\b/.test(text) && enrollmentQuestion.test(text)) {
    return ["The published steps direct students to the Registrar’s Office on campus. Contact SBA to ask about online options.", [admissionsLink, contactLink]];
  }
  // Prefer the specific topic when a question also mentions a student category.
  const topic = chatAnswers.find(([pattern]) => pattern.test(text));
  const admissions = admissionsAnswers.find(([pattern]) => pattern.test(text));
  const studentCategory = /^(?:im (?:an? )?)?(?:new|returning|incoming|continuing|current|foreign|international|transferee|transfer|freshman|freshmen|first[- ]year)(?: student)?$/;
  if (admissions && (studentCategory.test(phrase) || topic?.[0] === requirementsQuestion || topic?.[0] === enrollmentQuestion)) return [admissions[1], [admissionsLink]];
  if (topic?.[0] === requirementsQuestion || topic?.[0] === enrollmentQuestion) return topic.slice(1);
  const answer = siteAnswers.find(([pattern]) => pattern.test(text)) ?? topic;
  return answer?.slice(1) ?? [contactReply, [contactLink]];
}

function createChatMessage(speaker, message, links = []) {
  const userMessage = speaker === "You";
  const row = document.createElement("div");
  row.className = "sba-chat-message";
  row.toggleAttribute("data-user-message", userMessage);
  if (!userMessage) row.append(createChatAvatar());

  const bubble = document.createElement("p");
  const sender = document.createElement("span");
  sender.className = "sr-only";
  sender.textContent = userMessage ? "You: " : "SBA assistant: ";
  bubble.append(sender, message);
  for (const [label, href] of links) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    bubble.append(link);
  }
  row.append(bubble);
  return row;
}

function sendChatQuestion(question) {
  const message = question.trim();
  if (!message) return;
  const typing = createChatMessage("SBA", "");
  typing.querySelector("p").insertAdjacentHTML("beforeend", `
    <span class="sr-only">Typing…</span>
    <span class="sba-chat-typing" aria-hidden="true"><span></span><span></span><span></span></span>
  `);
  chatLog.append(createChatMessage("You", message), typing);
  chatLog.scrollTop = chatLog.scrollHeight;
  setTimeout(() => {
    typing.replaceWith(createChatMessage("SBA", ...getChatReply(message)));
    chatLog.scrollTop = chatLog.scrollHeight;
  }, 700);
}

chatLog.append(createChatMessage("SBA", "Hi, welcome to SBA! What can I help you with today?"));
chatLog.insertAdjacentHTML("beforeend", `
  <details class="sba-chat-faq">
    <summary>Frequently asked questions</summary>
    <div class="sba-chat-faq-questions">
      <button type="button">What programs are offered?</button>
      <button type="button">How do I enroll?</button>
      <button type="button">Who is the dean?</button>
      <button type="button">What is the latest SBA news?</button>
      <button type="button">Where is SBA on Facebook?</button>
    </div>
  </details>
`);
chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendChatQuestion(chatInput.value);
  chatForm.reset();
  chatInput.focus({ preventScroll: true });
});
for (const button of chatLog.querySelectorAll(".sba-chat-faq button")) {
  button.addEventListener("click", () => sendChatQuestion(button.textContent));
}

chatLauncher.addEventListener("click", () => {
  if (chat.open) {
    chat.close();
    return;
  }
  chat.show();
  chatLog.scrollTop = chatLog.scrollHeight;
  chatLauncher.setAttribute("aria-expanded", "true");
  chat.querySelector("button").focus({ preventScroll: true });
});

chat.addEventListener("close", () => {
  chatLauncher.setAttribute("aria-expanded", "false");
  chatLauncher.focus({ preventScroll: true });
});
chat.addEventListener("keydown", (event) => {
  if (event.key === "Escape") chat.close();
});

const menu = document.querySelector("#mobile-menu");
const menuButton = document.querySelector("[data-open-menu]");
menuButton?.setAttribute("aria-expanded", "false");
menuButton?.addEventListener("click", () => {
  menu.showModal();
  menuButton.setAttribute("aria-expanded", "true");
  menu.querySelector("form button").focus({ preventScroll: true });
});
const desktopNavigation = matchMedia("(min-width: 72rem)");
menu?.addEventListener("close", () => {
  menuButton?.setAttribute("aria-expanded", "false");
  if (desktopNavigation.matches) document.querySelector(".site-header [aria-current]")?.focus({ preventScroll: true });
  else menuButton?.focus({ preventScroll: true });
});
desktopNavigation.addEventListener("change", (event) => {
  if (event.matches && menu?.open) menu.close();
});

const heroArtwork = document.querySelector(".hero-artwork");
if (heroArtwork) {
  const hero = heroArtwork.closest(".home-hero");
  const desktopPhoto = heroArtwork.querySelector("img");
  const mobilePhoto = hero.querySelector(".hero-photo img");
  const carouselControls = hero.querySelector(".hero-carousel-controls");
  const photos = [
    { src: desktopPhoto.getAttribute("src"), alt: desktopPhoto.alt },
    ...(config.heroPhotos ?? []),
  ];

  if (photos.length > 1) {
    const status = carouselControls.querySelector("[data-hero-status]");
    status.textContent = `1 / ${photos.length}`;
    let currentPhoto = 0;

    for (const button of carouselControls.querySelectorAll("[data-hero-step]")) {
      button.addEventListener("click", () => {
        currentPhoto = (currentPhoto + Number(button.dataset.heroStep) + photos.length) % photos.length;
        const { src, alt } = photos[currentPhoto];
        hero.toggleAttribute("data-extra-photo", currentPhoto !== 0);
        for (const image of [desktopPhoto, mobilePhoto]) {
          image.alt = alt;
          image.src = src;
        }
        status.textContent = `${currentPhoto + 1} / ${photos.length}`;
      });
    }

    carouselControls.hidden = false;
  }

  const animatedHero = matchMedia("(min-width: 64rem) and (prefers-reduced-motion: no-preference)");
  let fadeFrame = 0;

  function updateHeroFade() {
    fadeFrame = 0;
    if (!animatedHero.matches) {
      hero.style.removeProperty("--hero-fade-start");
      hero.style.removeProperty("--hero-actions-offset");
      hero.style.removeProperty("--hero-photo-opacity");
      return;
    }

    const { top, height } = hero.getBoundingClientRect();
    if (!height) return;
    const progress = Math.min(1, Math.max(0, -top / (height * 0.65)));
    hero.style.setProperty("--hero-fade-start", `${(64.4 - progress * 12).toFixed(2)}%`);
    hero.style.setProperty("--hero-actions-offset", `${((1 - progress) * 12).toFixed(2)}px`);
    hero.style.setProperty("--hero-photo-opacity", (1 - progress * 0.65).toFixed(2));
  }

  function scheduleHeroFade() {
    if (!fadeFrame) fadeFrame = requestAnimationFrame(updateHeroFade);
  }

  window.addEventListener("scroll", scheduleHeroFade, { passive: true });
  window.addEventListener("resize", scheduleHeroFade);
  animatedHero.addEventListener("change", scheduleHeroFade);
  scheduleHeroFade();
}

const revealableCards = document.querySelectorAll(
  '.announcements-grid li, [data-name="News / Article Card"], [data-name^="Profile Row / "] > [data-name^="Profile / "]',
);
if (pageMotion.matches && !restoredNavigation && revealableCards.length && "IntersectionObserver" in window) {
  const revealCards = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("card-entering");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.15 });

  for (const card of revealableCards) revealCards.observe(card);
}

for (const form of document.querySelectorAll("[data-inquiry-form]")) {
  const endpoint = config.inquiryEndpoint || "/api/inquiry";
  const usesGoogleSheet = !config.inquiryEndpoint;
  const status = form.querySelector("[role=status]");
  const submit = form.querySelector("[type=submit]");
  let previousPayload = "";
  let requestId;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    if (usesGoogleSheet && (!window.isSecureContext || location.protocol === "file:")) {
      status.textContent = "Please submit your inquiry from the live SBA website.";
      return;
    }
    submit.disabled = true;
    status.textContent = "Sending your inquiry…";
    try {
      const formData = new FormData(form);
      const options = { method: "POST", body: formData, headers: { Accept: "application/json" } };
      if (usesGoogleSheet) {
        const data = Object.fromEntries(formData);
        const payload = JSON.stringify(data);
        if (payload !== previousPayload) {
          requestId = crypto.randomUUID();
          previousPayload = payload;
        }
        options.body = JSON.stringify({ ...data, requestId });
        options.headers["Content-Type"] = "application/json";
      }
      const response = await fetch(endpoint, options);
      const result = usesGoogleSheet ? await response.json() : null;
      if (!response.ok || (usesGoogleSheet && !result?.ok)) {
        if (result?.code === "rate_limit") {
          status.textContent = "Too many inquiries were sent. Please wait a few minutes before trying again.";
          return;
        }
        if (result?.code === "unavailable") {
          status.textContent = "Online submission is currently unavailable. Please use the contact details above.";
          return;
        }
        if (result?.code === "invalid") {
          status.textContent = "Please check your details and keep your message under 3,000 characters.";
          return;
        }
        throw new Error("Submission failed");
      }
      form.reset();
      previousPayload = "";
      status.textContent = result?.confirmationSent
        ? "Your inquiry was received. A confirmation email was sent."
        : "Your inquiry was received.";
    } catch {
      status.textContent = "Your inquiry could not be sent. Please try again.";
    } finally {
      submit.disabled = false;
    }
  });
}

if (config.introductionVideoUrl) {
  for (const slot of document.querySelectorAll("[data-introduction-video]")) {
    const video = document.createElement("video");
    video.src = config.introductionVideoUrl;
    video.controls = true;
    video.preload = "none";
    video.setAttribute("aria-label", "Department introduction");
    slot.replaceChildren(video);
  }
}
