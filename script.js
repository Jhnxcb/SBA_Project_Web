"use strict";

function animatePageEntrance() {
  const content = [...document.querySelectorAll("main")].find((main) => main.getClientRects().length);
  if (!content?.animate) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const keyframes = reducedMotion
    ? [{ opacity: 0.55 }, { opacity: 1 }]
    : [{ opacity: 0.15, translate: "0 1.5rem" }, { opacity: 1, translate: "0 0" }];
  content.animate(keyframes, { duration: reducedMotion ? 240 : 700, easing: "ease-out" });
}

animatePageEntrance();
window.addEventListener("pageshow", (event) => {
  if (event.persisted) animatePageEntrance();
});

const config = window.SBA_CONFIG;
const chat = document.querySelector("#chat-panel");
const chatLauncher = document.querySelector("#chat-launcher");
const chatFallback = document.querySelector("#chat-fallback");
const chatBody = document.createElement("div");
chatBody.className = "sba-chat";
chatBody.innerHTML = `
  <div class="sba-chat-log" role="log" aria-label="Conversation" tabindex="0"></div>
  <div class="sba-chat-topics" aria-label="Suggested questions" role="group">
    <button type="button">Programs</button>
    <button type="button">Enrollment</button>
    <button type="button">Office hours</button>
  </div>
  <form class="sba-chat-form">
    <input name="question" aria-label="Your question" placeholder="Ask about SBA…" maxlength="300" required>
    <button type="submit">Send</button>
  </form>
  <a href="contact.html">Contact SBA</a>
`;
chatFallback.replaceWith(chatBody);

const chatLog = chatBody.querySelector('[role="log"]');
const chatForm = chatBody.querySelector("form");
const chatInput = chatForm.elements.question;
const admissionsAnswers = [
  [/\b(transferee|transfer)\b/, "Transferees need an accomplished Registration and Admissions Form, official Transcript of Records, Certificate of Transfer Credential, photocopy of the NSO or PSA live birth certificate, and an advice slip from the Dean or Program Head."],
  [/\b(foreign|international)\b/, "Foreign students need an accomplished Registration and Admissions Form, scholastic records, travel documents, photocopy of the NSO or PSA live birth certificate, and an ACR I-Card."],
  [/\b(continuing|current student)\b/, "Continuing students need an accomplished Registration and Admissions Form and their prospectus with grades."],
  [/\b(new|returning|incoming|freshman|freshmen|first[- ]year)\b/, "New and returning students need an accomplished Registration and Admissions Form, School Form 9 (report card), and a photocopy of the NSO or PSA live birth certificate."],
];
const requirementsQuestion = /\b(requirements?|documents?|checklist|kailangan)\b/;
const enrollmentQuestion = /\b(apply|application|admissions?|enrol{1,2}(?:ment|ing)?|mag[- ]?enroll)\b/;
const contactReply = "I’m not sure about that. Please use the Contact SBA link below or call (034) 4713 280 so the office can help you.";
const chatAnswers = [
  [/\b(tuition|fees?|scholarships?|installments?|deadlines?|majors?|qualifying|retention|application status|payment|class schedules?|enrollment (dates?|schedule)|when .*(?:enroll|apply|admissions?))\b/i, "Please call (034) 4713 280 or use the Contact SBA link for the latest information. For application status, contact the Registrar’s Office."],
  [/\b(online)\b/i, "The published enrollment steps direct students to the Registrar’s Office on campus. Call (034) 4713 280 to ask about online options."],
  [/^(?:hours?|oras)[\s?!.]*$|\b(?:office hours?|opening hours?|(?:office|sba)\s+(?:open|close)s?|(?:open|close)\s+(?:the\s+)?office)\b/i, "The SBA office is open Monday to Friday, from 8:00 AM to 5:00 PM."],
  [/^(?:contact|phone|number|email|address|location)[\s?!.]*$|\b(?:contact (?:sba|you|details|number|info(?:rmation)?|the office)|phone number|office (?:phone|number|email|address|location)|campus (?:address|location)|(?:where|saan)\b.*\b(?:campus|office|sba|southland)|(?:call|email) (?:sba|you|the office))\b/i, "You can reach the SBA office at (034) 4713 280. The campus is on Rizal Street, Don Emilio Village, Kabankalan, Philippines, 6111."],
  [/\b(programs?|courses?|degrees?|bsa|bsba|accountancy|business administration|kurso)\b/i, "SBA offers a Bachelor of Science in Accountancy (BSA), which covers accounting, auditing, and taxation, and a Bachelor of Science in Business Administration (BSBA), which covers management, marketing, finance, and entrepreneurship."],
  [requirementsQuestion, "Which student category applies to you? Type new, returning, continuing, transferee, or foreign student to get the right checklist."],
  [enrollmentQuestion, "Prepare the documents for your student category, then visit the Registrar’s Office on campus to submit them and complete the final forms. After processing, you’ll receive your enrollment assessment. Ask me for the requirements for your student category."],
];

