"use client";

import { useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import { formatPoints, parsePoints, type ControlValues } from "./types";
import { CornerBloomButton } from "./interactions/button-hovers/corner-bloom-button";
import { GhostFillButton } from "./interactions/button-hovers/ghost-fill-button";
import { ColorSnapButton } from "./interactions/button-hovers/color-snap-button";
import { CircleRevealButton } from "./interactions/button-hovers/circle-reveal-button";
import { OutlineSweepButton } from "./interactions/button-hovers/outline-sweep-button";
import { ZoomImageCard } from "./interactions/image-hovers/zoom-image-card";
import { VideoHoverCard } from "./interactions/image-hovers/video-hover-card";
import { RevealLinkCard } from "./interactions/image-hovers/reveal-link-card";
import { RisingCopyCard } from "./interactions/image-hovers/rising-copy-card";
import { BentoGrid, type BentoTile } from "./interactions/image-hovers/bento-grid";
import { HoverCardList, HourglassIcon, ArmchairIcon, type HoverListItem } from "./interactions/image-hovers/hover-card-list";
import { LogoMarquee } from "./animations/carousels/logo-marquee";
import { CardMarquee } from "./animations/carousels/card-marquee";
import { IntegrationLogoWall } from "./animations/carousels/integration-logo-wall";
import { ShowcaseTicker, type ShowcaseItem } from "./animations/carousels/showcase-ticker";
import { Outfit } from "next/font/google";
import { StackingCards } from "./animations/pin-scrollers/stacking-cards";
import { HorizontalScroll } from "./animations/pin-scrollers/horizontal-scroll";
import { FocusScroll } from "./animations/pin-scrollers/focus-scroll";
import { CollapsingStack } from "./animations/pin-scrollers/collapsing-stack";
import { ExpandingCards } from "./animations/carousels/expanding-cards";
import { StatCounterCards } from "./animations/carousels/stat-counter-cards";
import { ExpandingBento, type BentoPanel, type BentoStrip } from "./animations/carousels/expanding-bento";
import { SpotlightSlider, SpotlightSlide } from "./animations/carousels/spotlight-slider";
import { AwardsCarousel } from "./animations/carousels/awards-carousel";
import { ExpertCardCarousel } from "./animations/carousels/expert-card-carousel";
import { TestimonialSlider } from "./animations/carousels/testimonial-slider";
import { ProductTabs, ProductPanel } from "./animations/tabs/product-tabs";
import { ScrollTextReveal } from "./animations/scroll-triggers/scroll-text-reveal";
import { CountUp } from "./animations/text-effects/count-up";
import { GradientSweepText } from "./animations/text-effects/gradient-sweep-text";
import { ScrollShiftHeadline } from "./animations/scroll-triggers/scroll-shift-headline";
import { RisingHeadline } from "./animations/text-effects/rising-headline";
import { TypingHeadline } from "./animations/text-effects/typing-headline";
import { CipherReveal } from "./animations/text-effects/cipher-reveal";
import { RotatingPillHeadline, type PillWord } from "./animations/text-effects/rotating-pill-headline";
import { WaveHeadline } from "./animations/text-effects/wave-headline";
import { StaggeredText } from "./animations/text-effects/staggered-text";
import { BlendThroughHeadline } from "./animations/text-effects/blend-through-headline";
import { LineMaskReveal } from "./animations/text-effects/line-mask-reveal";
import { BlurHighlight } from "./animations/text-effects/blur-highlight";
import { StretchHeadline } from "./animations/text-effects/stretch-headline";
import { TextMarquee } from "./animations/text-effects/text-marquee";
import { ScrollColorBackground } from "./animations/scroll-triggers/scroll-color-background";
import { FaqAccordion } from "./animations/accordions/faq-accordion";
import { ProgressTabs } from "./animations/tabs/progress-tabs";
import { ScrollProgressTabs } from "./animations/tabs/scroll-progress-tabs";
import { StepTabs } from "./animations/tabs/step-tabs";
import { AccordionTabs } from "./animations/tabs/accordion-tabs";
import { VerticalTabSlider } from "./animations/tabs/vertical-tab-slider";
import { Bricolage_Grotesque, DM_Sans, Hanken_Grotesk, Instrument_Sans, Inter, Inter_Tight, Lexend, Lexend_Exa, Mona_Sans, Montserrat, Newsreader, Public_Sans, Space_Mono } from "next/font/google";
import { Aurora } from "./shaders/backgrounds/aurora";
import { Curtain } from "./shaders/backgrounds/curtain";
import { LayerCascade } from "./shaders/backgrounds/layer-cascade";
import { RibbonWave } from "./shaders/backgrounds/ribbon-wave";
import { PrismFlow } from "./shaders/backgrounds/prism-flow";
import { NeonMarble } from "./shaders/backgrounds/neon-marble";

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
const miroImage = (id: string) => `https://framerusercontent.com/images/${id}.png?scale-down-to=1024`;
const miroFeatures = [
  { title: "AI", body: "Accelerate your team with collaborative AI workflows", image: miroImage("qktnranaPpFcKWyM60NJD9VvI") },
  { title: "Intelligent Canvas", body: "Empower teamwork on one, infinite, multiplayer canvas", image: miroImage("Yuc5oFlUGxrhIlp7DDzijhyh3k") },
  { title: "Formats", body: "Move quickly from ideas to structured plans and work with Docs, Tables, Slides, Diagrams and more", image: miroImage("jEBfMRQ9CEbwCHlIsSZ8arK5Jt0") },
  { title: "Blueprints", body: "Automate key processes and ensure your workflows are scalable, repeatable, and efficient", image: miroImage("UE6PN5AkKpZr9wiHr9XmecEwBe8") },
  { title: "Enterprise Security & Scale", body: "Secure and scalable collaboration on an enterprise-grade platform you can trust", image: miroImage("t6nXozqt1IQNpt1ZoXulrivOM") },
  { title: "Integrations", body: "Connects with 250+ apps so teams stay aligned and productive in one scalable, secure workspace.", image: miroImage("wIqLXdrx2cUUItCcoSjzFjBMQ") },
];

function MiroCard({ title, body, image }: (typeof miroFeatures)[number]) {
  return (
    <div className="flex flex-col">
      <div className="aspect-video overflow-hidden rounded-xl bg-[#F1F1EF]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="size-full object-cover" draggable={false} />
      </div>
      <h3 className="mt-6 text-[28px] leading-tight text-[#050038]">{title}</h3>
      <p className="mt-3 max-w-[480px] text-lg leading-7 text-[#555]">{body}</p>
      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="mt-6 inline-flex h-12 w-fit items-center rounded-lg bg-[#1C1C1E] px-5 text-lg text-white"
      >
        Learn more
      </a>
    </div>
  );
}

/** Simplified boards standing in for the live Miro scenes in the Intelligent Canvas hero. */
function MiroSticky({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div
      className="flex aspect-square w-[clamp(52px,9cqw,84px)] items-center justify-center p-1.5 text-center text-[clamp(8px,1.2cqw,11px)] leading-tight text-[#191812] shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
      style={{ background: color }}
    >
      {children}
    </div>
  );
}

function MiroFrame({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col gap-2">
      <span className="w-fit rounded-md bg-white px-2 py-1 text-[clamp(9px,1.3cqw,13px)] font-medium text-[#191812] shadow-sm">
        <span className="mr-1 text-[#4262FF]">{icon}</span>
        {title}
      </span>
      <div className="flex min-h-0 flex-1 flex-col rounded-xl bg-white p-[clamp(8px,1.6cqw,16px)] shadow-[0_4px_24px_rgba(110,79,3,0.08)]">
        {children}
      </div>
    </div>
  );
}

const miroBoards: { label: string; board: ReactNode }[] = [
  {
    label: "Workshop planning",
    board: (
      <MiroFrame title="Wishlist prioritization" icon="#">
        <div className="mb-2 flex items-center justify-between text-[clamp(10px,1.5cqw,15px)] font-medium text-[#191812]">
          Impact vs. effort
          <span className="rounded-full border border-black/10 px-2 py-0.5 text-[clamp(9px,1.2cqw,12px)]">05:00</span>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-1.5 text-[clamp(8px,1cqw,10px)] font-medium text-[#191812]">
          {[
            ["Do now", [["#FFC6E1", "Warn me before the ETA slips"], ["#C6F0B5", "Reorder in one tap"]]],
            ["Big bets", [["#FFF59B", "Live courier map"], ["#A7C7FF", "Group orders for the office"]]],
            ["Fill-ins", [["#FFF59B", "Dark mode"]]],
            ["Park it", []],
          ].map(([name, notes]) => (
            <div key={name as string} className="flex flex-col gap-1.5 rounded-md bg-[#EEF0FB] p-1.5">
              {name as string}
              <div className="flex flex-wrap gap-1.5">
                {(notes as string[][]).map(([c, t]) => (
                  <MiroSticky key={t} color={c}>
                    {t}
                  </MiroSticky>
                ))}
              </div>
            </div>
          ))}
        </div>
      </MiroFrame>
    ),
  },
  {
    label: "Concept review",
    board: (
      <MiroFrame title="Checkout concepts" icon="◇">
        <div className="grid flex-1 grid-cols-3 gap-[clamp(6px,1.4cqw,14px)]">
          {[
            ["A · One page", "#FFD5C2"],
            ["B · Stepper", "#D7E3FF"],
            ["C · Express pay", "#DDF4D2"],
          ].map(([name, tone], i) => (
            <div key={name} className="flex flex-col gap-1.5">
              <div className="relative min-h-0 flex-1 rounded-lg p-2" style={{ background: tone }}>
                <div className="mb-1.5 h-1.5 w-2/3 rounded-full bg-black/15" />
                <div className="mb-1 h-1.5 w-1/2 rounded-full bg-black/10" />
                <div className="mt-3 h-[40%] rounded-md bg-white/70" />
                {i !== 1 && (
                  <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-[#4262FF] text-[10px] font-semibold text-white">
                    {i + 2}
                  </span>
                )}
              </div>
              <span className="text-[clamp(8px,1.1cqw,11px)] font-medium text-[#191812]">{name}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5">
          <MiroSticky color="#FFF59B">Fewer fields wins</MiroSticky>
          <MiroSticky color="#FFC6E1">Test B with new users</MiroSticky>
        </div>
      </MiroFrame>
    ),
  },
  {
    label: "Technical design",
    board: (
      <MiroFrame title="Order tracking service" icon="⌘">
        <div className="relative grid flex-1 grid-cols-3 items-center gap-[clamp(10px,3cqw,32px)] text-[clamp(8px,1.1cqw,11px)] font-medium text-[#191812]">
          {[
            ["Mobile app", "#D7E3FF", ["Courier map", "Push alerts"]],
            ["API gateway", "#FFE7B3", ["Auth", "Rate limits"]],
            ["Tracking service", "#DDF4D2", ["ETA model", "Event stream"]],
          ].map(([name, tone, parts], i) => (
            <div key={name as string} className="relative flex flex-col gap-1 rounded-lg border border-black/10 bg-white p-2">
              <span className="rounded px-1.5 py-1" style={{ background: tone as string }}>
                {name as string}
              </span>
              {(parts as string[]).map((part) => (
                <span key={part} className="rounded border border-dashed border-black/15 px-1.5 py-1 font-normal text-[#555]">
                  {part}
                </span>
              ))}
              {i < 2 && (
                <span className="absolute top-1/2 -right-[clamp(10px,3cqw,32px)] h-px w-[clamp(10px,3cqw,32px)] bg-[#4262FF]" />
              )}
            </div>
          ))}
        </div>
      </MiroFrame>
    ),
  },
  {
    label: "Process mapping",
    board: (
      <MiroFrame title="Refund flow" icon="→">
        <div className="flex flex-1 flex-col gap-1.5 text-[clamp(8px,1.1cqw,11px)] text-[#191812]">
          {[
            ["Customer", ["Requests refund", "Gets email"], "#EEF0FB"],
            ["Support", ["Checks order", "Approves"], "#FFF4E0"],
            ["Finance", ["Issues refund"], "#EAF7E4"],
          ].map(([lane, steps, tone]) => (
            <div key={lane as string} className="flex flex-1 items-center gap-2 rounded-md px-2" style={{ background: tone as string }}>
              <span className="w-[18%] shrink-0 font-medium">{lane as string}</span>
              {(steps as string[]).map((step, i) => (
                <span key={step} className="flex items-center gap-2">
                  {i > 0 && <span className="text-[#4262FF]">→</span>}
                  <span className="rounded-md border border-black/10 bg-white px-2 py-1.5 shadow-sm">{step}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </MiroFrame>
    ),
  },
];

const miroAsset = (path: string) => `https://framerusercontent.com/${path}`;
const miroStories = [
  { stat: "3.6x", label: "faster time to market", video: miroAsset("assets/HiaEWLgcnRSn2zuZ6KpM8fLquhU.mp4"), poster: miroAsset("images/uIRqtTqzgtqaVuWSUgkiU6DGgI.jpeg?scale-down-to=1024"), logo: miroAsset("images/qnmInj9GvDd6WOfIZhusYN3Zc.svg"), logoAlt: "PepsiCo", alt: "Two colleagues reviewing printed layouts at a table" },
  { stat: "50%", label: "shorter planning process", video: miroAsset("assets/RFRFxk34lyIrm8YL9jefiBoUk8I.mp4"), poster: miroAsset("images/GHMgTmbz8qR7eeU8e7Oo86AVxIQ.jpeg?scale-down-to=1024"), logo: miroAsset("images/F9Usn38nwt2sWaJoruk1clYzR0g.svg"), logoAlt: "ASOS", alt: "Shirts hanging on a clothing rail" },
  { stat: "2x", label: "faster time to market", video: miroAsset("assets/FNmet1EVdzlxlDw518uVkowKxw.mp4"), poster: miroAsset("images/ydQ4lfokqxcCYfp2CxNAzOzCc.jpeg?scale-down-to=1024"), logo: miroAsset("images/id3aQCVAlGsfjavYwoAaB4f3rWc.png?scale-down-to=512"), logoAlt: "Keller Williams", alt: "A man pointing at a screen by a window" },
];

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
const interTightSemibold = Inter_Tight({ weight: ["600"], subsets: ["latin"] });
const interTightBold = Inter_Tight({ weight: ["700"], subsets: ["latin"] });
const lexendExa = Lexend_Exa({ weight: ["300", "400"], subsets: ["latin"] });
const lexend = Lexend({ weight: ["300", "400", "500"], subsets: ["latin"] });

/** The four products from the Calendly homepage hero, with its copy and poster art. Icons are our own. */
const calendlyPoster = (file: string) => `https://marketing-assets.calendly.com/generated/rive-posters/${file}.webp`;
const iconProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const calendlyProducts = [
  {
    name: "Scheduling",
    color: "#6BB1FF",
    ringColor: "#4890E3",
    heading: "Book meetings with the world\u2019s #1 scheduling tool",
    body: "Giving you complete control and total customization, Calendly is the easiest and most powerful way to find time to connect.",
    poster: "b04d612fb74d5435",
    icon: (
      <svg aria-hidden {...iconProps}>
        <path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" />
      </svg>
    ),
  },
  {
    name: "Callie",
    badge: "Beta",
    color: "#DBEE9F",
    ringColor: "#BAD855",
    heading: "Introducing your 24/7 AI scheduling assistant",
    body: "Add Callie to any email thread to coordinate scheduling on your behalf without switching tools or sacrificing control.",
    poster: "188ed0f298bfcd83",
    icon: (
      <svg aria-hidden {...iconProps}>
        <path d="M12 3c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8Z" />
      </svg>
    ),
  },
  {
    name: "Notetaker",
    badge: "New",
    color: "#B89FFA",
    ringColor: "#997EDF",
    heading: "Actionable, shareable recaps for every meeting",
    body: "Finish the day knowing every meeting was captured, next steps were tracked, and follow-ups were handled.",
    poster: "b8bcdf65d8437a8a",
    icon: (
      <svg aria-hidden {...iconProps}>
        <path d="M5 4h10l4 4v12H5Z" />
        <path d="M9 11h6M9 15h4" />
      </svg>
    ),
  },
  {
    name: "Payments",
    badge: "New",
    color: "#5DDFD7",
    ringColor: "#14C1B6",
    heading: "Flexible, built-in payment tools",
    body: "Charge upfront for meetings, sell packages, and send invoices with payment features that make it easy to get paid.",
    poster: "28b3b4b41373a86c",
    icon: (
      <svg aria-hidden {...iconProps}>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 10h18M15 15h2" />
      </svg>
    ),
  },
];

/** The five customer stories from the Calendly homepage, with its live photos and copy. */
const calendlyImage = (file: string, width: number) =>
  `https://cdn.calendlycms.com/cdn-cgi/image/width=${width},quality=85,format=webp,fit=scale-down/${file}`;
const calendlyStories = [
  {
    headline: "75 hours saved monthly",
    quote: "\u201cCalendly helps us protect our team\u2019s time and make every support interaction count.\u201d",
    name: "Marques Stewart",
    role: "Managing Director of Technology at Achievement First",
    photo: "achievement",
  },
  {
    headline: "80% reduction in booking-related emails",
    quote: "\u201cWe care deeply about the experience they have with us \u2014 and Calendly helps us start it off right.\u201d",
    name: "Akira Bradley",
    role: "Co-Founder at Barking with the Bradley\u2019s",
    photo: "BarkingwithBradleys",
  },
  {
    headline: "3 to 5 hours saved per week",
    quote: "\u201cNotetaker organizes the chaos of dialogue into clarity.\u201d",
    name: "Lizzie Lewis",
    role: "Founder at Kitty of Angels",
    photo: "Kitty-of-angels",
  },
  {
    headline: "$1,200 annual savings",
    quote: "\u201cI use Calendly every single day. Without it, I honestly couldn\u2019t run my business.\u201d",
    name: "Pua Pakele",
    role: "Founder at RBL Media",
    photo: "RBL",
  },
  {
    headline: "100% attendance rate",
    quote: "\u201cAdding a booking fee didn\u2019t just reduce no-shows \u2014 it changed the tone of my consultations.\u201d",
    name: "Elizabeth Saunders",
    role: "Founder at Real Life E",
    photo: "reallifee",
  },
];
const newsreader = Newsreader({ weight: ["500"], subsets: ["latin"] });

/** The five experts from the Medrio homepage, with its live photos and copy. */
const medrioThumb = (file: string) => `https://medrio.com/wp-content/uploads/elementor/thumbs/${file}`;
const medrioExperts = [
  {
    name: "Melissa Newara",
    role: "VP, eClinical Consulting",
    photo: "Melissa_Newara_Circle_Frame-rl1gngqfit9pl11070o4ebggl09kdwv0wiqo16syy0.png",
    linkedin: "https://www.linkedin.com/in/melissa-newara-4934a05b/",
    bio: "20+ years in clinical research, from running trials at UPMC to leading eClinical solution strategies, means Melissa has sat on both sides of the table. Her team runs every demo and protocol review so you know exactly what Medrio can do for your study goals.",
  },
  {
    name: "Rod McGlashing",
    role: "Data Sciences Subject Matter Expert",
    photo: "Rod_McGlashing_Circle_Frame-rl1hgojtyf9kgol6l5bneg19b69an7unx4r01thfjc.png",
    linkedin: "https://www.linkedin.com/in/mcglashing/",
    bio: "25 years in clinical data management at PAREXEL, DFS Pharma, and beyond means Rod has seen every protocol edge case imaginable. He reviews yours before you commit, so your study is scoped right, risks are surfaced early, and nothing surprises you later.",
  },
  {
    name: "Julie Tyson",
    role: "Sr. Director, Clinical Data Services",
    photo: "Julie_Tyson_Circle_Frame-rl1hhdxh2y8b65kbgyakrrmpcks7f1nf0md40afsvc.png",
    linkedin: "https://www.linkedin.com/in/julie-tyson-80308811/",
    bio: "Julie spent 25 years in clinical data management before joining Medrio, so when she says her team can handle your study end-to-end, she means it. eCRF builds, data management, biostatistics, and database lock. Clean data, protected timelines, every time.",
  },
  {
    name: "Elizabeth Laws",
    role: "Customer Enablement Manager",
    photo: "Elizabeth_Laws_Circle_Frame-rl1hh4j36lvfy1xyzu8b2u03eq2ja2m3nbu97itqlk.png",
    linkedin: "https://www.linkedin.com/company/medrio/",
    bio: "Liz does not use generic training slides. She learns your protocol, your team, and your goals first. Then she builds everything around them. Customers who train with Elizabeth go live faster, open fewer support tickets, and actually know what they are doing.",
  },
  {
    name: "Darshan Kansagara",
    role: "Solutions Optimization Director",
    photo: "Darshan_Kansagara_Circle_Frame-rl1hgw2jh3jv1ka9d8knye4y2988csoim5yvw16a5k.png",
    linkedin: "https://www.linkedin.com/in/darshankansagara/",
    bio: "25 years across PAREXEL, Onyx/Amgen, INC Research, and more means Darshan has solved complex clinical data problems at every level and in every setting. When your configuration is not working or your study is stuck, he is the person you want on the call.",
  },
];
const instrumentSans = Instrument_Sans({ subsets: ["latin"] });
const hankenGrotesk = Hanken_Grotesk({ weight: ["200", "300", "400"], subsets: ["latin"] });
/** Closest Google match to Ironclad's Moderat (same label width at 18px/500). */
const hankenGroteskMedium = Hanken_Grotesk({ weight: ["500"], subsets: ["latin"] });
const monaSans = Mona_Sans({ subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ weight: ["300"], subsets: ["latin"] });
const montserrat = Montserrat({ weight: ["400", "500", "600"], subsets: ["latin"] });
const inter = Inter({ weight: ["400", "700"], subsets: ["latin"] });
const interSemibold = Inter({ weight: ["600"], subsets: ["latin"] });

/** The words and colours from the notion.com hero pill, in its order. */
const notionPillWords: PillWord[] = [
  { text: "Think", background: "#E6F3FE", dot: "#097FE8" },
  { text: "Ship", background: "#D0F4D8", dot: "#1AAE39" },
  { text: "Create", background: "#FFDEC4", dot: "#FF6D00" },
  { text: "Build", background: "#FFE4AF", dot: "#FFB110" },
  { text: "Jam", background: "#EADBFA", dot: "#9849E8" },
  { text: "Scale", background: "#BDE6E4", dot: "#27918D" },
];
const dmSans = DM_Sans({ weight: ["500", "600", "800"], subsets: ["latin"] });

/** The "Shipped with Framer" gallery rows from the Framer homepage, with its live screenshots. */
const framerShot = (file: string) => `https://framerusercontent.com/images/${file}`;
const framerShowcase: ShowcaseItem[][] = [
  [
    { src: framerShot("QSALLMZz20lUztB4mySTDLq6mE.png?scale-down-to=1400"), alt: "Design studio site", kind: "site" },
    { src: framerShot("ordt7SZDaUEWKA368UbAGtdIno.png?scale-down-to=1024"), alt: "Maggie site on a phone", kind: "mobile", position: "top" },
    { src: framerShot("a1daVaOmbl26jqNCw1Q0P3vhWZQ.png?scale-down-to=1400"), alt: "Midlife Engineering site", kind: "site", position: "top" },
    { src: framerShot("qgcb6nXCOIxXxk9CLxf9WOoOk.png?scale-down-to=1024"), alt: "i-D Elle Fanning site on a phone", kind: "mobile" },
    { src: framerShot("wVxwU0qi5YsLHBFbDaX8c3jTcU.png?scale-down-to=1400"), alt: "ORO site", kind: "site", position: "top" },
    { src: framerShot("AfVrJxeJkkgPpnO71Nw1tpmiiyI.jpg?scale-down-to=1024"), alt: "i-D site on a phone", kind: "mobile" },
  ],
  [
    { src: framerShot("RtheNIazFJm6EqfeKh66Bi7wyGI.png?scale-down-to=1024"), alt: "Maggie site on a phone", kind: "mobile" },
    { src: framerShot("CC3vnYoPhqbdIEFTrhc9At8bgWo.png?scale-down-to=1400"), alt: "Network intelligence site", kind: "site" },
    { src: framerShot("YCWnviU2EZwsP64iysymO773I.png?scale-down-to=1024"), alt: "Tripadvisor site on a phone", kind: "mobile" },
    { src: framerShot("wbyAS4r6FWaI1G1ena314OJs.png?scale-down-to=1400"), alt: "Legora site", kind: "site" },
    { src: framerShot("Y6F5zkargty3ahKr9VGtA83ujXU.png?scale-down-to=1024"), alt: "Site on a phone", kind: "mobile" },
    { src: framerShot("WDlxZ5aairNkZSH0cyHqAzB2w.png?scale-down-to=1400"), alt: "Site made in Framer", kind: "site" },
  ],
];
const publicSans = Public_Sans({ weight: ["700"], subsets: ["latin"] });

/** The six benefit tabs from the PandaDoc homepage, with its copy and video stills from Mux. */
const pandadocMux = (id: string) => `https://image.mux.com/${id}/thumbnail.webp?width=1600&time=6`;
const pandadocFeatures = [
  { title: "Create", mux: "O2NQd2m101khSAVtDOv28ETFLpsgUusVwB6oOC1eGLSc", body: "Easily generate custom agreements tailored to your audience and workflow with our drag-and-drop editor.", links: ["Smart content"] },
  { title: "Collaborate", mux: "f9ISrWiUZXWOzabnLX69qJrsB700juQ5tIb02l9Jw9mtE", body: "With PandaDoc, everyone\u2019s eyes are on the same document for real-time redlining, comments, approvals, and more.", links: ["Workspaces", "Rooms"] },
  { title: "Automate", mux: "JeosgBmweHfGEvFhQfHulh1023JY4W00eLrpr4UbJWvpQ", body: "PandaDoc's CRM integrations, embeddable API, and automation features speed up your workflows while eliminating errors and repetitive tasks.", links: ["CRM integration", "API"] },
  { title: "Sign", mux: "SuTI3Vv8oCpHgz75v79dSgNcFeSWVBztJDlKPlzAlXI", body: "Not only can you capture signatures, but decide signing order, verify the identity of recipients, set signing groups, and even notarize documents.", links: ["Signing order", "eSignature"] },
  { title: "Analyze", mux: "d8lRBHkplQ4me9cAqISPvNOeXc14PVtciaRWTFFYkNg", body: "PandaDoc records an audit trail for every document, reports user activity, and tracks document metrics, too.", links: ["Document tracking", "Audit trail"] },
  { title: "Get paid", mux: "pc8X00oxxutB5FHXVPAabJYvL6rGYZkRBM00aKSi01LyDM", body: "Easily embed trusted payment gateways directly into bills and invoices so customers can pay with just a few clicks.", links: ["Payments"] },
];

/** UJET's two integration columns, with its live logo files. */
const outfit = Outfit({ weight: ["400", "600"], subsets: ["latin"] });
const ujetLogo = (file: string, alt: string) => ({ src: `https://assets.ujet.cx/${file}`, alt });
const ujetIntegrations = [
  [
    ujetLogo("Zendesk_20250729030712.svg", "Zendesk"),
    ujetLogo("microsoft-dynamics_20250729030812.svg", "Microsoft Dynamics"),
    ujetLogo("observe-ai_20250729030928.svg", "Observe.AI"),
    ujetLogo("Kustomer_20250917025244.svg", "Kustomer"),
    ujetLogo("Alvaria_20250917024933.svg", "Alvaria"),
    ujetLogo("Salesforce.com_logo%202_20250827105618.svg", "Salesforce"),
    ujetLogo("google-cloud_20250729031042.svg", "Google Cloud"),
    ujetLogo("genesys_20251113015737.svg", "Genesys"),
    ujetLogo("gorgias_20251113020409.svg", "Gorgias"),
    ujetLogo("Logo_de_Crisp.svg%201_20251113015910.svg", "Crisp"),
    ujetLogo("APPFOLLOW_20251113030602.svg", "AppFollow"),
    ujetLogo("Freshworks_20250917030647.svg", "Freshworks"),
  ],
  [
    ujetLogo("hubspot_20250729031228.svg", "HubSpot"),
    ujetLogo("servicenow_20250729031301.svg", "ServiceNow"),
    ujetLogo("SuccessKPI_20250729031559.svg", "SuccessKPI"),
    ujetLogo("Oracle_logo%201_20250917025350.svg", "Oracle"),
    ujetLogo("calabrio_20250917030411.svg", "Calabrio"),
    ujetLogo("verint_20250827105738.svg", "Verint"),
    ujetLogo("SAP%201_20250917030848.svg", "SAP"),
    ujetLogo("Freshdesk_20251113021031.svg", "Freshdesk"),
    ujetLogo("Aircall_20251113021051.svg", "Aircall"),
    ujetLogo("intercom-1-logo-png-transparent%201_20251113015258.svg", "Intercom"),
    ujetLogo("Microsoft_logo_(2012)%201_20250917031529.svg", "Microsoft"),
    ujetLogo("ZOHO_logo_2023%201_20250917031503.svg", "Zoho"),
  ],
];

/** Hatch's workspace bento, with its live Framer images and copy. */
const hatchImage = (id: string) => `https://framerusercontent.com/images/${id}`;
const hatchPanels: BentoPanel[] = [
  {
    title: "Managed / Serviced Offices",
    marquee: ["Managed", "Serviced Offices"],
    color: "#50266A",
    thumb: hatchImage("leHUQ4tJJnmgDWn7DfEULja37s8.png?width=320&height=316"),
    description:
      "Fully serviced offices for teams and enterprises - we run the space so you can run your business. Ideal for companies setting up or relocating their Colombo operations.",
    ctaLabel: "Enquire about a space",
    href: "#",
  },
  {
    title: "Hot Desks",
    color: "#2076AD",
    thumb: hatchImage("Jj6GeGuP0BEC3XYDVf0ER9Py1xo.jpg?scale-down-to=1024"),
    description:
      "A flexible seat in the shared space - come in, plug in, get to work. Best for solo founders and anyone who doesn\u2019t need the same desk twice.",
    ctaLabel: "Enquire about a space",
    href: "#",
  },
  {
    title: "Private Offices",
    color: "#56BAA4",
    thumb: hatchImage("VqwBfkbb9FUk8hITDMKIxrtfs.png?scale-down-to=1024"),
    description: "A lockable office for your team inside the community - your own door, with the coworking floor just outside it.",
    ctaLabel: "Enquire about a space",
    href: "#",
  },
  {
    title: "Dedicated Desks",
    color: "#CDCEA6",
    accent: "#8E8F5E",
    thumb: hatchImage("PkqEqFxz1sVL5bIrUNo5efpgNY.png?scale-down-to=1024"),
    description: "Your own desk in the shared space, kept for you every day - leave your monitor, keep your spot.",
    ctaLabel: "Enquire about a space",
    href: "#",
  },
];
/** Hatch's meeting rooms, with the live Framer photos and details. */
const hatchRoom = (name: string, image: string, capacity: string, bullets?: string[], duration = true) => ({
  title: name,
  thumb: hatchImage(`${image}?scale-down-to=512`),
  tags: [
    ...(duration ? [{ icon: <HourglassIcon />, label: "Duration: 1h (Minimum)" }] : []),
    { icon: <ArmchairIcon />, label: `Capacity: ${capacity}` },
  ],
  bullets,
});
const hatchRooms: HoverListItem[] = [
  hatchRoom("Boardroom", "VUd1ZYESDd8zZURbQqAEFT3uXI.jpg", "10", ["HD TV including HDMI", "Whiteboard", "Air conditioning", "WIFI"]),
  hatchRoom("Cactus", "lQpLUdtGD8aHqQRfK7Ux8h6Ik.jpg", "08", ["HD TV including HDMI", "Air conditioning", "WIFI"]),
  hatchRoom("Maze", "yU1NoqIN52raTECqqurlduiErwg.jpg", "06", ["Whiteboard", "HD TV including HDMI", "Air conditioning", "WIFI"]),
];
const hatchStrips: BentoStrip[] = [
  {
    title: "Flexible Packages",
    color: "#CF7A8C",
    thumb: hatchImage("JKaDrr1Vk1Xf8qen2oHaU0FzdDo.jpg?scale-down-to=1024"),
    image: hatchImage("JKaDrr1Vk1Xf8qen2oHaU0FzdDo.jpg?scale-down-to=1024"),
    description:
      "Access to Hatch on your terms, the community, the events, and the space when you need it, without a fixed desk. Come in for the people and the moments that matter, with a set number of days a month in the shared space.",
    ctaLabel: "Enquire about a space",
    href: "#",
  },
  {
    title: "Virtual Package",
    color: "#D4674E",
    thumb: hatchImage("mSA4N6BuHHTWNxTxKTebEqVA8.jpg?scale-down-to=1024"),
    image: hatchImage("mSA4N6BuHHTWNxTxKTebEqVA8.jpg?scale-down-to=1024"),
    description:
      "A business address at Hatch, without the desk, a professional address for correspondence and mail handling, so you can work from anywhere.",
    ctaLabel: "Enquire about a space",
    href: "#",
  },
];

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

/** The "AI That Moves the Needle" stats from the Seemplicity homepage, with its live copy. */
const seemplicityStats = [
  { value: 87, suffix: "%", label: "Proven Not Exploitable", description: "87% of one customer\u2019s priority findings ruled out with evidence. Analysts fixed the rest" },
  { value: 75, suffix: "%", label: "Unowned Reports Traced to Code", description: "75% of one customer\u2019s unowned reports traced to the code behind them" },
  { value: 33, suffix: "K", label: "Hours Back to Analysts", description: "Save an average of 33,000 hours per year by automating prioritization, coordination, and execution" },
  { value: 1.7, prefix: "$", suffix: "M", label: "Annual Cost Savings", description: "Save an average of $1.7M annually by reducing manual effort, rework, and inefficient exposure workflows" },
];

/** The Seemplicity stat section, with a Replay button since the count runs once. */
function StatCounterCardsDemo({ values }: { values: ControlValues }) {
  const [run, setRun] = useState(0);
  return (
    <div className={`${monaSans.className} @container relative min-w-0 bg-[linear-gradient(180deg,#F0DCF3_0%,#FAF0FA_35%,#FFFFFF_60%)] px-5 pt-14 pb-16 @min-[960px]:pt-20`}>
      <button
        type="button"
        onClick={() => setRun((n) => n + 1)}
        className="absolute top-4 right-4 rounded-full border border-[#410051]/15 bg-white/60 px-3 py-1 text-xs text-[#410051] hover:bg-white"
      >
        Replay count
      </button>
      <h2 className={`${bricolage.className} mb-10 text-center text-[36px] leading-[1.2] font-light tracking-[-0.72px] text-[#410051] md:mb-[75px] md:text-[clamp(36px,6cqi,66px)]`}>
        AI That Moves the Needle
      </h2>
      <StatCounterCards
        key={run}
        className="mx-auto max-w-[1200px]"
        items={seemplicityStats}
        numberClassName={`${bricolage.className} text-[36px] leading-[1.2] font-light tracking-[-0.72px] @min-[960px]:text-[clamp(36px,4.6cqi,66px)] @min-[960px]:leading-none @min-[960px]:tracking-[-2.64px]`}
        countDuration={values.countDuration as number}
        countEase={values.countEase as string}
        duration={values.duration as number}
        ease={values.ease as string}
        riseDuration={values.riseDuration as number}
        sinkDuration={values.sinkDuration as number}
        sinkDelay={values.sinkDelay as number}
        revealDuration={values.revealDuration as number}
        revealDelay={values.revealDelay as number}
        revealExitDuration={values.revealExitDuration as number}
        shadowDuration={values.shadowDuration as number}
        leaveDelay={values.leaveDelay as number}
        openWidth={values.openWidth as number}
        minHeight={values.minHeight as number}
        gap={values.gap as number}
        radius={values.radius as number}
        numberColor={values.numberColor as string}
        labelColor={values.labelColor as string}
        minWidth={values.minWidth as number}
      />
    </div>
  );
}

/** The Lovable section headline, with a Replay button since the sweep plays once. */
function GradientSweepTextDemo({ values }: { values: ControlValues }) {
  const [run, setRun] = useState(0);
  return (
    <div className={`${interTightSemibold.className} relative w-full bg-[#FCFBF8] px-6 py-24 md:px-12`}>
      <button
        type="button"
        onClick={() => setRun((n) => n + 1)}
        className="absolute top-4 right-4 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-normal text-neutral-600 hover:bg-neutral-50"
      >
        Replay
      </button>
      <h2 className="max-w-[1100px] text-[36px] leading-[1.1] font-semibold tracking-[-0.04em] text-[#1C1C1C] md:text-[56px]">
        One platform.{" "}
        <GradientSweepText
          key={`${run}-${values.trigger}`}
          colors={values.colors as string}
          duration={values.duration as number}
          delay={values.delay as number}
          ease={values.ease as string}
          blur={values.blur as number}
          trigger={values.trigger as "view" | "load"}
          threshold={values.threshold as number}
        >
          Endless possibilities.
        </GradientSweepText>
      </h2>
      <p className={`${inter.className} mt-6 max-w-[760px] text-lg leading-[1.6] font-normal text-[#5F5F5D] md:text-xl`}>
        If you can describe it, you can build it. Create, run, and manage entire products and businesses from scratch.
      </p>
    </div>
  );
}

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
        easing={values.easing as string}
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
            ease={values.ease as string}
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

/** React Bits' "Ideas into reality" on a near-black stage, in Inter Tight 600. Replay decodes it again. */
function CipherRevealDemo({ values }: { values: ControlValues }) {
  const [run, setRun] = useState(0);
  return (
    <div className={`relative flex min-h-[420px] w-full items-center justify-center bg-[#0B0B0B] px-6 py-20 sm:px-12 ${interTightSemibold.className}`}>
      <CipherReveal
        key={`${run}-${values.text}-${values.charset}`}
        text={values.text as string}
        from={values.from as "blank" | "scrambled"}
        order={values.order as "left" | "right" | "center" | "random"}
        charset={(values.charset as string) || "auto"}
        hover={values.hover as "trail" | "replay" | "none"}
        hoverRadius={values.hoverRadius as number}
        // Replay always plays straight away, whatever the trigger.
        trigger={run > 0 ? "mount" : (values.trigger as "view" | "mount" | "manual")}
        color={values.color as string}
        scrambleColor={values.scrambleColor as string}
        scrambleOpacity={values.scrambleOpacity as number}
        loop={values.loop as boolean}
        duration={values.duration as number}
        scramble={values.scramble as number}
        rate={values.rate as number}
        interval={values.interval as number}
        lockFade={values.lockFade as number}
        className="max-w-full text-center text-[min(80px,11vw)] leading-[1.1] font-semibold tracking-[-0.03em]"
      />
      <button
        type="button"
        onClick={() => setRun((n) => n + 1)}
        className="absolute right-4 bottom-4 rounded-full border border-white/20 bg-[#0B0B0B] px-4 py-1.5 text-sm text-white/80 hover:bg-white/10"
      >
        Replay
      </button>
    </div>
  );
}

/** The Veracode "Start Your Journey_" headline on its #000416 page colour, with its type and spacing. Replay types it out. */
function TypingHeadlineDemo({ values }: { values: ControlValues }) {
  const [run, setRun] = useState(0);
  return (
    <div className={`relative flex min-h-[420px] w-full items-center bg-[#000416] px-6 py-20 md:px-12 ${publicSans.className}`}>
      <TypingHeadline
        key={run}
        text={values.text as string}
        cursor={values.cursor as string}
        cursorColor={values.cursorColor as string}
        // Replay always types the headline out, even with typing off (the
        // original), so there's something to watch; it starts straight away.
        typing={run > 0 || (values.typing as boolean)}
        trigger={run > 0 ? "load" : (values.trigger as "load" | "view")}
        speed={values.speed as number}
        delay={values.delay as number}
        blinkDuration={values.blinkDuration as number}
        blinkEasing={values.blinkEasing as string}
        className="text-[48px] leading-[1.2] font-bold tracking-[-2px] text-white min-[992px]:text-[72px] min-[992px]:leading-[86.4px]"
      />
      <button
        type="button"
        onClick={() => setRun((n) => n + 1)}
        className="absolute right-4 bottom-4 rounded-full border border-white/20 bg-[#000416] px-4 py-1.5 text-sm text-white/80 hover:bg-white/10"
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
    // No scroll area: the demo is about the hover, so the list and card show
    // straight away.
    <div className={`${instrumentSans.className} w-full`} style={{ background: values.background as string }}>
      <VerticalTabSlider
        items={eight25Services}
        slideDuration={values.slideDuration as number}
        slideEase={values.slideEase as string}
        fadeDuration={values.fadeDuration as number}
        fadeEase={values.fadeEase as string}
        stepDuration={values.stepDuration as number}
        stepEase={values.stepEase as string}
        progressEase={values.progressEase as string}
        tabShift={values.tabShift as number}
        inactiveOpacity={values.inactiveOpacity as number}
        glow={values.glow as boolean}
        background={values.background as string}
        color={values.color as string}
        className="px-5 py-16 @min-[960px]:px-10 @min-[960px]:py-24 [&_[role=group]]:font-(family-name:--vts-tab-font)"
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
    </div>
  );
}

/**
 * The Stripe hero: white section, a drifting ribbon on the right, and the
 * headline blending through it. The ribbon is the library's Ribbon wave
 * shader (not part of the component). It sits at z-index 1, between the
 * headline's two copies.
 */
function BlendThroughHeadlineDemo({ values }: { values: ControlValues }) {
  return (
    <section
      className={`${interTight.className} relative isolate flex min-h-[620px] w-full items-center overflow-hidden bg-white px-5 py-24 md:px-16`}
    >
      <RibbonWave className="pointer-events-none absolute inset-0 z-[1]" />
      <div className="w-full max-w-[1080px]">
        <BlendThroughHeadline
          as="h2"
          color={values.color as string}
          tint={values.tint as string}
          tintOpacity={values.tintOpacity as number}
          emphasisColor={values.emphasisColor as string}
          emphasisTint={values.emphasisTint as string}
          emphasisTintOpacity={values.emphasisTintOpacity as number}
          className="max-w-[820px] text-[30px] leading-[1.05] font-normal tracking-[-0.015em] [font-feature-settings:'ss01'] md:text-[40px] xl:text-[48px]"
        >
          <em>Financial infrastructure to grow your revenue.</em> Accept payments, handle business banking,
          <sup className="text-[0.4em]">1</sup> and implement custom revenue models—from your first transaction to
          your billionth.
        </BlendThroughHeadline>
      </div>
    </section>
  );
}

/**
 * The React Bits Pro stage: 24/32 sans, white on near-black, max-w-xl. It
 * plays on scroll, so the preview is a scroll area; Replay remounts it.
 */
function BlurHighlightDemo({ values }: { values: ControlValues }) {
  const [run, setRun] = useState(0);
  return (
    <div className="relative w-full bg-[#0e0e0e]">
      <div className="h-[560px] overflow-y-auto overscroll-contain">
        <p className="py-16 text-center text-sm text-neutral-500">Scroll inside the preview ↓</p>
        {/* Just enough runway that the text starts below the play line, so a short scroll plays it. */}
        <div className="h-[260px]" />
        <div className="grid place-items-center px-6 py-16">
          <BlurHighlight
            key={run}
            text={values.text as string}
            highlightColor={values.highlightColor as string}
            direction={values.direction as "left" | "right" | "top" | "bottom"}
            blur={values.blur as number}
            inactiveOpacity={values.inactiveOpacity as number}
            once={values.once as boolean}
            amount={values.amount as number}
            blurDuration={values.blurDuration as number}
            blurEase={values.blurEase as string}
            blurDelay={values.blurDelay as number}
            highlightDuration={values.highlightDuration as number}
            highlightEase={values.highlightEase as string}
            highlightDelay={values.highlightDelay as number}
            highlightStagger={values.highlightStagger as number}
            className={`${inter.className} max-w-xl text-[24px] leading-[32px] text-white`}
          />
        </div>
        <div className="h-[200px]" />
      </div>
      <button
        type="button"
        onClick={() => setRun((n) => n + 1)}
        className="absolute right-4 bottom-4 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-neutral-300 hover:bg-white/10"
      >
        Replay
      </button>
    </div>
  );
}

/**
 * The Weo Motion playground stage: DM Sans lead copy on near-black. Into view
 * gets a scroll area so re-entry can be tried; both get a Replay button.
 */
function LineMaskRevealDemo({ values }: { values: ControlValues }) {
  const [run, setRun] = useState(0);
  const inView = values.trigger === "view";
  const reveal = (
    <LineMaskReveal
      key={run}
      text={values.text as string}
      trigger={values.trigger as "load" | "view"}
      replay={values.replay as boolean}
      stagger={values.stagger as number}
      duration={values.duration as number}
      ease={values.ease as string}
      from={values.from as "start" | "center" | "end" | "random"}
      className={`${dmSans.className} max-w-[24ch] text-[24px] leading-[1.5] font-semibold text-[#f2f2f2]`}
    />
  );
  return (
    <div className="relative w-full bg-[#0e0e0e]">
      {inView ? (
        <div className="h-[560px] overflow-y-auto overscroll-contain">
          <p className="py-16 text-center text-sm text-neutral-500">Scroll inside the preview ↓</p>
          <div className="h-[420px]" />
          <div className="grid min-h-[560px] place-items-center px-6">{reveal}</div>
          <div className="h-[420px]" />
        </div>
      ) : (
        <div className="grid min-h-[560px] place-items-center px-6">{reveal}</div>
      )}
      <button
        type="button"
        onClick={() => setRun((n) => n + 1)}
        className="absolute right-4 bottom-4 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-neutral-300 hover:bg-white/10"
      >
        Replay
      </button>
    </div>
  );
}

/**
 * The Weo Motion playground stage for pattern 065: DM Sans 800 on near-black.
 * Into view gets a scroll area so re-entry can be tried; both get a Replay button.
 */
function StretchHeadlineDemo({ values }: { values: ControlValues }) {
  const [run, setRun] = useState(0);
  const inView = values.trigger === "view";
  const headline = (
    <StretchHeadline
      key={run}
      text={values.text as string}
      trigger={values.trigger as "view" | "load"}
      replay={values.replay as boolean}
      stagger={values.stagger as number}
      duration={values.duration as number}
      easing={values.easing as string}
      intensity={values.intensity as number}
      from={values.from as "start" | "center" | "end" | "random"}
      className={`${dmSans.className} m-0 text-center text-[clamp(28px,7vw,54px)] leading-[1.02] font-extrabold tracking-[-0.04em] text-[#f2f2f2]`}
    />
  );
  return (
    <div className="relative w-full bg-[#0e0e0e]">
      {inView ? (
        <div className="h-[560px] overflow-y-auto overscroll-contain">
          <p className="py-16 text-center text-sm text-neutral-500">Scroll inside the preview ↓</p>
          <div className="h-[420px]" />
          <div className="grid min-h-[560px] place-items-center px-6">{headline}</div>
          <div className="h-[420px]" />
        </div>
      ) : (
        <div className="grid min-h-[560px] place-items-center px-6">{headline}</div>
      )}
      <button
        type="button"
        onClick={() => setRun((n) => n + 1)}
        className="absolute right-4 bottom-4 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-neutral-300 hover:bg-white/10"
      >
        Replay
      </button>
    </div>
  );
}

/** A centred display heading on near-black, with a Replay button since it plays once. */
function StaggeredTextDemo({ values }: { values: ControlValues }) {
  const [run, setRun] = useState(0);
  return (
    <div className="relative flex min-h-[560px] w-full items-center justify-center bg-[#0A0A0A] px-5 py-24 text-center text-white">
      <StaggeredText
        key={run}
        text={values.text as string}
        split={values.split as "letter" | "word" | "line"}
        trigger={values.trigger as "view" | "load"}
        delay={values.delay as number}
        stagger={values.stagger as number}
        duration={values.duration as number}
        easing={values.easing as string}
        distance={values.distance as number}
        blur={values.blur as number}
        className={`${interTightBold.className} max-w-[9.5ch] text-[52px] leading-[1.05] font-bold tracking-[-0.055em] md:text-[88px]`}
      />
      <button
        type="button"
        onClick={() => setRun((n) => n + 1)}
        className="absolute right-4 bottom-4 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-neutral-300 hover:bg-white/10"
      >
        Replay
      </button>
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
        easing={values.easing as string}
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
/**
 * Draggable corner handles over a preview, for `points` controls. Positions
 * are fractions of the parent element (which must be positioned). Arrow keys
 * nudge a focused handle by 1% (10% with Shift).
 */
const CORNER_LABELS = ["Top left", "Top right", "Bottom right", "Bottom left"];
function CornerHandles({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const points = parsePoints(value);
  const [dragging, setDragging] = useState<number | null>(null);
  const clamp = (n: number) => Math.min(Math.max(n, -0.1), 1.1);
  const move = (i: number, x: number, y: number) =>
    onChange(formatPoints(points.map((p, j) => (j === i ? [clamp(x), clamp(y)] : p))));

  return (
    <div className="absolute inset-0 z-10" style={{ pointerEvents: "none" }}>
      {points.map(([x, y], i) => (
        <button
          key={i}
          type="button"
          aria-label={`${CORNER_LABELS[i] ?? `Corner ${i + 1}`} corner, ${Math.round(x * 100)}%, ${Math.round(y * 100)}%`}
          className="group/handle absolute flex size-8 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded-full outline-none"
          style={{ left: `${x * 100}%`, top: `${y * 100}%`, pointerEvents: "auto", cursor: dragging === i ? "grabbing" : "grab" }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging(i);
          }}
          onPointerMove={(e) => {
            if (dragging !== i) return;
            const rect = e.currentTarget.parentElement!.getBoundingClientRect();
            move(i, (e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
          }}
          onPointerUp={() => setDragging(null)}
          onPointerCancel={() => setDragging(null)}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 0.1 : 0.01;
            const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
            if (!d) return;
            e.preventDefault();
            move(i, x + d[0], y + d[1]);
          }}
        >
          <span
            className="block size-3.5 rounded-full border-2 border-white bg-white/25 shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.4)] transition-transform duration-150 ease-out group-hover/handle:scale-125 group-focus-visible/handle:scale-125 group-focus-visible/handle:ring-2 group-focus-visible/handle:ring-white/60"
            style={dragging === i ? { transform: "scale(1.25)", background: "#fff" } : undefined}
          />
        </button>
      ))}
    </div>
  );
}

export const previews: Record<
  string,
  ComponentType<{ values: ControlValues; setValue?: (name: string, value: string | number | boolean) => void }>
> = {
  "corner-bloom": ({ values }) => (
    <CornerBloomButton
      color={values.color as string}
      bloomColor={values.bloomColor as string}
      textColor={values.textColor as string}
      duration={values.duration as number}
      ease={values.ease as string}
      exitDuration={values.exitDuration as number}
      exitEase={values.exitEase as string}
      pressScale={values.pressScale as number}
      pressDuration={values.pressDuration as number}
      pressEase={values.pressEase as string}
      reducedFade={values.reducedFade as number}
      reducedFadeEase={values.reducedFadeEase as string}
      arrow={values.arrow as boolean}
      href="#"
      className={hankenGroteskMedium.className}
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
      ease={values.ease as string}
      exitDuration={values.exitDuration as number}
      exitEase={values.exitEase as string}
      pressScale={values.pressScale as number}
      pressDuration={values.pressDuration as number}
      pressEase={values.pressEase as string}
      href="#"
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
      ease={values.ease as string}
      exitDuration={values.exitDuration as number}
      exitEase={values.exitEase as string}
      pressScale={values.pressScale as number}
      pressDuration={values.pressDuration as number}
      pressEase={values.pressEase as string}
      href="#"
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
      easing={values.easing as string}
      href="#"
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
      ease={values.ease as string}
      exitDuration={values.exitDuration as number}
      exitEase={values.exitEase as string}
      pressScale={values.pressScale as number}
      pressDuration={values.pressDuration as number}
      pressEase={values.pressEase as string}
      href="#"
    >
      Read our blog
    </OutlineSweepButton>
  ),
  "zoom-image-card": ({ values }) => (
    <ZoomImageCard
      className="w-full max-w-[301px]"
      src="https://images.contentstack.io/v3/assets/blt7efec3660d1ae646/bltfbd08f588b3d02bd/6ab8e7e2442dc1839bab5a52/Frame_2029273449.webp?width=640&format=pjpg&disable=upscale"
      logo="https://images.contentstack.io/v3/assets/blt7efec3660d1ae646/blt62c331bb718721a2/6ab2229498a4e3ea4353ee80/Ducati_red_logo_1.svg"
      logoAlt="Ducati"
      scale={values.scale as number}
      duration={values.duration as number}
      easing={values.easing as string}
      radius={values.radius as number}
      aspectRatio={values.aspectRatio as string}
      scrim={values.scrim as boolean}
      alt="Ducati MotoGP rider celebrating on his bike"
      href="#"
      onClick={(e) => e.preventDefault()}
    />
  ),
  "video-hover-card": ({ values }) => (
    <div className={`${interTight.className} grid w-full max-w-[960px] grid-cols-1 gap-6 sm:grid-cols-3`}>
      {miroStories.map((story) => (
        <VideoHoverCard
          key={story.stat + story.logoAlt}
          {...story}
          zoom={values.zoom as number}
          duration={values.duration as number}
          easing={values.easing as string}
          radius={values.radius as number}
          aspectRatio={values.aspectRatio as string}
          scrim={values.scrim as boolean}
          autoplayOnTouch={values.autoplayOnTouch as boolean}
          href="#"
          onClick={(e) => e.preventDefault()}
        />
      ))}
    </div>
  ),
  "reveal-link-card": ({ values }) => (
    <RevealLinkCard
      src="https://images.contentstack.io/v3/assets/blt7efec3660d1ae646/bltca51762d5e987ae0/6aba052344cd9a42234330eb/That_s_your_AI_advantage_-_3.webp?width=600&format=pjpg&disable=upscale"
      title={values.title as string}
      linkLabel={values.linkLabel as string}
      color={values.color as string}
      textColor={values.textColor as string}
      lift={values.lift as boolean}
      duration={values.duration as number}
      gradientFade={values.gradientFade as number}
      easing={values.easing as string}
      href="#"
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
          easing={values.easing as string}
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
  "staggered-text": ({ values }) => <StaggeredTextDemo values={values} />,
  "blend-through-headline": ({ values }) => <BlendThroughHeadlineDemo values={values} />,
  "line-mask-reveal": ({ values }) => <LineMaskRevealDemo values={values} />,
  "blur-highlight": ({ values }) => <BlurHighlightDemo values={values} />,
  "stretch-headline": ({ values }) => <StretchHeadlineDemo values={values} />,
  // The Weo Motion playground stage for pattern 070: DM Sans 800 on near-black.
  // Scroll boost listens to the page, so scrolling the docs page drives it.
  "text-marquee": ({ values }) => {
    const strip = (
      <TextMarquee
        items={values.items as string}
        separator={(values.separator as string) || null}
        speed={values.speed as number}
        direction={values.direction as "left" | "right"}
        slowOnHover={values.slowOnHover as boolean}
        hoverRamp={values.hoverRamp as number}
        scrollBoost={values.scrollBoost as boolean}
        gap={values.gap as number}
        fade={values.fade as number}
        className={`${dmSans.className} w-full text-[clamp(32px,8vw,64px)] font-extrabold tracking-[-0.03em] text-[#f2f2f2]`}
      />
    );
    return (
      <div className="grid min-h-[560px] w-full place-items-center bg-[#0e0e0e] py-24">{strip}</div>
    );
  },
  "rising-headline": ({ values }) => <RisingHeadlineDemo values={values} />,
  "count-up": ({ values }) => <CountUpDemo values={values} />,
  "gradient-sweep-text": ({ values }) => <GradientSweepTextDemo values={values} />,
  "typing-headline": ({ values }) => <TypingHeadlineDemo values={values} />,
  "cipher-reveal": ({ values }) => <CipherRevealDemo values={values} />,
  // The notion.com hero headline: NotionInter 600 (Inter here), centred and balanced.
  "rotating-pill-headline": ({ values }) => (
    <div className="grid min-h-[420px] w-full place-items-center bg-white px-6 py-20">
      <RotatingPillHeadline
        before={values.before as string}
        words={notionPillWords}
        after={values.after as string}
        interval={values.interval as number}
        duration={values.duration as number}
        easing={values.easing as string}
        colorDuration={values.colorDuration as number}
        className={`${interSemibold.className} max-w-[1000px] text-center text-[42px] leading-[48px] font-semibold tracking-[-1.5px] text-balance text-black/95 min-[600px]:text-[clamp(2.625rem,-25.5px_+_11.25vw,6rem)] min-[600px]:leading-[clamp(3rem,-17px_+_10.8333vw,6.25rem)] min-[600px]:tracking-[clamp(-0.2875rem,2.375px_-_0.645833vw,-0.09375rem)]`}
      />
    </div>
  ),
  "faq-accordion": ({ values }) => (
    <div className="w-full max-w-[1280px] rounded-2xl bg-white px-6 py-12 md:px-10">
      <FaqAccordion
        key={String(values.collapsible)}
        className={interTight.className}
        items={novusFaqs}
        heading={(values.heading as string) || undefined}
        duration={values.duration as number}
        easing={values.easing as string}
        collapsible={values.collapsible as boolean}
        numbered={values.numbered as boolean}
        cardColor={values.cardColor as string}
      />
    </div>
  ),
  "hover-card-list": ({ values }) => (
    // The floating card is centred on its row and overhangs it, so leave room
    // above the first row and below the last one for it on desktop.
    <div className="min-w-0 bg-[#FAFAFA] py-12 md:py-32">
      <HoverCardList
        className={montserrat.className}
        items={hatchRooms}
        accent={values.accent as string}
        duration={values.duration as number}
        easing={values.easing as string}
        cardDuration={values.cardDuration as number}
        cardEase={values.cardEase as string}
        numbered={values.numbered as boolean}
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
        easing={values.easing as string}
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
      easing={values.easing as string}
      tint={values.tint as string}
      height={Number(values.height)}
      href="#"
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
      hoverDuration={values.hoverDuration as number}
      hoverEase={values.hoverEase as string}
      background={values.background as string}
      gap={values.gap as number}
      logoHeight={values.logoHeight as number}
    />
  ),
  "horizontal-scroll": ({ values }) => (
    // Sticky needs a scroll container, so the preview scrolls inside itself.
    <div className={`${interTight.className} h-[760px] overflow-y-auto overscroll-contain bg-[#F7F7F5]`}>
      <p className="py-16 text-center text-sm text-neutral-500">Scroll inside the preview ↓</p>
      <HorizontalScroll
        heading={
          <h2 className="text-[44px] leading-[1.2] text-[#050038]">
            Experience the
            <br />
            Intelligent Canvas
          </h2>
        }
        speed={values.speed as number}
        smoothing={values.smoothing as number}
        stickyTop={values.stickyTop as number}
        cardWidth={values.cardWidth as number}
        headingWidth={values.headingWidth as number}
        gap={values.gap as number}
        panel={values.panel as boolean}
        panelColor={values.panelColor as string}
        radius={values.radius as number}
        background={values.background as string}
        minWidth={0}
      >
        {miroFeatures.map((card) => (
          <MiroCard key={card.title} {...card} />
        ))}
      </HorizontalScroll>
      <p className="py-40 text-center text-sm text-neutral-500">The page carries on</p>
    </div>
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
        smoothDuration={values.smoothDuration as number}
        smoothEase={values.smoothEase as string}
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
              ease={values.ease as string}
              inactiveOpacity={values.inactiveOpacity as number}
              slideDuration={values.slideDuration as number}
              slideEase={values.slideEase as string}
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
            riseEasing={values.riseEasing as string}
            className={`${interTight.className} w-full max-w-[1060px] text-center text-[30px] leading-[1.1] font-light tracking-[-0.01em] text-black xl:text-[60px] xl:tracking-[-0.01em]`}
          />
        </div>
      </section>
      <div className="h-[400px]" />
    </div>
  ),
  "stat-counter-cards": ({ values }) => <StatCounterCardsDemo values={values} />,
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
        ease={values.ease as string}
        focusDuration={values.focusDuration as number}
        focusEase={values.focusEase as string}
        dotDuration={values.dotDuration as number}
        arrowDuration={values.arrowDuration as number}
        playDuration={values.playDuration as number}
        controlEase={values.controlEase as string}
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
        ease={values.ease as string}
        dotDuration={values.dotDuration as number}
        dotEase={values.dotEase as string}
        arrowDuration={values.arrowDuration as number}
        arrowEase={values.arrowEase as string}
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
  "integration-logo-wall": ({ values }) => (
    <IntegrationLogoWall
      className={outfit.className}
      columns={ujetIntegrations}
      speed={values.speed as number}
      direction={values.direction as "up" | "down"}
      stagger={values.stagger as number}
      pauseOnHover={values.pauseOnHover as boolean}
      cardWidth={values.cardWidth as number}
      cardHeight={values.cardHeight as number}
      gap={values.gap as number}
      radius={values.radius as number}
      columnHeight={values.columnHeight as number}
      fade={values.fade as number}
      background={values.background as string}
      cardBackground={values.cardBackground as string}
    >
      <h2 className="mb-[15px] text-[32px] leading-none font-semibold tracking-[-0.6px] text-[#000843] @min-[1024px]:text-[60px]">
        Seamless integration with key customer service solutions
      </h2>
      <p className="mb-5 text-xl leading-[1.5] text-[#000843] @min-[1024px]:mb-[47px]">
        Ensure best-in-breed compatibility with UJET’s ecosystem of Customer Relationship Management (CRM), Workforce
        Engagement Management (WEM), Outbound Dialing, Quality Management, Virtual Agent, Agent Assist, and Business
        Intelligence (BI) partners.
      </p>
      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="group inline-flex items-center gap-2 rounded-[43px] bg-[#FF4E33] px-5 py-3 text-lg font-semibold text-white transition-colors hover:bg-[#FF715C]"
      >
        View All Integrations
        <span
          aria-hidden
          className="inline-block transition-transform duration-400 ease-[cubic-bezier(0.45,0.05,0.55,0.95)] group-hover:-rotate-45"
        >
          →
        </span>
      </a>
    </IntegrationLogoWall>
  ),
  "expert-card-carousel": ({ values }) => (
    <div className={`${lexend.className} min-w-0 bg-black px-[40px] py-16 min-[992px]:py-24`}>
      <div className="mx-auto max-w-[1280px]">
        <h2 className="mb-4 text-center text-[32px] leading-[1.2] font-medium text-white text-balance md:text-[40px]">
          Our experts help you make the right call
        </h2>
        <p className="mx-auto mb-12 max-w-[640px] text-center text-[16px] leading-[1.5] text-white text-balance">
          From protocol design to database lock, Medrio&apos;s clinical and technical experts help you make decisions,
          avoid common pitfalls, and move faster.
        </p>
        <ExpertCardCarousel
          duration={values.duration as number}
          ease={values.ease as string}
          flipDuration={values.flipDuration as number}
          flipEase={values.flipEase as string}
          iconDuration={values.iconDuration as number}
          iconEase={values.iconEase as string}
          arrowDuration={values.arrowDuration as number}
          arrowEase={values.arrowEase as string}
          perView={values.perView as number}
          minCardWidth={values.minCardWidth as number}
          gap={values.gap as number}
          cardHeight={values.cardHeight as number}
          radius={values.radius as number}
          cardColor={values.cardColor as string}
          backColor={values.backColor as string}
          accent={values.accent as string}
          color={values.color as string}
          loop={values.loop as boolean}
          items={medrioExperts.map((expert) => ({
            // eslint-disable-next-line @next/next/no-img-element
            image: <img src={medrioThumb(expert.photo)} alt="" draggable={false} />,
            name: expert.name,
            role: expert.role,
            bio: expert.bio,
            href: expert.linkedin,
          }))}
        />
      </div>
    </div>
  ),
  "testimonial-slider": ({ values }) => (
    <div
      className={`${interTight.className} min-w-0 py-16 min-[992px]:py-24`}
      style={{
        background:
          "radial-gradient(60% 50% at 10% 15%, #3F5FC9 0%, transparent 70%), radial-gradient(55% 60% at 95% 85%, #C59BEA 0%, transparent 70%), radial-gradient(50% 45% at 15% 95%, #F2C6D9 0%, transparent 70%), linear-gradient(180deg, #4A76D6 0%, #7E95E2 55%, #E9D6F1 100%)",
      }}
    >
      <div className="mb-12 flex flex-col items-center gap-4 px-6 text-center text-white min-[992px]:mb-16">
        <span className="text-[13px] font-semibold tracking-[0.08em] uppercase">Customer stories</span>
        <h2 className="max-w-[640px] text-[40px] leading-[1.1] font-medium tracking-[-1.5px] text-balance md:text-[60px] md:tracking-[-2px]">
          Real customers. Real results.
        </h2>
      </div>
      <TestimonialSlider
        autoplay={values.autoplay as boolean}
        interval={values.interval as number}
        duration={values.duration as number}
        ease={values.ease as string}
        fadeDuration={values.fadeDuration as number}
        dotDuration={values.dotDuration as number}
        cardWidth={values.cardWidth as number}
        cardHeight={values.cardHeight as number}
        sideWidth={values.sideWidth as number}
        sideHeight={values.sideHeight as number}
        edgeWidth={values.edgeWidth as number}
        edgeHeight={values.edgeHeight as number}
        gap={values.gap as number}
        edgeGap={values.edgeGap as number}
        radius={values.radius as number}
        imageRadius={values.imageRadius as number}
        connectors={values.connectors as boolean}
        cardColor={values.cardColor as string}
        color={values.color as string}
        accent={values.accent as string}
        trackColor="rgba(255, 255, 255, 0.45)"
        quoteClassName={newsreader.className}
        items={calendlyStories.map((story) => ({
          headline: story.headline,
          quote: story.quote,
          name: story.name,
          role: story.role,
          // eslint-disable-next-line @next/next/no-img-element
          image: <img src={calendlyImage(`${story.photo}-selected.jpg`, 722)} alt="" draggable={false} />,
          // eslint-disable-next-line @next/next/no-img-element
          thumbnail: <img src={calendlyImage(`${story.photo}-default.jpg`, 320)} alt="" draggable={false} />,
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
        hoverEase={values.hoverEase as string}
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
  "showcase-ticker": ({ values }) => (
    <ShowcaseTicker
      className={dmSans.className}
      rows={framerShowcase}
      speed={values.speed as number}
      direction={values.direction as "left" | "right"}
      pauseOnHover={values.pauseOnHover as boolean}
      height={values.height as number}
      gap={values.gap as number}
      radius={values.radius as number}
      background={values.background as string}
      heading={<h2 className="m-0 text-[clamp(32px,4vw,44px)] leading-[1.1] font-medium tracking-[-0.04em]">Shipped with Framer</h2>}
      action={
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="inline-flex rounded-lg bg-white/10 px-3.5 py-2.5 text-sm leading-none font-medium text-white no-underline transition-colors hover:bg-white/15"
        >
          See Framer sites
        </a>
      }
    />
  ),
  "expanding-bento": ({ values }) => (
    <div className="min-w-0 bg-[#FAFAFA] px-4 py-12 md:px-10" onClickCapture={(e) => e.preventDefault()}>
      <ExpandingBento
        className={`${montserrat.className} mx-auto max-w-[1320px]`}
        panels={hatchPanels}
        strips={hatchStrips}
        height={values.height as number}
        stripHeight={values.stripHeight as number}
        expand={values.expand as number}
        stripExpand={values.stripExpand as number}
        duration={values.duration as number}
        ease={values.ease as string}
        speed={values.speed as number}
        gap={values.gap as number}
        radius={values.radius as number}
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
        ease={values.ease as string}
        fadeDuration={values.fadeDuration as number}
        fadeEase={values.fadeEase as string}
        contentDuration={values.contentDuration as number}
        contentDelay={values.contentDelay as number}
        contentExitDuration={values.contentExitDuration as number}
        hoverDelay={values.hoverDelay as number}
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
  "product-tabs": ({ values }) => (
    <div
      className={`${interTight.className} min-w-0 px-4 py-16 min-[992px]:py-24`}
      style={{
        background:
          "radial-gradient(60% 50% at 10% 10%, #3F5FC9 0%, transparent 70%), radial-gradient(55% 60% at 95% 80%, #C59BEA 0%, transparent 70%), radial-gradient(50% 45% at 15% 95%, #F2C6D9 0%, transparent 70%), linear-gradient(180deg, #4A76D6 0%, #8E9BE6 55%, #E9C9E6 100%)",
      }}
    >
      <ProductTabs
        autoplay={values.autoplay as boolean}
        interval={values.interval as number}
        duration={values.duration as number}
        ease={values.ease as string}
        fadeDuration={values.fadeDuration as number}
        hoverDuration={values.hoverDuration as number}
        tabSize={values.tabSize as number}
        gap={values.gap as number}
        maxWidth={values.maxWidth as number}
        radius={values.radius as number}
        cardColor={values.cardColor as string}
        iconColor={values.iconColor as string}
        activeIconColor={values.activeIconColor as string}
        arrows={values.arrows as boolean}
        shadow={values.shadow as boolean}
        progress={values.progress as boolean}
        ringWidth={values.ringWidth as number}
        aria-label="Calendly products"
        items={calendlyProducts.map((product) => ({
          label: product.name,
          icon: product.icon,
          color: product.color,
          ringColor: product.ringColor,
          content: (
            <ProductPanel
              icon={product.icon}
              color={product.color}
              name={product.name}
              badge={product.badge}
              heading={product.heading}
              body={product.body}
              href="#"
              // eslint-disable-next-line @next/next/no-img-element
              media={<img src={calendlyPoster(product.poster)} alt="" draggable={false} />}
            />
          ),
        }))}
      />
    </div>
  ),
  "scroll-progress-tabs": ({ values }) => (
    // Sticky needs a scroll container, so the preview scrolls inside itself.
    <div
      className={`${interTight.className} h-[760px] overflow-y-auto overscroll-contain`}
      style={{
        background:
          "radial-gradient(40% 50% at 8% 85%, rgba(255,214,150,0.45), transparent), radial-gradient(35% 45% at 95% 40%, rgba(225,190,255,0.5), transparent), radial-gradient(30% 40% at 70% 5%, rgba(255,200,230,0.4), transparent), #FAFAF8",
      }}
    >
      <p className="py-16 text-center text-sm text-neutral-500">Scroll inside the preview ↓</p>
      <ScrollProgressTabs
        stepLength={values.stepLength as number}
        intro={values.intro as boolean}
        introLength={values.introLength as number}
        introScale={values.introScale as number}
        fadeDuration={values.fadeDuration as number}
        riseDuration={values.riseDuration as number}
        rise={values.rise as number}
        panelDuration={values.panelDuration as number}
        hoverDuration={values.hoverDuration as number}
        ease={values.ease as string}
        stickyTop={values.stickyTop as number}
        canvasWidth={values.canvasWidth as number}
        dots={values.dots as boolean}
        screenColor={values.screenColor as string}
        fillColor={values.fillColor as string}
        labelColor={values.labelColor as string}
        items={miroBoards.map((b) => ({
          label: b.label,
          content: <div className="@container flex flex-col p-[4%]">{b.board}</div>,
        }))}
      />
      <p className="py-40 text-center text-sm text-neutral-500">The page carries on</p>
    </div>
  ),
  "progress-tabs": ({ values }) => (
    <div className="min-w-0 bg-white px-6 py-16 md:px-10">
      <ProgressTabs
        autoplay={values.autoplay as boolean}
        interval={values.interval as number}
        duration={values.duration as number}
        ease={values.ease as string}
        fillEase={values.fillEase as string}
        tabDuration={values.tabDuration as number}
        hoverDuration={values.hoverDuration as number}
        tabEase={values.tabEase as string}
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
  "accordion-tabs": ({ values }) => (
    <div className={`${inter.className} min-w-0 bg-white px-6 py-16 md:px-10`}>
      <AccordionTabs
        autoplay={values.autoplay as boolean}
        interval={values.interval as number}
        duration={values.duration as number}
        ease={values.ease as string}
        fade={values.fade as number}
        fadeEase={values.fadeEase as string}
        fillEase={values.fillEase as string}
        iconDuration={values.iconDuration as number}
        iconEase={values.iconEase as string}
        chipDuration={values.chipDuration as number}
        chipEase={values.chipEase as string}
        pauseOnHover={values.pauseOnHover as boolean}
        radius={values.radius as number}
        activeBackground={values.activeBackground as string}
        textColor={values.textColor as string}
        hoverColor={values.hoverColor as string}
        stickyTop={24}
        items={pandadocFeatures.map((f) => ({
          title: f.title,
          body: <p>{f.body}</p>,
          links: f.links.map((label) => ({ label, href: "#" })),
          // eslint-disable-next-line @next/next/no-img-element
          media: <img src={pandadocMux(f.mux)} alt="" className="object-cover" />,
        }))}
      />
    </div>
  ),
  "step-tabs": ({ values }) => (
    <div className={`${monaSans.className} min-w-0 bg-[#F5F5F5] px-2 py-16 md:px-6`}>
      <StepTabs
        fadeDuration={values.fadeDuration as number}
        fadeEase={values.fadeEase as string}
        slideDuration={values.slideDuration as number}
        slideEase={values.slideEase as string}
        tabDuration={values.tabDuration as number}
        tabEase={values.tabEase as string}
        iconEase={values.iconEase as string}
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
  "neon-marble": ({ values }) => (
    <section className="relative isolate flex h-[640px] min-w-0 items-center overflow-hidden bg-[#3A1468] px-6 md:px-16">
      <NeonMarble
        className="absolute inset-0 -z-10"
        color1={values.color1 as string}
        color2={values.color2 as string}
        color3={values.color3 as string}
        color4={values.color4 as string}
        color5={values.color5 as string}
        colorShadow={values.colorShadow as string}
        speed={values.speed as number}
        cycle={values.cycle as number}
        scale={values.scale as number}
        warp={values.warp as number}
        stretch={values.stretch as number}
        angle={values.angle as number}
        spread={values.spread as number}
        shadow={values.shadow as number}
        grain={values.grain as number}
        maxPixelRatio={values.maxPixelRatio as number}
        paused={values.paused as boolean}
      />
      <div className="flex max-w-[560px] flex-col gap-5 text-white">
        <h2 className="text-4xl leading-[1.05] font-medium tracking-[-0.03em] md:text-6xl">Make something people remember.</h2>
        <p className="text-base text-white/85 md:text-lg">Bold ideas deserve a stage that moves with them.</p>
      </div>
    </section>
  ),
  "prism-flow": ({ values }) => (
    <section className="relative isolate flex h-[640px] min-w-0 items-center overflow-hidden bg-[#03055C] px-6 md:px-16">
      <PrismFlow
        className="absolute inset-0 -z-10"
        colorDeep={values.colorDeep as string}
        colorBase={values.colorBase as string}
        colorHaze={values.colorHaze as string}
        spectrum1={values.spectrum1 as string}
        spectrum2={values.spectrum2 as string}
        spectrum3={values.spectrum3 as string}
        spectrum4={values.spectrum4 as string}
        spectrum5={values.spectrum5 as string}
        speed={values.speed as number}
        cycle={values.cycle as number}
        spread={values.spread as number}
        angle={values.angle as number}
        offset={values.offset as number}
        width={values.width as number}
        softness={values.softness as number}
        warp={values.warp as number}
        grain={values.grain as number}
        maxPixelRatio={values.maxPixelRatio as number}
        paused={values.paused as boolean}
      />
      <div className="flex max-w-[560px] flex-col gap-5 text-white">
        <h2 className="text-4xl leading-[1.05] font-medium tracking-[-0.03em] md:text-6xl">Every idea, in one clear flow.</h2>
        <p className="text-base text-white/80 md:text-lg">Bring plans, work and launches together so nothing ships without context.</p>
      </div>
    </section>
  ),
  "ribbon-wave": ({ values }) => (
    <section className="relative isolate flex h-[640px] min-w-0 items-center overflow-hidden bg-white px-6 md:px-16">
      <RibbonWave
        className="pointer-events-none absolute inset-0 z-[1]"
        color1={values.color1 as string}
        color2={values.color2 as string}
        color3={values.color3 as string}
        color4={values.color4 as string}
        color5={values.color5 as string}
        speed={values.speed as number}
        twistX={values.twistX as number}
        twistY={values.twistY as number}
        twistZ={values.twistZ as number}
        twistPowerX={values.twistPowerX as number}
        twistPowerY={values.twistPowerY as number}
        twistPowerZ={values.twistPowerZ as number}
        rotationX={values.rotationX as number}
        rotationY={values.rotationY as number}
        rotationZ={values.rotationZ as number}
        positionX={values.positionX as number}
        positionY={values.positionY as number}
        scale={values.scale as number}
        fibres={values.fibres as number}
        glow={values.glow as number}
        saturation={values.saturation as number}
        grain={values.grain as number}
        maxPixelRatio={values.maxPixelRatio as number}
        paused={values.paused as boolean}
      />
    </section>
  ),
  "layer-cascade": ({ values, setValue }) => (
    <section className="relative isolate flex h-[640px] min-w-0 items-center justify-center overflow-hidden bg-[#1C00A3] px-6">
      <LayerCascade
        className="absolute inset-0 -z-10"
        colorTop={values.colorTop as string}
        colorMid={values.colorMid as string}
        colorBottom={values.colorBottom as string}
        background={values.background as string}
        speed={values.speed as number}
        flow={values.flow as number}
        layers={values.layers as number}
        spread={values.spread as number}
        twist={values.twist as number}
        falloff={values.falloff as number}
        corners={parsePoints(values.corners as string)}
        radius={values.radius as number}
        shadow={values.shadow as number}
        maxPixelRatio={values.maxPixelRatio as number}
        paused={values.paused as boolean}
      />
      <div className="pointer-events-none flex max-w-[620px] flex-col items-center gap-4 text-center">
        <p className="text-sm font-medium tracking-[0.12em] text-[#9FEFFF] uppercase">Built for what&apos;s next</p>
        <h2 className="text-4xl leading-[1.05] font-light tracking-[-0.03em] text-white md:text-6xl">
          Every layer of your stack, in view.
        </h2>
      </div>
      {setValue && (
        <CornerHandles value={values.corners as string} onChange={(v) => setValue("corners", v)} />
      )}
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
