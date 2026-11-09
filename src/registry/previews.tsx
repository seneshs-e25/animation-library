"use client";

import { useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import type { ControlValues } from "./types";
import { FillSweepButton } from "./interactions/button-hovers/fill-sweep-button";
import { CornerBloomButton } from "./interactions/button-hovers/corner-bloom-button";
import { GhostFillButton } from "./interactions/button-hovers/ghost-fill-button";
import { ColorSnapButton } from "./interactions/button-hovers/color-snap-button";
import { CircleRevealButton } from "./interactions/button-hovers/circle-reveal-button";
import { OutlineSweepButton } from "./interactions/button-hovers/outline-sweep-button";
import { ZoomImageCard } from "./interactions/image-hovers/zoom-image-card";
import { RevealLinkCard } from "./interactions/image-hovers/reveal-link-card";
import { RisingCopyCard } from "./interactions/image-hovers/rising-copy-card";
import { BentoGrid, type BentoTile } from "./interactions/image-hovers/bento-grid";
import { LogoMarquee } from "./animations/carousels/logo-marquee";
import { CardMarquee } from "./animations/carousels/card-marquee";
import { StackingCards } from "./animations/pin-scrollers/stacking-cards";
import { FocusScroll } from "./animations/pin-scrollers/focus-scroll";
import { CollapsingStack } from "./animations/pin-scrollers/collapsing-stack";
import { ExpandingCards } from "./animations/carousels/expanding-cards";
import { SpotlightSlider, SpotlightSlide } from "./animations/carousels/spotlight-slider";
import { AwardsCarousel } from "./animations/carousels/awards-carousel";
import { ScrollTextReveal } from "./animations/scroll-triggers/scroll-text-reveal";
import { CountUp } from "./animations/text-effects/count-up";
import { ScrollShiftHeadline } from "./animations/scroll-triggers/scroll-shift-headline";
import { RisingHeadline } from "./animations/text-effects/rising-headline";
import { WaveHeadline } from "./animations/text-effects/wave-headline";
import { ScrollColorBackground } from "./animations/scroll-triggers/scroll-color-background";
import { FaqAccordion } from "./animations/accordions/faq-accordion";
import { ProgressTabs } from "./animations/tabs/progress-tabs";
import { StepTabs } from "./animations/tabs/step-tabs";
import { VerticalTabSlider } from "./animations/tabs/vertical-tab-slider";
import { Bricolage_Grotesque, Hanken_Grotesk, Instrument_Sans, Inter_Tight, Lexend_Exa, Mona_Sans, Space_Mono } from "next/font/google";
import { Aurora } from "./shaders/backgrounds/aurora";
import { Curtain } from "./shaders/backgrounds/curtain";

/** The four "problem" cards from the Seemplicity homepage, with its live images and copy. */
const seemplicityUpload = (path: string) => `https://seemplicity.ai/wp-content/uploads/${path}`;
const seemplicityProblems = [
  {
    image: "2026/04/action_matters_image1.webp",
    title: "AI Infiltration",
    lead: "Machine-speed attacks with AI exploits",
    body: "Human-led defenses can\u2019t keep up with 10x threat volume.",
  },
  {
    image: "2026/04/action_matters_image2.webp",
    title: "Fragmented Noise",
    lead: "Siloed tools and unprioritized alerts",
    body: "Critical risks stay buried under mountains of disconnected data.",
  },
  {
    image: "2026/04/action_matters_image3.webp",
    title: "Unclear Ownership",
    lead: "Unowned assets and misrouted ticketing",
    body: "Tickets get misrouted, work stalls, and remediation cycles drag on.",
  },
  {
    image: "2026/04/action_matters_image4_2x.webp",
    title: "Manual Reporting",
    lead: "Progress tracked via spreadsheets and emails",
    body: "Compliance falls behind the paces of modern, evolving threats.",
  },
];

/** One Seemplicity problem card: image on the left, icon, title and copy on the right. */
function SeemplicityCard({ image, title, lead, body }: (typeof seemplicityProblems)[number]) {
  return (
    <div className={`${monaSans.className} grid h-full min-h-[inherit] grid-cols-1 text-white md:grid-cols-[53.5%_1fr]`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={seemplicityUpload(image)}
        alt=""
        className="h-40 w-full object-cover md:h-full"
      />
      <div className="flex flex-col justify-between gap-6 p-6 md:gap-10 md:p-[60px_60px_60px_15px]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={seemplicityUpload("2026/02/ibm-toolchain-1.svg")} alt="" className="mb-5 size-8" />
          <h3 className={`${hankenGrotesk.className} text-[28px] leading-none font-light tracking-[-0.02em] md:text-[36px]`}>
            {title}
          </h3>
        </div>
        <div className="max-w-[380px]">
          <p className="mb-2.5 text-[20px] leading-[1.2] font-bold md:text-[22px]">{lead}</p>
          <p className="text-base leading-[1.4] text-white/50">{body}</p>
        </div>
      </div>
    </div>
  );
}

/** The three cards from the Sophos homepage's focus scroll, with its live assets. */
const sophosFocusItems = [
  {
    image: "blt42a78cf9d8648881/6a54d4dad673fe0078ddeac3/compounding-intellingence.png",
    alt: "Compounding Intelligence",
    title: "Compounding Intelligence",
    body: "Every new threat seen across the 625,000+ organizations Sophos defends elevates protection for all, automatically. The system does not just get bigger; it gets smarter.",
    cta: "About Sophos Fusion",
  },
  {
    image: "blte650b166bed241e4/6a54d52becf12353050b02aa/fusion-ai.png",
    alt: "Fusion AI",
    title: "Fusion AI",
    body: "Fusion AI is the intelligence layer within Sophos Fusion. Fusion AI handles the speed and scale. Human experts own the trust boundary and remain accountable.",
  },
  {
    image: "bltd70a872aa22945b2/693bb2b3e6132f47d358208a/new3.webp",
    alt: "Sophos Integrations",
    title: "Open Ecosystem",
    body: "Sophos Fusion is fully open, integrating natively with Sophos solutions and 500+ third-party technologies.",
    cta: "Integrations with Sophos",
  },
];

/** Sophos's white text link: label plus an arrow that nudges right on hover. */
function SophosArrowLink({ children, color }: { children: ReactNode; color: string }) {
  return (
    <a
      href="#"
      style={{ color }}
      className="group/link relative flex pr-[25px] font-sans text-[14px] leading-[1.3] font-bold tracking-[-0.01em]"
    >
      {children}
      <svg
        aria-hidden
        viewBox="140 10 14 10"
        className="absolute top-[calc(50%-5px)] right-[5px] h-[10px] w-[14px] transition-[right] duration-100 ease-linear min-[1280px]:group-hover/link:right-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      >
        <path d="M148.301 11L152.301 15L148.301 19" strokeLinejoin="round" />
        <path d="M151.699 15H141.699" />
      </svg>
    </a>
  );
}

const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"] });
const interTight = Inter_Tight({ weight: ["100", "300", "400"], subsets: ["latin"] });
const lexendExa = Lexend_Exa({ weight: ["300", "400"], subsets: ["latin"] });
const instrumentSans = Instrument_Sans({ subsets: ["latin"] });
const hankenGrotesk = Hanken_Grotesk({ weight: ["200", "300", "400"], subsets: ["latin"] });
const monaSans = Mona_Sans({ subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ weight: ["300"], subsets: ["latin"] });

/** The seven award badges from Seemplicity's /why page (WordPress uploads). */
const awards = [
  { badge: "2026/02/image-906.svg", name: "CyberSecurity Breakthrough Award" },
  { badge: "2026/02/image-883.svg", name: "SINET16 Award" },
  { badge: "2026/04/CRN-Stellar-Startups-Award.png", name: "CRN Stellar Startups" },
  { badge: "2026/04/Cyber-Defense-Global-Infosec-Awards-Logo-2025.1.png", name: "2\u00d7 Global Infosec Awards" },
  { badge: "2026/04/Gartner-Cool-Vendor-2023.png", name: "Gartner Cool Vendor" },
  { badge: "2026/04/Globee-logo.png", name: "Silver Globee Award Winner" },
  { badge: "2026/04/IntellyX-Award.png", name: "Intellyx Digital Innovator" },
];

/** Contentstack asset URL, resized and converted on the fly. */
const sophosAsset = (path: string, width: number) =>
  `https://images.contentstack.io/v3/assets/blt38f1f401b66100ad/${path}?width=${width}&quality=80&format=auto`;

const SOPHOS_PLAY = "bltca7dff4bb3f5f3f3/68be735553f91553ee14919c/play.png";

/** The four testimonials from the Sophos homepage's slider, with its live assets. */
const sophosStories = [
  {
    company: "Executech",
    logo: "blt2478904f49048dc8/691c14bdb48b452fde3f7ead/Executech-Logo-color.png",
    image: "bltd836ca65b829760c/693bb9fd272fd0afc63fee5c/video-executech.webp",
    quote:
      "Our partnership with Sophos is so powerful because they do have folks watching 24/7. Without that type of speed, the attacks are successful, in the order of hundreds of thousands, if not millions, of dollars.",
    name: "Tyler Rasmussen",
    role: "VP of Cybersecurity, Executech",
  },
  {
    company: "Canucks Sports & Entertainment",
    logo: "bltffb906c544188c4a/691c142daf699df92ae164bc/Rogers_Arena_Logo-color.png",
    image: "bltee40cd6799851cf0/693bba7ace3188997b2c7476/video-rogers-arena-1_(1).webp",
    quote:
      "We need to make sure we have a product that can protect everybody. What Sophos provides us is one central way where we can protect the data.",
    name: "Tim Hemming",
    role: "Director of IT, Canucks Sports & Entertainment",
  },
  {
    company: "Thrive Pet Healthcare",
    logo: "bltfe329ff4ba4835c2/6946c61267fae3424a0489e4/Thrive.png",
    image: "bltbb955f04f06168d2/693bbab032d9c058ab57ef22/video-thrive-pet-1_(2).webp",
    quote:
      "Sophos Managed Detection and Response helps us look at every single endpoint, look at the activities, and spot something potentially malicious, so that I do not have a virus propagation throughout our environment.",
    name: "Tony Ombellaro",
    role: "Senior Director of Information Security, Thrive Pet Health Care",
  },
  {
    company: "KDC/ONE",
    logo: "bltb0b6230505405f80/69205738cd0826d083c71c06/logo_2.png",
    image: "bltae55dc1c8e6640d5/693bbae063486e092d07cfde/video-kdc-one-1_(1).webp",
    quote:
      "If we get cyber attacked, production stops. Reputation of the company would be harmed. Hackers know that. The power is to discover and react.",
    name: "Robert J. Laurin",
    role: "IT VP Security and Operations, KDC/ONE",
  },
];

/** The four agent tabs from the Seemplicity homepage, with its live images and copy. */
const analystSteps = [
  {
    label: "/context",
    image: "2026/04/AI-agents-team-provide-Image-1-1.webp",
    title: "Determine if it matters to the business.",
    body: "Apply organizational context to every finding. Automatically weigh asset value against threat criticality to separate production emergencies from low-impact test server noise.",
  },
  {
    label: "/strategy",
    image: "2026/04/AI-agents-team-provide-Image-2.webp",
    title: "Turn the backlog into a plan of action.",
    body: "Transform a mountain of issues into a roadmap of projects. Synthesize thousands of findings into root-cause groups, like turning 50 alerts into one single patch.",
  },
  {
    label: "/validation",
    image: "2026/04/AI-agents-team-provide-Image-3.webp",
    title: "Verify that the risk is actually reachable.",
    body: "Stop false alarms at the door by verifying exploitability and reachability within your specific execution environment to ensure focus on real threats.",
  },
  {
    label: "/remediation",
    image: "2026/04/AI-agents-team-provide-Image-4.webp",
    title: "Get the fix across the finish line.",
    body: "Bridge the security-engineering gap with org-aware routing and tailored, step-by-step guidance formatted perfectly for your development tools.",
  },
];

/** The five benefit cards from Seemplicity's "Centralize exposure data" page, with its live icons and copy. */
const seemplicityBenefits = [
  {
    icon: "2026/02/icons8-badge-1.svg",
    title: "Ensure Audit Readiness",
    body: "Maintain continuous visibility with traceable, inspection-ready remediation records.",
  },
  {
    icon: "2026/02/ccwi-icon-1.svg",
    title: "Reduce Findings Backlog",
    body: "Automatically aggregate findings into consolidated fixes to shrink overwhelming backlogs.",
  },
  {
    icon: "2026/02/ccwi-icon-5.svg",
    title: "Prioritize High-Impact Risks",
    body: "Focus teams on the exposures that matter most using automated risk scoring.",
  },
  {
    icon: "2026/02/icons8-automation-1-1.svg",
    title: "Automate Vulnerability Management",
    body: "Replace manual triage with intelligent workflows that ingest and route tasks.",
  },
  {
    icon: "2026/02/icons8-management-1.svg",
    title: "Improve Cross-Team Alignment",
    body: "Unify security and IT around a single source of truth to speed up fixes.",
  },
];

/** The three steps from the Seemplicity "Why" page, with its live icons, images and copy. */
const seemplicitySteps = [
  {
    label: "Collect",
    icon: "2026/03/Tab-Slider-with-Media-1.svg",
    image: "2026/04/your_backlog_doesn_t_stand_a_chance_image_2_2x.webp",
    title: "Consolidate and normalize every signal.",
    body: "Stop wrestling with mismatched data formats. Seemplicity ingests findings from your security stack and normalizes them into a unified schema. By standardizing findings, we create a consistent data layer ready for analysis and action.",
  },
  {
    label: "Contextualize",
    icon: "2026/03/Tab-Slider-with-Media-3.svg",
    image: "2026/04/your_backlog_doesn_t_stand_a_chance_image_3_2x.webp",
    title: "Decipher the noise with intelligent context.",
    body: "Our advanced AI agents analyze your infrastructure map and business hierarchy. By automatically correlating findings with asset value and exposure, Seemplicity filters out the noise and spotlights the critical issues that demand verified priority.",
  },
  {
    label: "Close",
    icon: "2026/03/Tab-Slider-with-Media-2.svg",
    image: "2026/04/your_backlog_doesn_t_stand_a_chance_image_4_2x.webp",
    title: "Make resolution seamless.",
    body: "Set your engineering teams up for success. We deliver prioritized fix requests, enriched with context and remediation guidance, into their native tools, making it easy for them to fix problems and for you to verify closure.",
  },
];

/** Fictional rows for the collapsing stack demo. */
/** The three rows from NetApp AI's "Independent and massive scale" section, with its live art (Contentstack URLs). */
const netappRows = [
  {
    title: "More CPU and throughput",
    body: "As nodes are added to an AFX cluster, more CPU, RAM, and network resources are introduced into the workload.",
    image: "blt5bf7fde929bd9e96/6ab8b5dfc01db3a5695527c7/More_CPU_and_throughput.webp",
    alt: "Linear performance increases with NetApp AFX node additions",
  },
  {
    title: "More storage capacity and disk performance",
    body: "Conversely, if the requirement is capacity, only shelves would need to be added to the mix.",
    image: "blt35480dfc053fadbf/6ab8b63ac01db33cbe5527cb/Increased_storage_and_disk_speed.webp",
    alt: "Two servers added to a row of five, with rising Storage and Speed gauges showing scalable capacity and performance.",
  },
  {
    title: "Zero Copy Volume Move (ZCVM)",
    body: "AFX relies on the Zero Copy Volume Move (ZCVM) technology to relocate volumes using metadata updates instead of copying the data.",
    image: "blt9580c53715fe37cb/6ab8b86bc418c36c78f9f9a4/Zero_Copy_Volume_Move_(ZCVM).webp",
    alt: "Linear performance increases with NetApp AFX node additions",
  },
];

/**
 * The five customer stories from the Ironclad homepage, with its live photos,
 * logos and quotes (WordPress uploads, at the 1024px size the site serves).
 */
const ironcladUpload = (path: string) => `https://ironcladapp.com/wp-content/uploads/${path}`;
const stories = [
  {
    company: "Heineken",
    image: "2026/09/homepage_heineken_customerstory_1024x588_2x-1024x588.webp",
    alt: "Two women smiling and holding glasses of beer in a colorful bar with neon green lights.",
    logo: "2026/09/customerstories_heineken_logo_336x132_2x-1.webp",
    logoWidth: 190,
    lead: "When contract data is structured and searchable, you can make better decisions. You can answer questions in minutes rather than days. You can identify risks and you have more opportunities for the business.",
    bold: "",
    tail: "",
  },
  {
    company: "Benjamin Moore",
    image: "2025/10/BM-Thumb-1024x588.jpg",
    alt: "Anik Sood, Benjamin Moore",
    logo: "2025/10/BM-logo.svg",
    logoWidth: 190,
    lead: "Ironclad takes what was a highly manual, inefficient process and ",
    bold: "makes it easy and enjoyable to collaborate on contracts",
    tail: " across our departments.",
  },
  {
    company: "Calm",
    image: "2025/09/HOMEPAGE-VIDEO-CALM@2x-1024x588.webp",
    alt: "Man looking off to the side, softly smiling.",
    logo: "2025/09/calm.svg",
    logoWidth: 106,
    lead: "The content team has been blown away by the speed with which we\u2019re able to get contracts done using Ironclad. It\u2019s been ",
    bold: "a game changer",
    tail: " for us.",
  },
  {
    company: "L\u2019Or\u00e9al",
    image: "2025/09/HOMEPAGE-VIDEO-LOREAL@2x-1024x588.webp",
    alt: "Man standing in front of plants, smiling.",
    logo: "2025/06/LOreal_logo-1-1.svg",
    logoWidth: 172,
    lead: "Ironclad went from a tool for lawyers to a ",
    bold: "full-on collaboration platform",
    tail: " for everyone in the contracting process, from Sourcing to Finance to IT.",
  },
  {
    company: "Gong",
    image: "2025/09/HOMEPAGE-VIDEO-GONG@2x-1024x588.webp",
    alt: "Purple square with a smile on it.",
    logo: "2025/09/gong.png",
    logoWidth: 177,
    lead: "Our whole team has found the interface to be ",
    bold: "really user friendly",
    tail: " with Ironclad. I feel like I could add anyone to the system, non-lawyer or lawyer, and they could figure out how to use it and how to find things.",
  },
];

/**
 * The award badges from the Sophos homepage's logo carousel (Contentstack
 * URLs, requested at 2x the 80px display height). They aren't links there;
 * the demo links them so the hover grow-and-pause can be tried.
 */
const sophosBadges = [
  ["blt4124e4a7728eca52/68bfd94a4a2c2d0c93120daa/logo1.svg", 212, "Leading Security Professional - IDC"],
  ["bltedd2215ee779ae09/68bfd97a2607de7389581be5/logo3.svg", 190, "Award badge 2"],
  ["bltbeb58dcd136cc453/68bfd9b29594d8214e3f11f4/logo2.svg", 228, "Award badge 3"],
  ["blt39a5c8a3df6dffc5/68bfd9df5f14882ccd08bff3/logo4.svg", 174, "Award badge 4"],
  ["blt04ade86f97fb2ced/68bfda15cf846b59a63a3009/logo5.svg", 420, "Award badge 5"],
  ["blt730d903d1656032b/68bfda45a726cb16c3e18263/logo6.svg", 100, "Award badge 6"],
  ["blt1416d763e609eafe/68bfda62ecaecc77acf65b9e/logo-6.svg", 226, "Award badge 7"],
  ["bltc46d7e64be517bbe/691d76a35fca1a19c2e05c56/logo5_2.svg", 420, "Award badge 8"],
  ["blt2c7b24f932c86132/691d76bde2e2cd28abcbb7a2/logo5_1.svg", 420, "Award badge 9"],
].map(([path, width, alt]) => ({
  src: `https://images.contentstack.io/v3/assets/blt38f1f401b66100ad/${path}?width=${width}`,
  alt: alt as string,
  href: "#",
}));

/** A single count-up number, with a Replay button since the count runs once. */
function CountUpDemo({ values }: { values: ControlValues }) {
  const [run, setRun] = useState(0);
  return (
    <div className={`${interTight.className} flex flex-col items-center gap-8`}>
      <CountUp
        key={`${run}-${values.value}-${values.duration}-${values.easing}-${values.threshold}`}
        value={Number(values.value)}
        prefix={(values.prefix as string) || undefined}
        suffix={(values.suffix as string) || undefined}
        duration={values.duration as number}
        easing={values.easing as "linear" | "ease-out"}
        threshold={values.threshold as number}
        className="text-[72px] leading-[0.9] font-extralight tracking-[-0.01em] text-[#221F23] md:text-[120px] group-data-[theme=dark]/stage:text-white"
      />
      <button
        type="button"
        onClick={() => setRun((n) => n + 1)}
        className="rounded-full border border-black/15 px-4 py-1.5 text-sm text-neutral-700 hover:bg-black/5 group-data-[theme=dark]/stage:border-white/20 group-data-[theme=dark]/stage:text-white/80 group-data-[theme=dark]/stage:hover:bg-white/10"
      >
        Replay
      </button>
    </div>
  );
}

/** The eight25 hero headline, with a Replay button since it plays once. */
function RisingHeadlineDemo({ values }: { values: ControlValues }) {
  const [run, setRun] = useState(0);
  const inView = values.trigger === "view";
  return (
    <div className="relative isolate w-full overflow-clip bg-white">
      {/* A stand-in for the original's fan of vertical lines (decoration, not part of the component). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-[55%] bg-[repeating-linear-gradient(90deg,#7A2BD8_0_2px,transparent_2px_14px)] opacity-70 [mask-image:radial-gradient(120%_90%_at_0%_100%,#000_20%,transparent_70%)]"
      />
      <div className={inView ? "h-[640px] overflow-y-auto overscroll-contain" : ""}>
        {inView && <p className="py-16 text-center text-sm text-neutral-500">Scroll inside the preview ↓</p>}
        {inView && <div className="h-[420px]" />}
        <div className="px-5 py-24 xl:px-[100px] xl:py-32">
          <RisingHeadline
            key={run}
            text={values.text as string}
            trigger={values.trigger as "load" | "view"}
            stagger={values.stagger as number}
            duration={values.duration as number}
            distance={values.distance as number}
            className={`${hankenGrotesk.className} text-[52px] leading-[0.9] font-light tracking-[-2.12px] text-[#4E008E] xl:text-[120px] xl:tracking-[-3px]`}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setRun((n) => n + 1)}
        className="absolute right-4 bottom-4 rounded-full border border-black/15 bg-white px-4 py-1.5 text-sm text-neutral-700 hover:bg-black/5"
      >
        Replay
      </button>
    </div>
  );
}

/** The eight25 "accelerate growth" statement, in a preview that scrolls inside itself. */
function ScrollShiftHeadlineDemo({ values }: { values: ControlValues }) {
  return (
    <div className="h-[640px] w-full overflow-y-auto overscroll-contain bg-white [container-type:inline-size]">
      <p className="py-16 text-center text-sm text-neutral-500">Scroll inside the preview ↓</p>
      <div className="h-[360px]" />
      <section className="relative overflow-x-clip py-24">
        {/* A stand-in for the original's fan of faint vertical lines (decoration, not part of the component). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 w-[45%] -translate-x-1/2 bg-[repeating-linear-gradient(90deg,rgba(78,0,142,0.2)_0_2px,transparent_2px_12px)] [mask-image:radial-gradient(60%_50%_at_50%_50%,#000_30%,transparent_80%)]"
        />
        <ScrollShiftHeadline
          key={String(values.measure)}
          headline={(values.headline as string) || undefined}
          headlineSecondary={(values.headlineSecondary as string) || undefined}
          travel={values.travel as number}
          overlap={values.overlap as number}
          measure={values.measure as "section" | "self"}
          className={`${hankenGrotesk.className} relative leading-[1.1] font-extralight text-[#4E008E]`}
          style={{ fontSize: "min(260px, 18.0556cqi)" }}
        />
      </section>
      <div className="h-[520px]" />
    </div>
  );
}

/** The eight25 services list; photos are from the eight25 site. */
const eight25Services = [
  {
    title: "Digital Experience Strategy",
    description:
      "We turn complex business challenges into actionable digital strategies through research, insights, and clear roadmaps.",
    image: "/demo-images/vertical-tab-slider/strategy.webp",
  },
  {
    title: "Experience Design & UX",
    description: "Interfaces and journeys designed around how your buyers actually research, compare and decide.",
    image: "/demo-images/vertical-tab-slider/design.webp",
  },
  {
    title: "Composable CMS Implementations",
    description: "Contentful, Storyblok and Contentstack builds that let marketing teams ship pages without waiting on a sprint.",
    image: "/demo-images/vertical-tab-slider/cms.webp",
  },
  {
    title: "Integration & Enablement",
    description: "Your CRM, analytics and marketing tools wired into one stack, with the training to run it.",
    image: "/demo-images/vertical-tab-slider/integration.webp",
  },
  {
    title: "Ongoing Growth Programs",
    description: "Continuous testing, optimisation and new campaigns that keep the site compounding after launch.",
    image: "/demo-images/vertical-tab-slider/growth.jpg",
  },
].map((s) => ({ ...s, href: "#" }));

/** The services section, in a preview that scrolls inside itself so the plate can play. */
function VerticalTabSliderDemo({ values }: { values: ControlValues }) {
  return (
    <div className={`${instrumentSans.className} h-[760px] w-full overflow-y-auto overscroll-contain`} style={{ background: values.background as string }}>
      <p className="py-16 text-center text-sm text-neutral-500">Scroll inside the preview ↓</p>
      <div className="h-[300px]" />
      <VerticalTabSlider
        key={String(values.reveal)}
        items={eight25Services}
        slideDuration={values.slideDuration as number}
        tabShift={values.tabShift as number}
        inactiveOpacity={values.inactiveOpacity as number}
        glow={values.glow as boolean}
        reveal={values.reveal as boolean}
        background={values.background as string}
        color={values.color as string}
        revealBackground={values.revealBackground as string}
        revealColor={values.revealColor as string}
        className="px-5 py-[100px] @min-[960px]:px-10 @min-[960px]:py-[200px] [&_[role=group]]:font-(family-name:--vts-tab-font)"
        style={{ "--vts-tab-font": hankenGrotesk.style.fontFamily } as CSSProperties}
      >
        {/* A stand-in for the original's faint white bars over the card column; decoration, not part of the component. */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-[240px] left-0 h-[1100px] w-[400px] bg-[repeating-linear-gradient(90deg,#fff_0_2px,transparent_2px_10.47px)] opacity-[0.08] [mask-image:linear-gradient(transparent,#000_25%,#000_75%,transparent)] max-[959px]:hidden"
        />
        <h2 className={`${hankenGrotesk.className} text-[44px] leading-none font-light @min-[960px]:text-[80px] @min-[960px]:font-normal`}>
          What we do
        </h2>
      </VerticalTabSlider>
      <div className="h-[520px]" />
    </div>
  );
}

/** The NetApp AI hero headline, with a Replay button since it plays once. */
function WaveHeadlineDemo({ values }: { values: ControlValues }) {
  const [run, setRun] = useState(0);
  return (
    <div
      className={`${interTight.className} relative isolate flex min-h-[560px] w-full flex-col items-center justify-center gap-8 overflow-hidden bg-[#0B0730] px-5 py-24 text-center text-white`}
    >
      {/* A stand-in for the hero's looping background video (not part of the component). */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_0%_30%,#0B4BD8_0%,transparent_60%),radial-gradient(50%_70%_at_100%_20%,#9B1C8C_0%,transparent_60%),radial-gradient(70%_60%_at_60%_0%,#5B21D6_0%,transparent_55%)] opacity-80"
      />
      <p className="text-sm tracking-[0.12em] text-white/90 uppercase">NetApp AI Solutions</p>
      <WaveHeadline
        key={run}
        text={values.text as string}
        trigger={values.trigger as "view" | "load"}
        delay={values.delay as number}
        stagger={values.stagger as number}
        duration={values.duration as number}
        rise={values.rise as number}
        overshoot={values.overshoot as number}
        blur={values.blur as number}
        className="max-w-[1100px] text-[50px] leading-[0.9] font-thin tracking-[-0.8px] md:text-[80px] xl:text-[120px] xl:tracking-[-1.2px]"
      />
      <button
        type="button"
        onClick={() => setRun((n) => n + 1)}
        className="absolute right-4 bottom-4 rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/80 hover:bg-white/10"
      >
        Replay
      </button>
    </div>
  );
}

/** The three questions from NetApp Novus' FAQ, verbatim. */
const novusFaqs = [
  {
    question: "How does NetApp Novus scale without fragmenting my data?",
    answer:
      "A decoupled metadata layer tracks where everything lives. When a client reads or writes data, they get the data map from the metadata server and then directly access the data layer; the data layer, powered by proven NetApp ONTAP\u00ae software on NetApp AFF A90 systems, moves the bytes. The architecture scales performance with each additional storage system. Add a cluster, add its throughput, no remounts and no fragmentation. Every GPU still sees one unified namespace.",
  },
  {
    question: "How does NetApp Novus improve my return on GPU investment?",
    answer:
      "NetApp Novus keeps utilization high by removing the storage bottleneck that leaves GPUs waiting, so more of your compute runs at full capacity and more of it converts to revenue. Higher utilization on the same hardware means a better return without buying another rack.",
  },
  {
    question: "Do my GPU teams need a proprietary client to use NetApp Novus?",
    answer:
      "No. NetApp Novus works with standard, in-kernel NFSv4.2 / pNFS Flex Files clients, nconnect, and GPUDirect Storage. There\u2019s nothing custom to install across a fleet of thousands of GPU servers, which keeps operations simple and onboarding fast.",
  },
];

/** The five "Related information" tiles from NetApp AI's data security page, with their live art. */
const netappAsset = (path: string, width: number) =>
  `https://images.contentstack.io/v3/assets/blt7efec3660d1ae646/${path}?width=${width}&disable=upscale`;
const netappBento: BentoTile[] = [
  {
    image: netappAsset("bltca398fcc96df35f2/6ab8b9aef65ed8590f4b2c1d/Container_(27).webp", 844),
    title: "NetApp AFX Data infrastructure for enterprise AI",
    ctaLabel: "Explore AFX",
    href: "#afx",
  },
  {
    image: netappAsset("bltf54cf2c9d05e39e0/6abbafd1280cccd935663763/top-space-with-servers-v2.png", 800),
    title: "Accelerate AI outcomes with high\u2011performance, ultrascalable, disaggregated storage",
    ctaLabel: "Get the AFX datasheet",
    href: "#datasheet",
    tone: "dark",
  },
  {
    image: netappAsset("blt29c1f399eeb6a809/6ab8baf2c7fe679fde9c5fce/Container-2_(1).webp", 804),
    title: "NVIDIA certified storage",
    ctaLabel: "Learn more",
    href: "#nvidia",
  },
  {
    image: netappAsset("blt7e2db9e107d054bc/6ab8bb5278bcde7a1ecdf1ec/Container-3_(2).webp", 804),
    title: "The NetApp Platform is built for the Agentic Enterprise",
    ctaLabel: "Read the blog",
    href: "#blog",
  },
  { image: netappAsset("blt4054a2aeb4e17959/6abb6b94280ccc3193663503/image_1121.webp", 1620) },
];

/**
 * Live previews, keyed by registry slug. Each preview receives the current
 * values from the Customize panel.
 */
export const previews: Record<string, ComponentType<{ values: ControlValues }>> = {
  "fill-sweep": ({ values }) => (
    <FillSweepButton
      direction={values.direction as "left" | "bottom"}
      duration={values.duration as number}
      textColor={values.textColor as string}
      fillColor={values.fillColor as string}
      hoverTextColor={values.hoverTextColor as string}
      href="#"
    >
      Get started
    </FillSweepButton>
  ),
  "corner-bloom": ({ values }) => (
    <CornerBloomButton
      color={values.color as string}
      bloomColor={values.bloomColor as string}
      textColor={values.textColor as string}
      duration={values.duration as number}
      arrow={values.arrow as boolean}
      href={values.href as string}
    >
      Request Demo
    </CornerBloomButton>
  ),
  "ghost-fill": ({ values }) => (
    <GhostFillButton
      color={values.color as string}
      fillColor={values.fillColor as string}
      hoverTextColor={values.hoverTextColor as string}
      duration={values.duration as number}
      href={values.href as string}
    >
      Explore Sophos Fusion
    </GhostFillButton>
  ),
  "color-snap": ({ values }) => (
    <ColorSnapButton
      color={values.color as string}
      hoverColor={values.hoverColor as string}
      activeColor={values.activeColor as string}
      textColor={values.textColor as string}
      duration={values.duration as number}
      href={values.href as string}
    >
      Learn about our model
    </ColorSnapButton>
  ),
  "circle-reveal": ({ values }) => (
    <CircleRevealButton
      color={values.color as string}
      gradientFrom={values.gradientFrom as string}
      gradientTo={values.gradientTo as string}
      textColor={values.textColor as string}
      duration={values.duration as number}
      href={values.href as string}
    >
      Explore More
    </CircleRevealButton>
  ),
  "outline-sweep": ({ values }) => (
    <OutlineSweepButton
      className={hankenGrotesk.className}
      color={values.color as string}
      fillColor={values.fillColor as string}
      hoverTextColor={values.hoverTextColor as string}
      duration={values.duration as number}
      href={values.href as string}
    >
      Read our blog
    </OutlineSweepButton>
  ),
  "zoom-image-card": ({ values }) => (
    <ZoomImageCard
      className={
        // The default caption is black for light sites; flip it to white on
        // the dark stage unless the user picked their own color.
        values.titleColor === "#000000"
          ? `${interTight.className} w-full max-w-[301px] group-data-[theme=dark]/stage:[&>span]:text-white`
          : `${interTight.className} w-full max-w-[301px]`
      }
      src="https://images.contentstack.io/v3/assets/blt7efec3660d1ae646/bltfbd08f588b3d02bd/6ab8e7e2442dc1839bab5a52/Frame_2029273449.webp?width=640&format=pjpg&disable=upscale"
      logo="https://images.contentstack.io/v3/assets/blt7efec3660d1ae646/blt62c331bb718721a2/6ab2229498a4e3ea4353ee80/Ducati_red_logo_1.svg"
      logoAlt="Ducati"
      title={values.title as string}
      scale={values.scale as number}
      duration={values.duration as number}
      radius={values.radius as number}
      aspectRatio={values.aspectRatio as string}
      scrim={values.scrim as boolean}
      titleColor={values.titleColor as string}
      href={values.href as string}
      onClick={(e) => e.preventDefault()}
    />
  ),
  "reveal-link-card": ({ values }) => (
    <RevealLinkCard
      src="https://images.contentstack.io/v3/assets/blt7efec3660d1ae646/bltca51762d5e987ae0/6aba052344cd9a42234330eb/That_s_your_AI_advantage_-_3.webp?width=600&format=pjpg&disable=upscale"
      title={values.title as string}
      linkLabel={values.linkLabel as string}
      color={values.color as string}
      textColor={values.textColor as string}
      lift={values.lift as boolean}
      href={values.href as string}
      onClick={(e) => e.preventDefault()}
    />
  ),
  "scroll-color-background": ({ values }) => {
    // Light text on dark grounds, dark text on light ones.
    const ink = (hex: string) => {
      const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
      const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
      return lum > 0.6 ? "#000000" : "#FFFFFF";
    };
    const colors = [values.color1, values.color2, values.color3] as string[];
    return (
      // The colour follows scroll, so the preview scrolls inside itself.
      <div className="h-[640px] overflow-y-auto overscroll-contain">
        <ScrollColorBackground
          key={String(values.arriveAt)}
          arriveAt={values.arriveAt as number}
          duration={values.duration as number}
          sections={colors.map((color, i) => ({
            color,
            textColor: ink(color),
            className: "flex min-h-[720px] flex-col items-center justify-center gap-2 font-mono text-xs opacity-60",
            children: (
              <>
                <span>Section 0{i + 1}</span>
                {i === 0 && <span>Scroll inside the preview ↓</span>}
              </>
            ),
          }))}
        />
      </div>
    );
  },
  "scroll-shift-headline": ({ values }) => <ScrollShiftHeadlineDemo values={values} />,
  "wave-headline": ({ values }) => <WaveHeadlineDemo values={values} />,
  "rising-headline": ({ values }) => <RisingHeadlineDemo values={values} />,
  "count-up": ({ values }) => <CountUpDemo values={values} />,
  "faq-accordion": ({ values }) => (
    <div className="w-full max-w-[1280px] rounded-2xl bg-white px-6 py-12 md:px-10">
      <FaqAccordion
        key={String(values.collapsible)}
        className={interTight.className}
        items={novusFaqs}
        heading={(values.heading as string) || undefined}
        duration={values.duration as number}
        collapsible={values.collapsible as boolean}
        numbered={values.numbered as boolean}
        cardColor={values.cardColor as string}
      />
    </div>
  ),
  "bento-grid": ({ values }) => (
    <div className="w-full bg-white px-5 py-12 md:px-10" onClickCapture={(e) => e.preventDefault()}>
      <BentoGrid
        className={`${interTight.className} mx-auto max-w-[1242px]`}
        tiles={netappBento}
        scale={values.scale as number}
        duration={values.duration as number}
        radius={values.radius as number}
      />
    </div>
  ),
  "rising-copy-card": ({ values }) => (
    <RisingCopyCard
      className={interTight.className}
      src="https://images.contentstack.io/v3/assets/blt7efec3660d1ae646/bltcff7aaa939feab51/6ab8f95944cd9a513b432fb6/block_1_(1).webp?width=710&format=pjpg&disable=upscale"
      title={values.title as string}
      description={(values.description as string) || undefined}
      ctaLabel={values.ctaLabel as string}
      scale={values.scale as number}
      duration={values.duration as number}
      tint={values.tint as string}
      height={Number(values.height)}
      href={values.href as string}
      onClick={(e) => e.preventDefault()}
    />
  ),
  "logo-marquee": ({ values }) => (
    <LogoMarquee
      logos={sophosBadges}
      speed={values.speed as number}
      direction={values.direction as "left" | "right"}
      pauseOnHover={values.pauseOnHover as boolean}
      hoverScale={values.hoverScale as number}
      background={values.background as string}
      gap={values.gap as number}
      logoHeight={values.logoHeight as number}
    />
  ),
  "stacking-cards": ({ values }) => (
    // Sticky needs a scroll container, so the preview scrolls inside itself.
    <div className="h-[640px] overflow-y-auto overscroll-contain bg-white px-6 md:px-10">
      <p className="py-16 text-center text-sm text-neutral-500">Scroll inside the preview ↓</p>
      <StackingCards
        stickyTop={values.stickyTop as number}
        gap={values.gap as number}
        cardHeight={values.cardHeight as number}
        radius={values.radius as number}
        background={values.background as string}
        offsetY={values.offsetY as number}
        scale={values.scale as number}
        blur={values.blur as number}
        fade={values.fade as boolean}
        minWidth={0}
      >
        {seemplicityProblems.map((card) => (
          <SeemplicityCard key={card.title} {...card} />
        ))}
      </StackingCards>
      <div className="h-[520px]" />
    </div>
  ),
  "collapsing-stack": ({ values }) => (
    // Sticky needs a scroll container, so the preview scrolls inside itself. It's
    // tall enough for the pile to pin (sticky top + two 260px bands), as on a laptop.
    <div className={`${interTight.className} h-[820px] overflow-y-auto overscroll-contain bg-white px-[30px]`}>
      <p className="pt-12 text-center text-sm text-neutral-500">Scroll inside the preview ↓</p>
      <div className="flex flex-col gap-5 pt-16 pb-10 min-[992px]:gap-[30px] min-[992px]:pb-[100px]">
        <p className="text-xs tracking-[0.15em] text-[#0054D7] uppercase min-[992px]:text-base">
          Independent scale of capacity and compute nodes
        </p>
        <h2 className="text-[42px] leading-[1.1] font-light tracking-[-0.01em] text-black min-[992px]:text-[70px]">
          Independent and massive scale
        </h2>
        <p className="max-w-[720px] text-lg leading-[1.6] text-[#333]">
          You can add storage nodes to get more CPU and throughput or add shelves to get more storage capacity and disk
          performance.
        </p>
      </div>
      <CollapsingStack
        key={`${values.stickyTop}-${values.peek}-${values.padding}-${values.speed}-${values.scrub}`}
        stickyTop={values.stickyTop as number}
        peek={values.peek as number}
        padding={values.padding as number}
        speed={values.speed as number}
        scrub={values.scrub as number}
        radius={values.radius as number}
        background={values.background as string}
        borderColor={values.borderColor as string}
        items={netappRows.map((row) => ({
          title: (
            <h3 className="text-[28px] leading-[1.1] font-light tracking-[-0.01em] text-black min-[992px]:text-[36px] min-[992px]:tracking-normal">
              {row.title}
            </h3>
          ),
          description: (
            <p className="text-base leading-[1.6] tracking-[0.02em] text-[#333] min-[992px]:text-xl min-[992px]:tracking-[0.01em]">
              {row.body}
            </p>
          ),
          media: (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://images.contentstack.io/v3/assets/blt7efec3660d1ae646/${row.image}?width=1666&format=pjpg&disable=upscale`}
              alt={row.alt}
            />
          ),
        }))}
      />
      <div className="h-[600px]" />
    </div>
  ),
  "focus-scroll": ({ values }) => {
    const light = values.theme === "light";
    const text = light ? "#0A143A" : "#FFFFFF";
    return (
      // Sticky needs a scroll container, so the preview scrolls inside itself.
      <div className="h-[640px] overflow-x-hidden overflow-y-auto overscroll-contain" style={{ background: light ? "#EDF2F9" : "#001A47" }}>
        <section className={`${lexendExa.className} relative px-5 py-20 min-[1024px]:py-[180px]`}>
          {!light && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/demo-images/focus-scroll/focus-scroll-bg.webp"
              alt=""
              className="pointer-events-none absolute top-0 right-0 h-[1016px] w-[499px] md:h-full md:w-full"
            />
          )}
          <div className="relative z-1 mx-auto max-w-[1220px]">
            <div className="mx-auto mb-[62px] max-w-[1035px] text-center" style={{ color: text }}>
              <h2 className="mb-[15px] text-[38px] leading-[1.1] font-light tracking-[-0.095em] min-[1024px]:mb-5 min-[1024px]:text-[44px] min-[1024px]:tracking-[-0.1em]">
                Cyber Resilience for the Agentic AI Era
              </h2>
              <p className="font-sans text-[16px] leading-[1.6]" style={{ color: light ? "#464646" : "#FFFFFF" }}>
                Agentic AI has collapsed attack timelines to seconds. Sophos solutions match AI attack velocity and
                sophistication, stopping AI- and human-led threats before they can impact your business.
              </p>
            </div>
            <FocusScroll
              stickyTop={values.stickyTop as number}
              mediaWidth={values.mediaWidth as number}
              gap={values.gap as number}
              mediaSide={values.mediaSide as "left" | "right"}
              duration={values.duration as number}
              inactiveOpacity={values.inactiveOpacity as number}
              slideDuration={values.slideDuration as number}
              theme={light ? "light" : "dark"}
              items={sophosFocusItems.map((item) => ({
                // eslint-disable-next-line @next/next/no-img-element
                media: <img src={sophosAsset(item.image, 1464)} alt={item.alt} draggable={false} />,
                content: (
                  <div style={{ color: text }}>
                    <h3 className="mb-2.5 text-[32px] leading-[1.15] font-light tracking-[-0.09em] @min-[720px]:mb-0 @min-[960px]:mb-5">
                      {item.title}
                    </h3>
                    <p className="font-sans text-[14px] leading-[1.8] tracking-[0.02em] @min-[960px]:text-[16px] @min-[960px]:leading-[1.6] @min-[960px]:tracking-[-0.01em]">
                      {item.body}
                    </p>
                  </div>
                ),
                action: item.cta ? <SophosArrowLink color={text}>{item.cta}</SophosArrowLink> : undefined,
              }))}
            />
          </div>
        </section>
        <div className="h-[420px]" />
      </div>
    );
  },
  "scroll-text-reveal": ({ values }) => (
    // The reveal is tied to scroll, so the preview scrolls inside itself.
    <div className="h-[640px] overflow-y-auto overscroll-contain bg-white">
      <p className="py-6 text-center text-sm text-neutral-500">Scroll inside the preview ↓</p>
      <div className="h-[340px]" />
      {/* The NetApp AI Gartner stats section: its background image, logo and padding (Contentstack URLs). */}
      <section className="relative overflow-clip px-5 pt-[60px] pb-[98px] xl:pt-[100px] xl:pb-[251px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.contentstack.io/v3/assets/blt7efec3660d1ae646/bltfe61c08543248add/6a85d095971ef95cbe534b26/netapp-ai-temp-bg.png?width=1600&format=pjpg&disable=upscale"
          alt=""
          className="pointer-events-none absolute top-[-12%] left-1/2 h-[130%] w-[130%] -translate-x-1/2 object-cover xl:top-0 xl:left-0 xl:h-full xl:w-full xl:translate-x-0"
        />
        <div className="relative flex flex-col items-center gap-10 xl:gap-[60px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.contentstack.io/v3/assets/blt7efec3660d1ae646/bltaa0a1bef768d6fd8/6a8b8d3f971ef91028536742/gartner.svg"
            alt="Gartner"
            className="h-5 w-auto xl:h-[30px]"
          />
          <ScrollTextReveal
            key={`${values.rise}-${values.timeline}`}
            text={values.text as string}
            split={values.split as "char" | "word"}
            dimOpacity={values.dimOpacity as number}
            start={values.start as number}
            end={values.end as number}
            timeline={values.timeline as "section" | "self"}
            rise={values.rise as boolean}
            riseDistance={values.riseDistance as number}
            riseDuration={values.riseDuration as number}
            className={`${interTight.className} w-full max-w-[1060px] text-center text-[30px] leading-[1.1] font-light tracking-[-0.01em] text-black xl:text-[60px] xl:tracking-[-0.01em]`}
          />
        </div>
      </section>
      <div className="h-[400px]" />
    </div>
  ),
  "spotlight-slider": ({ values }) => (
    <div className={`${lexendExa.className} min-w-0 bg-[#EDF2F9] py-16`}>
      <h2 className="mx-auto mb-12 max-w-[640px] px-6 text-center text-[32px] leading-[1.1] font-light tracking-[-0.1em] text-[#0A143A] md:text-[44px]">
        How businesses
        <br />
        stay secure with Sophos
      </h2>
      <SpotlightSlider
        autoplay={values.autoplay as boolean}
        interval={values.interval as number}
        slideWidth={values.slideWidth as number}
        duration={values.duration as number}
        focusDuration={values.focusDuration as number}
        inactiveOpacity={values.inactiveOpacity as number}
        inactiveBlur={values.inactiveBlur as number}
        inactiveScale={values.inactiveScale as number}
        radius={values.radius as number}
        accent={values.accent as string}
        cardBackground={values.cardBackground as string}
        dotColor={values.dotColor as string}
        showTabs={values.showTabs as boolean}
        showDots={values.showDots as boolean}
        loop={values.loop as boolean}
        items={sophosStories.map((story) => ({
          label: story.company,
          // eslint-disable-next-line @next/next/no-img-element
          tab: <img src={sophosAsset(story.logo, 384)} alt="" />,
          content: (
            <SpotlightSlide
              accent={values.accent as string}
              // eslint-disable-next-line @next/next/no-img-element
              logo={<img src={sophosAsset(story.logo, 360)} alt={story.company} />}
              quote={story.quote}
              name={story.name}
              role={<span className="font-sans">{story.role}</span>}
              // eslint-disable-next-line @next/next/no-img-element
              media={<img src={sophosAsset(story.image, 1736)} alt="" draggable={false} />}
              // eslint-disable-next-line @next/next/no-img-element
              playIcon={<img src={sophosAsset(SOPHOS_PLAY, 180)} alt="" className="size-full drop-shadow-[0_54px_81px_rgba(0,26,71,0.5)]" />}
              pattern={{
                wide: "/demo-images/spotlight-slider/slider-with-logos-pattern-desktop.webp",
                narrow: "/demo-images/spotlight-slider/slider-with-logos-pattern-mobile.webp",
              }}
              onPlay={() => {}}
            />
          ),
        }))}
      />
    </div>
  ),
  "awards-carousel": ({ values }) => (
    <div className={`${hankenGrotesk.className} min-w-0 bg-white py-16 min-[992px]:py-24`}>
      <AwardsCarousel
        cardWidth={values.cardWidth as number}
        gap={values.gap as number}
        mediaHeight={values.mediaHeight as number}
        radius={values.radius as number}
        duration={values.duration as number}
        glowTop={values.glowTop as string}
        glowBottom={values.glowBottom as string}
        color={values.color as string}
        heading={
          <>
            Validated by experts.
            <br />
            Trusted by enterprises.
          </>
        }
        description={
          <span className={monaSans.className}>
            We don&apos;t just claim to be the best. The industry&apos;s top analysts and security organizations
            confirm it.
          </span>
        }
        items={awards.map((award) => ({
          // eslint-disable-next-line @next/next/no-img-element
          image: <img src={`https://seemplicity.ai/wp-content/uploads/${award.badge}`} alt="" />,
          title: award.name,
        }))}
      />
    </div>
  ),
  "card-marquee": ({ values }) => (
    <div className={`${monaSans.className} min-w-0 bg-white py-16`}>
      <div className="mb-10 px-6 text-center text-[#410051] min-[992px]:mb-[63px]">
        <h2 className={`${bricolage.className} mb-[13px] text-[clamp(36px,27.09px+2.29vw,60px)] leading-none font-light tracking-[-1.2px]`}>
          Unified visibility for enterprise scale
        </h2>
        <p className="mx-auto max-w-[640px] text-sm leading-[1.4] md:text-lg">
          Eliminate data silos to drive faster fixes across cloud, code, and infrastructure.
        </p>
      </div>
      <CardMarquee
        speed={values.speed as number}
        direction={values.direction as "left" | "right"}
        pauseOnHover={values.pauseOnHover as boolean}
        cardWidth={values.cardWidth as number}
        cardHeight={values.cardHeight as number}
        hoverGrow={values.hoverGrow as number}
        hoverDuration={values.hoverDuration as number}
        hoverBorder={values.hoverBorder as string}
        label="Benefits"
        items={seemplicityBenefits.map((card) => ({
          // eslint-disable-next-line @next/next/no-img-element
          icon: <img src={seemplicityUpload(card.icon)} alt="" />,
          title: (
            <h3
              className="text-[22px] leading-[1.2] font-bold text-[#410051] min-[992px]:font-(family-name:--display) min-[992px]:text-4xl min-[992px]:font-normal min-[992px]:tracking-[-0.56px]"
              style={{ "--display": bricolage.style.fontFamily } as React.CSSProperties}
            >
              {card.title}
            </h3>
          ),
          description: <p className="text-sm leading-normal text-[#0B0623] md:text-base">{card.body}</p>,
          href: "#",
        }))}
      />
    </div>
  ),
  "expanding-cards": ({ values }) => (
    <div className="min-w-0 bg-[#F2F1EE] px-6 py-16 md:px-10">
      <ExpandingCards
        height={values.height as number}
        mobileHeight={values.mobileHeight as number}
        collapsedWidth={values.collapsedWidth as number}
        gap={values.gap as number}
        radius={values.radius as number}
        inactiveOpacity={values.inactiveOpacity as number}
        duration={values.duration as number}
        contentDuration={values.contentDuration as number}
        overlay={values.overlay as boolean}
        items={stories.map((story) => ({
          label: story.company,
          media: (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ironcladUpload(story.image)} alt={story.alt} className="object-cover" />
          ),
          content: (
            <div className="text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ironcladUpload(story.logo)}
                alt={story.company}
                style={{ width: story.logoWidth }}
                className="mb-[30px] h-auto brightness-0 invert"
              />
              <p className="max-w-[420px] text-[24px] leading-[1.2] min-[992px]:text-[30px]">
                &ldquo;{story.lead}
                {story.bold && <strong className="font-semibold">{story.bold}</strong>}
                {story.tail}&rdquo;
              </p>
            </div>
          ),
        }))}
      />
    </div>
  ),
  "vertical-tab-slider": ({ values }) => <VerticalTabSliderDemo values={values} />,
  "progress-tabs": ({ values }) => (
    <div className="min-w-0 bg-white px-6 py-16 md:px-10">
      <ProgressTabs
        autoplay={values.autoplay as boolean}
        interval={values.interval as number}
        duration={values.duration as number}
        progress={values.progress as boolean}
        pauseOnHover={values.pauseOnHover as boolean}
        pauseButton={values.pauseButton as boolean}
        mediaHeight={values.mediaHeight as number}
        radius={values.radius as number}
        accentFrom={values.accentFrom as string}
        accentTo={values.accentTo as string}
        labelColor={values.labelColor as string}
        trayTint={values.trayTint as string}
        tabClassName={`${spaceMono.className} text-sm lowercase`}
        mediaBackground={`url(${seemplicityUpload("2026/04/video-bg.webp")})`}
        items={analystSteps.map((step) => ({
          label: step.label,
          // eslint-disable-next-line @next/next/no-img-element
          media: <img src={seemplicityUpload(step.image)} alt="" className="object-cover" />,
          content: (
            <div className="flex flex-col gap-2.5">
              <p className="max-w-[730px] text-[28px] leading-none font-normal tracking-[-0.72px] text-[#410051] min-[992px]:text-[36px]">
                {step.title}
              </p>
              <p className="max-w-[730px] text-base leading-[1.4] text-[#0B0623]">{step.body}</p>
            </div>
          ),
        }))}
      />
    </div>
  ),
  "step-tabs": ({ values }) => (
    <div className={`${monaSans.className} min-w-0 bg-[#F5F5F5] px-2 py-16 md:px-6`}>
      <StepTabs
        fadeDuration={values.fadeDuration as number}
        slideDuration={values.slideDuration as number}
        slideOffset={values.slideOffset as number}
        connectors={values.connectors as boolean}
        accentFrom={values.accentFrom as string}
        accentTo={values.accentTo as string}
        connectorFrom={values.connectorFrom as string}
        labelColor={values.labelColor as string}
        className="mx-auto max-w-[1280px]"
        items={seemplicitySteps.map((step) => ({
          label: step.label,
          // eslint-disable-next-line @next/next/no-img-element
          icon: <img src={seemplicityUpload(step.icon)} alt="" />,
          content: (
            <>
              <h3
                className={`${bricolage.className} mb-5 text-[clamp(30px,24.06px+1.52vw,46px)] leading-[1.2] font-light tracking-[-0.92px] text-[#410051]`}
              >
                {step.title}
              </h3>
              <p className="text-sm leading-[1.4] text-[#0B0623] md:text-lg min-[992px]:leading-[1.6]">{step.body}</p>
            </>
          ),
          // eslint-disable-next-line @next/next/no-img-element
          media: <img src={seemplicityUpload(step.image)} alt="" />,
        }))}
      />
    </div>
  ),
  aurora: ({ values }) => (
    <section className="relative isolate flex h-[640px] min-w-0 items-center justify-center overflow-hidden bg-white px-6">
      <Aurora
        className="absolute inset-0 -z-10"
        colorLight={values.colorLight as string}
        colorMid={values.colorMid as string}
        colorDark={values.colorDark as string}
        speed={values.speed as number}
        warpAmplitude={values.warpAmplitude as number}
        warpFrequency={values.warpFrequency as number}
        stripeCount={values.stripeCount as number}
        stripeDispersion={values.stripeDispersion as number}
        chromaticAberration={values.chromaticAberration as number}
        maxPixelRatio={values.maxPixelRatio as number}
        paused={values.paused as boolean}
      />
      {/* Soft white glow behind the heading, as in the original section. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[320px] w-[560px] max-w-[90%] -translate-1/2 rounded-[50%] bg-white/90 blur-[80px]"
      />
      <div className="flex max-w-[620px] flex-col items-center gap-4 text-center">
        <p className="text-sm font-medium tracking-[0.12em] text-[#1F5BC6] uppercase">Frequently asked questions</p>
        <h2 className="text-4xl leading-[1.05] font-light tracking-[-0.03em] text-[#141A26] md:text-6xl">
          Your data is ready for AI. We&apos;ll show you how.
        </h2>
      </div>
    </section>
  ),
  curtain: ({ values }) => (
    <section className="relative isolate flex h-[640px] min-w-0 items-center justify-center overflow-hidden bg-[#002F79] px-6">
      <Curtain
        className="absolute inset-0 -z-10"
        colorTop={values.colorTop as string}
        colorBottom={values.colorBottom as string}
        layerLight={values.layerLight as string}
        layerDark={values.layerDark as string}
        speed={values.speed as number}
        flow={values.flow as number}
        wave={values.wave as number}
        intensity={values.intensity as number}
        fadeStart={values.fadeStart as number}
        fadeEnd={values.fadeEnd as number}
        gradientStart={values.gradientStart as number}
        gradientEnd={values.gradientEnd as number}
        maxPixelRatio={values.maxPixelRatio as number}
        paused={values.paused as boolean}
      />
      <div className="flex max-w-[620px] flex-col items-center gap-4 text-center">
        <p className="text-sm font-medium tracking-[0.12em] text-[#7FB8FF] uppercase">Built for what&apos;s next</p>
        <h2 className="text-4xl leading-[1.05] font-light tracking-[-0.03em] text-white md:text-6xl">
          Turn your data into intelligence.
        </h2>
      </div>
    </section>
  ),
};