function getChatReply(question) {
  const text = question.trim().toLowerCase().replace(/[’']/g, "");
  const phrase = text.replace(/[?!.]+$/, "").trim();
  if (/^(?:hi|hey|hello)(?:[ ,]+(?:there|sba|everyone|po))?$|^(?:good (?:morning|afternoon|evening|day)|kumusta|kamusta|mabuhay)(?: po)?$/.test(phrase)) {
    return "Hi there! I’m the SBA chat assistant. What can I help you with today? You can ask about our programs, admission requirements, or how to enroll.";
  }
  if (/^(?:thanks|thank you|salamat)(?: so much| very much| po)?$/.test(phrase)) {
    return "You’re welcome! Feel free to ask if you have another question about SBA.";
  }
  if (/^(?:help|can you help(?: me)?|what can you (?:do|help me with))$/.test(phrase)) {
    return "Of course! I can help you explore SBA programs, find your admission requirements, or learn how to enroll. What would you like to start with?";
  }
  // Prefer the specific topic when a question also mentions a student category.
  const topic = chatAnswers.find(([pattern]) => pattern.test(text));
  const admissions = admissionsAnswers.find(([pattern]) => pattern.test(text));
  const studentCategory = /^(?:im (?:an? )?)?(?:new|returning|incoming|continuing|current|foreign|international|transferee|transfer|freshman|freshmen|first[- ]year)(?: student)?$/;
  if (admissions && (studentCategory.test(phrase) || topic?.[0] === requirementsQuestion || topic?.[0] === enrollmentQuestion)) return admissions[1];
  return topic?.[1] ?? contactReply;
}

function appendChatMessage(speaker, message) {
  const bubble = document.createElement("p");
  bubble.toggleAttribute("data-user-message", speaker === "You");
  bubble.textContent = `${speaker}: ${message}`;
  chatLog.append(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function sendChatQuestion(question) {
  if (!question.trim()) return;
  appendChatMessage("You", question.trim());
  appendChatMessage("SBA", getChatReply(question));
}

appendChatMessage("SBA", "Hi, welcome to SBA! What can I help you with today?");
chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendChatQuestion(chatInput.value);
  chatForm.reset();
  chatInput.focus();
});
for (const button of chatBody.querySelectorAll(".sba-chat-topics button")) {
  button.addEventListener("click", () => sendChatQuestion(button.textContent));
}

chatLauncher.addEventListener("click", () => {
  if (chat.open) {
    chat.close();
    return;
  }
  chat.show();
  chatLauncher.setAttribute("aria-expanded", "true");
  chat.querySelector("button").focus();
});

chat.addEventListener("close", () => {
  chatLauncher.setAttribute("aria-expanded", "false");
  chatLauncher.focus();
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
  menu.querySelector("form button").focus();
});
const desktopNavigation = matchMedia("(min-width: 72rem)");
menu?.addEventListener("close", () => {
  menuButton?.setAttribute("aria-expanded", "false");
  if (desktopNavigation.matches) document.querySelector(".site-header [aria-current]")?.focus();
  else menuButton?.focus();
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

  const animatedHero = matchMedia("(prefers-reduced-motion: no-preference)");
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

const announcementCards = document.querySelectorAll(".announcements-grid li");
if (announcementCards.length && "IntersectionObserver" in window) {
  const revealCards = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-entering");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.15 });

  for (const card of announcementCards) revealCards.observe(card);
}

for (const form of document.querySelectorAll("[data-inquiry-form]")) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector("[role=status]");
    if (!config.inquiryEndpoint) {
      status.textContent = "Online submission is currently unavailable. Please use the contact details above.";
      return;
    }
    const submit = form.querySelector("[type=submit]");
    submit.disabled = true;
    status.textContent = "Sending your inquiry…";
    try {
      const response = await fetch(config.inquiryEndpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Submission failed");
      form.reset();
      status.textContent = "Your inquiry was sent.";
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
