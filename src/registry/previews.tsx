"use client";

import type { ComponentType } from "react";
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

/** Skeleton dashboard standing in for a product screenshot, tinted per item. */
function PlaceholderScreen({ index, accent }: { index: number; accent: string }) {
  const bar = "rounded-full bg-white/[0.08]";
  return (
    <div className="flex size-full flex-col overflow-hidden rounded-[18px] bg-[#0d1426] p-2.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
      <div className="flex items-center gap-1.5 px-2 pb-2.5">
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="ml-3 font-mono text-[10px] text-white/40">0{index + 1}</span>
      </div>
      <div className="grid flex-1 grid-cols-[22%_1fr] gap-2.5 rounded-[10px] bg-white/[0.03] p-3">
        <div className="flex flex-col gap-2.5 pt-1">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`${bar} h-2`} style={i === index ? { background: accent } : undefined} />
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-3 gap-2.5">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="h-16 rounded-lg"
                style={{ background: accent, opacity: 0.85 - i * 0.2 }}
              />
            ))}
          </div>
          <div className="flex-1 rounded-lg bg-white/[0.04] p-3">
            <div className="flex h-full items-end gap-1.5">
              {[40, 65, 50, 80, 55, 90, 70, 60, 85, 45, 75, 95].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{ height: `${(h + index * 13) % 100 || 30}%`, background: accent, opacity: 0.35 }}
                />
              ))}
            </div>
          </div>
          <div className={`${bar} h-2 w-3/4`} />
          <div className={`${bar} h-2 w-1/2`} />
        </div>
      </div>
    </div>
  );
}

const focusItems = [
  {
    title: "Shared intelligence",
    body: "Every signal seen across the network sharpens detection for everyone, automatically. The platform doesn't just grow; it learns.",
    accent: "#3b6cff",
  },
  {
    title: "Response in seconds",
    body: "Automated playbooks contain threats the moment they appear, so analysts start from a resolved case instead of an alert queue.",
    accent: "#14b8a6",
  },
  {
    title: "One view of everything",
    body: "Endpoints, cloud, identity and network events land in a single timeline, with the context to act on them.",
    accent: "#a855f7",
  },
];

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

/** Fictional case studies for the spotlight slider demo. */
const caseStudies = [
  {
    company: "Northwind",
    quote: "Our partnership works because someone is watching around the clock. Without that speed, an attack costs us hundreds of thousands, if not millions.",
    name: "Dana Whitfield",
    role: "VP of Security, Northwind Logistics",
    colors: ["#3b5bdb", "#0b1440"],
  },
  {
    company: "Halcyon",
    quote: "We need a product that can protect everybody. What we got is one central place where we can protect all of our data.",
    name: "Marcus Lee",
    role: "Director of IT, Halcyon Sports & Entertainment",
    colors: ["#1971c2", "#0a2540"],
  },
  {
    company: "Kestrel",
    quote: "Managed detection and response lets our small team sleep at night. Threats are stopped before we even open the alert.",
    name: "Priya Raman",
    role: "Head of Infrastructure, Kestrel Health",
    colors: ["#0c8599", "#062a33"],
  },
  {
    company: "Meridian",
    quote: "One endpoint agent, one console, and a clear picture of every device we own. Rollout took days, not months.",
    name: "Tom Okafor",
    role: "CISO, Meridian Financial",
    colors: ["#6741d9", "#1a0f40"],
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

/** Placeholder brands for the demo (in `public/demo-logos`). */
const demoLogos = [
  "Northwind", "Lumen", "Orbit", "Fernway", "Quanta", "Halcyon",
  "Kestrel", "Meridian", "Solace", "Tidal", "Vertex", "Brightly",
].map((name) => ({ src: `/demo-logos/${name.toLowerCase()}.svg`, alt: name }));

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
      logos={demoLogos}
      secondsPerLogo={values.secondsPerLogo as number}
      direction={values.direction as "left" | "right"}
      pauseOnHover={values.pauseOnHover as boolean}
      background={values.background as string}
      gap={values.gap as number}
      fadeEdges={values.fadeEdges as boolean}
      grayscale={values.grayscale as boolean}
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
  "focus-scroll": ({ values }) => (
    // Sticky needs a scroll container, so the preview scrolls inside itself.
    <div className="h-[640px] overflow-y-auto overscroll-contain bg-[#001A47] px-6 md:px-10">
      <p className="py-16 text-center text-sm text-white/50">Scroll inside the preview ↓</p>
      <FocusScroll
        stickyTop={values.stickyTop as number}
        mediaHeight={values.mediaHeight as number}
        mediaWidth={values.mediaWidth as number}
        gap={values.gap as number}
        mediaSide={values.mediaSide as "left" | "right"}
        duration={values.duration as number}
        inactiveOpacity={values.inactiveOpacity as number}
        items={focusItems.map((item, i) => ({
          media: <PlaceholderScreen index={i} accent={item.accent} />,
          content: (
            <div className="text-white">
              <h3 className="mb-3 text-[32px] leading-[1.15] font-light tracking-tight">{item.title}</h3>
              <p className="text-base leading-[1.6] text-white/80">{item.body}</p>
              <a href="#" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold">
                Learn more <span aria-hidden>→</span>
              </a>
            </div>
          ),
        }))}
      />
      <div className="h-[420px]" />
    </div>
  ),
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
        How businesses stay secure with Acme
      </h2>
      <SpotlightSlider
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
        items={caseStudies.map((story, i) => ({
          label: story.company,
          // eslint-disable-next-line @next/next/no-img-element
          tab: <img src={`/demo-logos/${story.company.toLowerCase()}.svg`} alt="" />,
          content: (
            <SpotlightSlide
              accent={values.accent as string}
              // eslint-disable-next-line @next/next/no-img-element
              logo={<img src={`/demo-logos/${story.company.toLowerCase()}.svg`} alt={story.company} />}
              quote={story.quote}
              name={story.name}
              role={<span className="font-sans">{story.role}</span>}
              media={<StoryArt colors={story.colors} index={i} />}
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
