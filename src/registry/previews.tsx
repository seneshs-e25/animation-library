"use client";

import type { ComponentType, ReactNode } from "react";
import type { ControlValues } from "./types";
import { FillSweepButton } from "./interactions/button-hovers/fill-sweep-button";
import { CornerBloomButton } from "./interactions/button-hovers/corner-bloom-button";
import { GhostFillButton } from "./interactions/button-hovers/ghost-fill-button";
import { ColorSnapButton } from "./interactions/button-hovers/color-snap-button";
import { CircleRevealButton } from "./interactions/button-hovers/circle-reveal-button";
import { OutlineSweepButton } from "./interactions/button-hovers/outline-sweep-button";
import { ZoomImageCard } from "./interactions/image-hovers/zoom-image-card";
import { RevealLinkCard } from "./interactions/image-hovers/reveal-link-card";
import { LogoMarquee } from "./animations/carousels/logo-marquee";
import { StackingCards } from "./animations/pin-scrollers/stacking-cards";
import { FocusScroll } from "./animations/pin-scrollers/focus-scroll";
import { CollapsingStack } from "./animations/pin-scrollers/collapsing-stack";
import { ExpandingCards } from "./animations/carousels/expanding-cards";
import { SpotlightSlider, SpotlightSlide } from "./animations/carousels/spotlight-slider";
import { AwardsCarousel } from "./animations/carousels/awards-carousel";
import { ScrollTextReveal } from "./animations/scroll-triggers/scroll-text-reveal";
import { ProgressTabs } from "./animations/tabs/progress-tabs";
import { Hanken_Grotesk, Inter_Tight, Lexend_Exa, Mona_Sans, Space_Mono } from "next/font/google";
import { Aurora } from "./shaders/backgrounds/aurora";
import { Curtain } from "./shaders/backgrounds/curtain";

/** Skeleton stand-in for real card content: a media block and text lines. */
function PlaceholderCard({ index }: { index: number }) {
  const bar = "rounded-full bg-white/[0.08]";
  return (
    <div className="grid h-full min-h-[inherit] grid-cols-1 md:grid-cols-[1.1fr_1fr]">
      <div className="m-3 rounded-[14px] bg-white/[0.04] ring-1 ring-white/[0.06] ring-inset" />
      <div className="flex flex-col justify-center gap-3 p-8 md:p-12">
        <span className="mb-2 font-mono text-xs text-white/40">0{index + 1}</span>
        <div className={`${bar} h-5 w-2/3 bg-white/[0.12]`} />
        <div className={`${bar} h-3 w-full`} />
        <div className={`${bar} h-3 w-full`} />
        <div className={`${bar} h-3 w-1/2`} />
        <div className="h-5" />
        <div className={`${bar} h-3 w-full`} />
        <div className={`${bar} h-3 w-full`} />
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
const interTight = Inter_Tight({ weight: ["300", "400"], subsets: ["latin"] });
const lexendExa = Lexend_Exa({ weight: ["300", "400"], subsets: ["latin"] });
const hankenGrotesk = Hanken_Grotesk({ weight: ["300", "400"], subsets: ["latin"] });
const monaSans = Mona_Sans({ subsets: ["latin"] });

/** Fictional awards for the awards carousel demo. */
const awards = [
  { badge: "breakthrough", name: "Secure Frontier Breakthrough Award" },
  { badge: "summit", name: "Summit Innovator Award" },
  { badge: "rising", name: "TLX Rising Startups" },
  { badge: "infosec", name: "2× Global Cyber Defense Awards" },
  { badge: "analyst", name: "Northlight Hot Vendor" },
  { badge: "globe", name: "Silver Stella Award Winner" },
  { badge: "innovator", name: "Clearwave Digital Innovator" },
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

/** Fictional analyst steps for the progress tabs demo. */
const analystSteps = [
  {
    label: "/context",
    nav: "Overview",
    title: "Know what matters to the business.",
    body: "Weigh every finding against the asset it touches, so production risks rise to the top and test-server noise sinks.",
    heading: "Business context",
    tokens: ["prod-api-03", "tier-1", "customer data"],
  },
  {
    label: "/strategy",
    nav: "Details",
    title: "Pick the fix that clears the most risk.",
    body: "Group related findings into one plan of action, ranked by how much exposure each change removes.",
    heading: "Fix strategy",
    tokens: ["14 findings", "3 owners", "1 change"],
  },
  {
    label: "/validation",
    nav: "Raw Findings",
    title: "Confirm it is real before anyone acts.",
    body: "Check reachability and existing controls so teams only spend time on exposures that can actually be exploited.",
    heading: "Validation",
    tokens: ["reachable", "no WAF rule", "exploit public"],
  },
  {
    label: "/remediation",
    nav: "Remediation",
    title: "Hand owners a clear, ready-to-run fix.",
    body: "Each ticket arrives with the exact versions, steps and context the owning team needs to close it in one pass.",
    heading: "Remediation",
    tokens: ["10.4.2261.59", "18.2.2261.57", "10.4.2261.56"],
  },
];

const analystNav = ["Overview", "Remediation", "Details", "Raw Findings", "Resources", "Ticket"];

/** Skeleton product window: a sidebar and a summary panel, per step. */
function AnalystScreen({ step }: { step: (typeof analystSteps)[number] }) {
  return (
    <div className="flex size-full items-end justify-center px-[6%] pt-[5%]">
      <div className="grid h-full w-full max-w-[1100px] grid-cols-[minmax(120px,24%)_1fr] overflow-hidden rounded-t-[12px] bg-white shadow-[0_30px_80px_-20px_rgba(20,0,40,0.5)]">
        <div className="flex flex-col gap-1 bg-[#F4F4F5] py-8 pl-4 sm:pl-6">
          {analystNav.map((item) => (
            <span
              key={item}
              className={`rounded-l-lg px-3 py-2 text-[13px] whitespace-nowrap sm:text-[15px] ${
                item === step.nav ? "bg-white font-semibold text-[#A309BB]" : "text-neutral-400"
              }`}
            >
              {item}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-4 p-6 sm:p-10">
          <p className="text-xl text-[#141414] sm:text-[28px]">{step.heading}</p>
          <p className="text-sm font-semibold text-[#141414]">Summary</p>
          <p className="flex items-center gap-2 text-sm text-[#E3308C]">
            <span aria-hidden>✦</span> Generated by the analyst
          </p>
          <div className="flex flex-col gap-2">
            <div className="h-2.5 w-full rounded-full bg-neutral-200" />
            <div className="h-2.5 w-11/12 rounded-full bg-neutral-200" />
            <div className="h-2.5 w-4/5 rounded-full bg-neutral-200" />
          </div>
          <p className={`${spaceMono.className} flex flex-wrap gap-x-3 text-[13px] text-[#A309BB]`}>
            {step.tokens.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </p>
          <div className="flex flex-col gap-2">
            <div className="h-2.5 w-full rounded-full bg-neutral-200" />
            <div className="h-2.5 w-2/3 rounded-full bg-neutral-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Fictional rows for the collapsing stack demo. */
const stackRows = [
  {
    title: "More compute and throughput",
    body: "As nodes join the cluster, each one brings more CPU, memory and network to the workload.",
    lit: [3, 9, 14, 22, 27, 31, 38, 44],
  },
  {
    title: "More storage capacity and disk performance",
    body: "If the requirement is capacity, add shelves on their own and leave compute as it is.",
    lit: [1, 6, 12, 17, 25, 30, 36, 41, 47],
  },
  {
    title: "Instant volume moves",
    body: "Move a volume between nodes without copying data, so rebalancing a busy cluster takes seconds instead of a maintenance window.",
    lit: [2, 8, 15, 19, 24, 33, 39, 46],
  },
];

/** Light, NetApp-style abstract art: a soft gradient with a tile grid. */
function StackArt({ lit, index }: { lit: number[]; index: number }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(${160 + index * 25}deg, #E3ECFA 0%, #C9D9F4 55%, #B4C9EE 100%)`,
      }}
    >
      <div className="absolute inset-x-[8%] top-[18%] grid grid-cols-12 gap-2 [mask-image:linear-gradient(90deg,transparent,#000_25%,#000_75%,transparent)]">
        {Array.from({ length: 48 }, (_, i) => (
          <div
            key={i}
            className="aspect-square rounded-[4px]"
            style={{ background: lit.includes(i) ? "#FFFFFF" : `rgba(70, 120, 220, ${0.25 + ((i * 7) % 5) * 0.08})` }}
          />
        ))}
      </div>
      <div className="absolute right-[8%] bottom-[12%] h-2 w-[40%] rounded-full bg-[#3E6BD8]/70" />
    </div>
  );
}

/** Fictional testimonials for the expanding cards demo. */
const stories = [
  {
    logo: "Orbit",
    lead: "We rolled it out to legal, sales and procurement in a week. ",
    bold: "Nobody needed training",
    tail: ", they just started using it.",
    colors: ["#5b2ee0", "#2a1170"],
  },
  {
    logo: "Tidal",
    lead: "Contract turnaround went from weeks to ",
    bold: "two days",
    tail: ". Our deal desk finally keeps up with the pipeline.",
    colors: ["#0e8f86", "#06393d"],
  },
  {
    logo: "Halcyon",
    lead: "Every agreement now lives in one place, so ",
    bold: "finding a clause takes seconds",
    tail: ", not an afternoon.",
    colors: ["#d9622b", "#4a1a0b"],
  },
  {
    logo: "Vertex",
    lead: "The approvals flow mirrors how we actually work. ",
    bold: "It removed a whole layer of email",
    tail: " from our week.",
    colors: ["#2f6fdf", "#0b1f4d"],
  },
  {
    logo: "Lumen",
    lead: "Our whole team has found the interface ",
    bold: "really easy to pick up",
    tail: ". Anyone can find what they need without asking.",
    colors: ["#8e3fd6", "#1e0b3a"],
  },
];

/** Abstract stand-in for a customer photo or video still. */
function StoryArt({ colors, index }: { colors: string[]; index: number }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{ background: `radial-gradient(120% 90% at 75% 40%, ${colors[0]} 0%, ${colors[1]} 70%)` }}
    >
      <div
        className="absolute top-[18%] right-[12%] aspect-square w-[38%] rounded-[22%] shadow-[inset_0_-20px_60px_rgba(0,0,0,0.35),inset_0_10px_30px_rgba(255,255,255,0.25)]"
        style={{ background: colors[0], rotate: `${-12 + index * 9}deg` }}
      />
      <div className="absolute top-[14%] right-[6%] size-3 rounded-full bg-white/70" />
      <div className="absolute top-[30%] right-[22%] size-5 rounded-full border-[3px] border-white/70" />
      <div className="absolute right-[9%] bottom-[30%] size-2.5 rounded-full bg-white/60" />
    </div>
  );
}

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
        // The default title color is dark ink for light sites; flip it to
        // white on the dark stage unless the user picked their own color.
        values.titleColor === "#0B0623"
          ? "w-full max-w-[560px] group-data-[theme=dark]/stage:[&_h3]:text-white"
          : "w-full max-w-[560px]"
      }
      src="/demo-images/report-cover.svg"
      eyebrow="Whitepapers & research"
      title="2026 Risk Exposure Report"
      scale={values.scale as number}
      duration={values.duration as number}
      radius={values.radius as number}
      aspectRatio={values.aspectRatio as string}
      eyebrowColor={values.eyebrowColor as string}
      titleColor={values.titleColor as string}
      href={values.href as string}
      onClick={(e) => e.preventDefault()}
    />
  ),
  "reveal-link-card": ({ values }) => (
    <RevealLinkCard
      src="/demo-images/catalog-tile.svg"
      title={values.title as string}
      linkLabel={values.linkLabel as string}
      color={values.color as string}
      textColor={values.textColor as string}
      lift={values.lift as boolean}
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
        {Array.from({ length: 4 }, (_, i) => (
          <PlaceholderCard key={i} index={i} />
        ))}
      </StackingCards>
      <div className="h-[520px]" />
    </div>
  ),
  "collapsing-stack": ({ values }) => (
    // Sticky needs a scroll container, so the preview scrolls inside itself. It's
    // tall enough for the pile to pin (sticky top + two 260px slots), as on a laptop.
    <div className={`${interTight.className} h-[820px] overflow-y-auto overscroll-contain bg-white px-[30px]`}>
      <p className="pt-12 text-center text-sm text-neutral-500">Scroll inside the preview ↓</p>
      <div className="flex flex-col gap-3 pt-16 pb-[60px] lg:gap-5 lg:pb-[100px]">
        <p className="text-xs tracking-[0.15em] text-[#0054D7] uppercase lg:text-base">Independent scale of capacity and compute</p>
        <h2 className="text-[42px] leading-[1.1] font-light tracking-[-0.01em] text-black lg:text-[70px]">
          Independent and massive scale
        </h2>
        <p className="max-w-[720px] text-base leading-[1.6] text-[#333] lg:text-xl">
          Add nodes for more compute and throughput, or add shelves for more capacity and disk performance.
        </p>
      </div>
      <CollapsingStack
        key={`${values.stickyTop}-${values.peek}-${values.padding}-${values.speed}`}
        stickyTop={values.stickyTop as number}
        peek={values.peek as number}
        padding={values.padding as number}
        speed={values.speed as number}
        smoothing={values.smoothing as number}
        radius={values.radius as number}
        background={values.background as string}
        borderColor={values.borderColor as string}
        items={stackRows.map((row, i) => ({
          title: <h3 className="text-[28px] leading-[1.1] font-light text-black lg:text-[36px]">{row.title}</h3>,
          description: (
            <p className="text-base leading-[1.6] tracking-[0.02em] text-[#333] lg:text-xl lg:leading-[1.6] lg:tracking-[0.01em]">
              {row.body}
            </p>
          ),
          media: <StackArt lit={row.lit} index={i} />,
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
      <p className="py-16 text-center text-sm text-neutral-500">Scroll inside the preview ↓</p>
      <div className="h-[320px]" />
      <section className="relative overflow-clip bg-[radial-gradient(60%_80%_at_25%_20%,#A9C4F0_0%,transparent_70%),linear-gradient(180deg,#E6EEFB_0%,#FFFFFF_100%)] px-[30px] py-[120px] xl:py-[200px]">
        <div className="flex flex-col items-center gap-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/demo-logos/quanta.svg" alt="Quanta" className="h-8 w-auto" />
          <ScrollTextReveal
            key={`${values.rise}`}
            text={values.text as string}
            split={values.split as "char" | "word"}
            dimOpacity={values.dimOpacity as number}
            start={values.start as number}
            end={values.end as number}
            rise={values.rise as boolean}
            riseDistance={values.riseDistance as number}
            riseDuration={values.riseDuration as number}
            className={`${interTight.className} w-full max-w-[1060px] text-center text-[40px] leading-[1.1] tracking-[-0.02em] text-black text-balance xl:text-[60px]`}
          />
        </div>
      </section>
      <div className="h-[640px]" />
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
          image: <img src={`/demo-awards/${award.badge}.svg`} alt="" />,
          title: award.name,
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
        items={stories.map((story, i) => ({
          label: story.logo,
          media: <StoryArt colors={story.colors} index={i} />,
          content: (
            <div className="text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/demo-logos/${story.logo.toLowerCase()}.svg`}
                alt={story.logo}
                className="mb-[30px] h-[50px] w-auto brightness-0 invert"
              />
              <p className="max-w-[420px] text-[24px] leading-[1.2] min-[992px]:text-[30px]">
                &ldquo;{story.lead}
                <strong className="font-semibold">{story.bold}</strong>
                {story.tail}&rdquo;
              </p>
            </div>
          ),
        }))}
      />
    </div>
  ),
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
        mediaBackground="radial-gradient(120% 90% at 100% 100%, #A548C2 0%, transparent 45%), radial-gradient(90% 80% at 0% 100%, #9B4DB8 0%, transparent 40%), linear-gradient(180deg, #4A0060 0%, #6A0A82 100%)"
        items={analystSteps.map((step) => ({
          label: step.label,
          media: <AnalystScreen step={step} />,
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
