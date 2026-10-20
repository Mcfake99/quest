import type { ReactNode } from "react";
import { CS_FIGURES } from "@/components/game/figures-cs";
import { cn } from "@/lib/utils";

const ink = "currentColor";

function Paper({
  caption,
  children,
  wide,
}: {
  caption: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <figure className="mt-5 overflow-hidden rounded-xl bg-surface text-fg shadow-[var(--shadow-border)]">
      <div className={cn("flex items-center justify-center p-4 md:p-5", wide ? "min-h-44" : "min-h-40")}>
        {children}
      </div>
      <figcaption className="border-t border-border px-4 py-2 text-xs text-muted">{caption}</figcaption>
    </figure>
  );
}

function Svg({
  viewBox,
  children,
  className,
}: {
  viewBox: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      className={cn("h-auto w-full max-w-md", className)}
      fill="none"
      stroke={ink}
      strokeWidth={1.6}
      strokeLinecap="square"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function Label({
  x,
  y,
  children,
  anchor = "middle",
}: {
  x: number | string;
  y: number | string;
  children: ReactNode;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={ink}
      stroke="none"
      fontSize={11}
      fontFamily="inherit"
    >
      {children}
    </text>
  );
}

const FIGURES: Record<string, () => ReactNode> = {
  "triangle-345": () => (
    <Paper caption="Figure 1 · Right-angled triangle ABC">
      <Svg viewBox="0 0 240 160">
        <polygon points="40,130 190,130 190,40" />
        <rect x="178" y="118" width="12" height="12" />
        <Label x="115" y="148">4 cm</Label>
        <Label x="208" y="90">3 cm</Label>
        <Label x="100" y="78">x</Label>
        <Label x="36" y="148">A</Label>
        <Label x="198" y="148">C</Label>
        <Label x="198" y="32">B</Label>
      </Svg>
    </Paper>
  ),
  "dt-graph": () => (
    <Paper caption="Figure 1 · Distance–time graph for a journey">
      <Svg viewBox="0 0 280 180">
        <line x1="40" y1="150" x2="260" y2="150" />
        <line x1="40" y1="150" x2="40" y2="18" />
        <polyline points="40,150 100,70 160,70 240,28" />
        <Label x="150" y="172">Time (s)</Label>
        <Label x="14" y="20">s</Label>
        <Label x="14" y="88">Distance</Label>
        <Label x="100" y="164">A</Label>
        <Label x="160" y="164">B</Label>
        <Label x="240" y="164">C</Label>
      </Svg>
    </Paper>
  ),
  "pie-chart": () => (
    <Paper caption="Figure 1 · Favourite sport of 40 students">
      <Svg viewBox="0 0 260 170">
        <circle cx="90" cy="85" r="58" />
        <line x1="90" y1="85" x2="90" y2="27" />
        <line x1="90" y1="85" x2="148" y2="85" />
        <line x1="90" y1="85" x2="49" y2="126" />
        <Label x="118" y="58">Football</Label>
        <Label x="128" y="108">Netball</Label>
        <Label x="58" y="78">Other</Label>
        <Label x="200" y="50">Key</Label>
        <Label x="200" y="70" anchor="start">Football 90°</Label>
        <Label x="200" y="88" anchor="start">Netball 90°</Label>
        <Label x="200" y="106" anchor="start">Other 180°</Label>
      </Svg>
    </Paper>
  ),
  "line-graph": () => (
    <Paper caption="Figure 1 · Graph of y = mx + c">
      <Svg viewBox="0 0 260 180">
        <line x1="30" y1="90" x2="240" y2="90" />
        <line x1="90" y1="20" x2="90" y2="160" />
        <line x1="40" y1="140" x2="220" y2="50" />
        <Label x="248" y="94">x</Label>
        <Label x="90" y="16">y</Label>
        <Label x="102" y="84">(0, 1)</Label>
        <Label x="168" y="52">(2, 5)</Label>
      </Svg>
    </Paper>
  ),
  "parallel-lines": () => (
    <Paper caption="Figure 1 · Parallel lines cut by a transversal">
      <Svg viewBox="0 0 260 160">
        <line x1="20" y1="50" x2="240" y2="50" />
        <line x1="20" y1="110" x2="240" y2="110" />
        <line x1="80" y1="20" x2="180" y2="140" />
        <Label x="70" y="44">a</Label>
        <Label x="128" y="44">b 65°</Label>
        <Label x="86" y="104">c</Label>
        <Label x="148" y="128">d</Label>
        <Label x="248" y="54" anchor="end">L1</Label>
        <Label x="248" y="114" anchor="end">L2</Label>
      </Svg>
    </Paper>
  ),
  "number-machine": () => (
    <Paper caption="Figure 1 · A number machine">
      <Svg viewBox="0 0 300 90">
        <rect x="8" y="28" width="54" height="28" />
        <rect x="86" y="28" width="54" height="28" />
        <rect x="164" y="28" width="54" height="28" />
        <rect x="242" y="28" width="50" height="28" />
        <path d="M62 42 H86" />
        <path d="M140 42 H164" />
        <path d="M218 42 H242" />
        <Label x="35" y="46">input</Label>
        <Label x="113" y="46">× 3</Label>
        <Label x="191" y="46">− 4</Label>
        <Label x="267" y="46">out</Label>
      </Svg>
    </Paper>
  ),
  "cuboid-vol": () => (
    <Paper caption="Figure 1 · A cuboid">
      <Svg viewBox="0 0 240 160">
        <path d="M40 50 H160 V120 H40 Z" />
        <path d="M40 50 L80 20 H200 L160 50" />
        <path d="M160 120 L200 90 V20" />
        <Label x="100" y="138">8 cm</Label>
        <Label x="28" y="90" anchor="end">5 cm</Label>
        <Label x="188" y="70">h</Label>
      </Svg>
    </Paper>
  ),
  "coords-mid": () => (
    <Paper caption="Figure 1 · Points A and C on a grid">
      <Svg viewBox="0 0 240 180">
        <line x1="20" y1="90" x2="220" y2="90" />
        <line x1="120" y1="20" x2="120" y2="160" />
        <circle cx="80" cy="70" r="3" fill={ink} stroke="none" />
        <circle cx="180" cy="130" r="3" fill={ink} stroke="none" />
        <Label x="228" y="94">x</Label>
        <Label x="120" y="16">y</Label>
        <Label x="68" y="66">A</Label>
        <Label x="192" y="134">C</Label>
        <Label x="132" y="84">(0, 0)</Label>
        <Label x="70" y="84">(−2, 1)</Label>
        <Label x="168" y="150">(3, −2)</Label>
      </Svg>
    </Paper>
  ),
  "pentagon-int": () => (
    <Paper caption="Figure 1 · A pentagon">
      <Svg viewBox="0 0 220 170">
        <polygon points="110,18 200,78 168,158 52,158 20,78" />
        <Label x="110" y="48">a</Label>
        <Label x="168" y="78">b</Label>
        <Label x="148" y="140">c</Label>
        <Label x="72" y="140">d</Label>
        <Label x="52" y="78">e</Label>
      </Svg>
    </Paper>
  ),
  "volume-time": () => (
    <Paper caption="Figure 1 · Volume of water in a tank">
      <Svg viewBox="0 0 280 170">
        <line x1="40" y1="140" x2="250" y2="140" />
        <line x1="40" y1="140" x2="40" y2="20" />
        <polyline points="40,140 100,140 180,60 240,60" />
        <Label x="150" y="162">Time (s)</Label>
        <Label x="16" y="24">V</Label>
        <Label x="16" y="70">litres</Label>
        <Label x="100" y="156">10</Label>
        <Label x="180" y="156">30</Label>
      </Svg>
    </Paper>
  ),
  "trig-opp": () => (
    <Paper caption="Figure 1 · Right-angled triangle PQR">
      <Svg viewBox="0 0 240 150">
        <polygon points="40,120 200,120 200,40" />
        <rect x="188" y="108" width="12" height="12" />
        <Label x="36" y="138">P</Label>
        <Label x="212" y="138">Q</Label>
        <Label x="212" y="34">R</Label>
        <Label x="218" y="84">6 cm</Label>
        <Label x="70" y="112">30°</Label>
        <Label x="108" y="78">PQ</Label>
      </Svg>
    </Paper>
  ),
  "circle-tang": () => (
    <Paper caption="Figure 1 · Circle, centre O, with tangent at B">
      <Svg viewBox="0 0 240 170">
        <circle cx="110" cy="90" r="48" />
        <circle cx="110" cy="90" r="2" fill={ink} stroke="none" />
        <line x1="110" y1="90" x2="154" y2="58" />
        <line x1="40" y1="28" x2="210" y2="148" />
        <Label x="110" y="108">O</Label>
        <Label x="164" y="56">B</Label>
        <Label x="214" y="148" anchor="start">tangent</Label>
        <Label x="132" y="68">r</Label>
      </Svg>
    </Paper>
  ),
  "two-way": () => (
    <Paper caption="Figure 1 · Incomplete two-way table">
      <Svg viewBox="0 0 300 150">
        <rect x="20" y="16" width="260" height="112" />
        <line x1="20" y1="44" x2="280" y2="44" />
        <line x1="20" y1="72" x2="280" y2="72" />
        <line x1="20" y1="100" x2="280" y2="100" />
        <line x1="90" y1="16" x2="90" y2="128" />
        <line x1="150" y1="16" x2="150" y2="128" />
        <line x1="210" y1="16" x2="210" y2="128" />
        <Label x="120" y="36">Bus</Label>
        <Label x="180" y="36">Walk</Label>
        <Label x="246" y="36">Total</Label>
        <Label x="55" y="64">Year 10</Label>
        <Label x="55" y="92">Year 11</Label>
        <Label x="55" y="120">Total</Label>
        <Label x="120" y="64">40</Label>
        <Label x="246" y="64">70</Label>
        <Label x="246" y="120">120</Label>
        <Label x="180" y="120">50</Label>
      </Svg>
    </Paper>
  ),
  "series-circuit": () => (
    <Paper caption="Figure 1 · Series circuit">
      <Svg viewBox="0 0 320 150">
        <path d="M36 48 H70" />
        <line x1="70" y1="32" x2="70" y2="64" strokeWidth="2.4" />
        <line x1="80" y1="40" x2="80" y2="56" />
        <path d="M80 48 H126" />
        <circle cx="142" cy="48" r="16" />
        <line x1="132" y1="38" x2="152" y2="58" />
        <line x1="152" y1="38" x2="132" y2="58" />
        <path d="M158 48 H206" />
        <circle cx="222" cy="48" r="16" />
        <Label x="222" y="52">A</Label>
        <path d="M238 48 H284 V108 H36 V48" />
        <rect x="128" y="101" width="52" height="14" />
        <Label x="75" y="80">cell</Label>
        <Label x="142" y="80">lamp</Label>
        <Label x="222" y="80">ammeter</Label>
        <Label x="154" y="96">R</Label>
      </Svg>
    </Paper>
  ),
  "parallel-circuit": () => (
    <Paper caption="Figure 1 · Two lamps in parallel">
      <Svg viewBox="0 0 300 160">
        <line x1="48" y1="34" x2="48" y2="62" strokeWidth="2.4" />
        <line x1="58" y1="42" x2="58" y2="54" />
        <path d="M58 48 H250 V28 H90 V48" />
        <path d="M90 48 V120 H250 V48" />
        <circle cx="120" cy="28" r="14" />
        <line x1="111" y1="19" x2="129" y2="37" />
        <line x1="129" y1="19" x2="111" y2="37" />
        <circle cx="120" cy="120" r="14" />
        <line x1="111" y1="111" x2="129" y2="129" />
        <line x1="129" y1="111" x2="111" y2="129" />
        <Label x="52" y="78">cell</Label>
        <Label x="156" y="32">L1</Label>
        <Label x="156" y="124">L2</Label>
      </Svg>
    </Paper>
  ),
  "vt-graph": () => (
    <Paper caption="Figure 1 · Velocity–time graph">
      <Svg viewBox="0 0 280 180">
        <line x1="40" y1="150" x2="260" y2="150" />
        <line x1="40" y1="150" x2="40" y2="18" />
        <polyline points="40,150 100,50 180,50 240,150" />
        <Label x="150" y="172">Time (s)</Label>
        <Label x="16" y="20">v</Label>
        <Label x="100" y="164">4</Label>
        <Label x="180" y="164">10</Label>
        <Label x="240" y="164">16</Label>
        <Label x="48" y="46">8 m/s</Label>
      </Svg>
    </Paper>
  ),
  refraction: () => (
    <Paper caption="Figure 1 · Light passing from air into glass">
      <Svg viewBox="0 0 260 170">
        <rect x="20" y="85" width="220" height="70" opacity={0.2} fill={ink} stroke="none" />
        <line x1="20" y1="85" x2="240" y2="85" />
        <line x1="130" y1="20" x2="130" y2="155" strokeDasharray="3 3" />
        <line x1="70" y1="28" x2="130" y2="85" />
        <line x1="130" y1="85" x2="148" y2="150" />
        <Label x="48" y="44">incident</Label>
        <Label x="176" y="130">refracted</Label>
        <Label x="40" y="78" anchor="start">air</Label>
        <Label x="40" y="152" anchor="start">glass</Label>
        <Label x="138" y="18" anchor="start">normal</Label>
      </Svg>
    </Paper>
  ),
  "magnet-field": () => (
    <Paper caption="Figure 1 · Magnetic field of a bar magnet">
      <Svg viewBox="0 0 280 150">
        <rect x="90" y="60" width="100" height="28" />
        <Label x="108" y="78">N</Label>
        <Label x="172" y="78">S</Label>
        <path d="M100 60 C 70 20, 210 20, 180 60" />
        <path d="M100 88 C 70 128, 210 128, 180 88" />
        <path d="M110 60 C 90 36, 190 36, 170 60" />
        <path d="M110 88 C 90 112, 190 112, 170 88" />
        <Label x="140" y="24">field lines</Label>
      </Svg>
    </Paper>
  ),
  transformer: () => (
    <Paper caption="Figure 1 · A transformer">
      <Svg viewBox="0 0 280 160">
        <rect x="110" y="30" width="60" height="100" />
        <path d="M90 45 h-8 v70 h8" />
        <path d="M190 50 h8 v50 h-8" />
        <Label x="70" y="40">Np</Label>
        <Label x="70" y="58">200</Label>
        <Label x="220" y="46">Ns</Label>
        <Label x="220" y="64">800</Label>
        <Label x="70" y="128">Vp</Label>
        <Label x="220" y="128">Vs</Label>
        <Label x="140" y="148">iron core</Label>
      </Svg>
    </Paper>
  ),
  "animal-cell": () => (
    <Paper caption="Figure 1 · An animal cell">
      <Svg viewBox="0 0 260 170">
        <ellipse cx="130" cy="85" rx="90" ry="62" />
        <circle cx="130" cy="85" r="22" />
        <ellipse cx="78" cy="70" rx="16" ry="10" />
        <circle cx="180" cy="100" r="5" />
        <Label x="130" y="80">A</Label>
        <Label x="78" y="74">B</Label>
        <Label x="196" y="104">C</Label>
        <Label x="210" y="40" anchor="start">A nucleus</Label>
        <Label x="210" y="56" anchor="start">B mitochondrion</Label>
        <Label x="210" y="72" anchor="start">C ribosome</Label>
      </Svg>
    </Paper>
  ),
  "plant-cell": () => (
    <Paper caption="Figure 1 · A plant cell">
      <Svg viewBox="0 0 270 170">
        <rect x="40" y="30" width="150" height="110" />
        <rect x="48" y="38" width="134" height="94" />
        <circle cx="95" cy="80" r="16" />
        <ellipse cx="150" cy="85" rx="22" ry="36" />
        <ellipse cx="78" cy="115" rx="14" ry="8" />
        <Label x="95" y="84">A</Label>
        <Label x="150" y="90">B</Label>
        <Label x="78" y="119">C</Label>
        <Label x="210" y="50" anchor="start">A nucleus</Label>
        <Label x="210" y="68" anchor="start">B vacuole</Label>
        <Label x="210" y="86" anchor="start">C chloroplast</Label>
      </Svg>
    </Paper>
  ),
  "food-chain": () => (
    <Paper caption="Figure 1 · A woodland food chain">
      <Svg viewBox="0 0 300 120">
        <rect x="12" y="40" width="60" height="32" />
        <rect x="92" y="40" width="60" height="32" />
        <rect x="172" y="40" width="60" height="32" />
        <rect x="252" y="40" width="40" height="32" />
        <Label x="42" y="60">oak</Label>
        <Label x="122" y="60">moth</Label>
        <Label x="202" y="60">shrew</Label>
        <Label x="272" y="60">owl</Label>
        <path d="M72 56 h18" />
        <path d="M152 56 h18" />
        <path d="M232 56 h18" />
        <polygon points="90,56 84,52 84,60" fill={ink} stroke="none" />
        <polygon points="170,56 164,52 164,60" fill={ink} stroke="none" />
        <polygon points="250,56 244,52 244,60" fill={ink} stroke="none" />
      </Svg>
    </Paper>
  ),
  "enzyme-graph": () => (
    <Paper caption="Figure 1 · Rate of enzyme activity against temperature">
      <Svg viewBox="0 0 280 170">
        <line x1="40" y1="140" x2="250" y2="140" />
        <line x1="40" y1="140" x2="40" y2="20" />
        <path d="M48 130 C 90 120, 110 30, 150 28 C 170 28, 190 80, 230 130" />
        <line x1="150" y1="28" x2="150" y2="140" strokeDasharray="3 3" />
        <Label x="150" y="156">Temperature</Label>
        <Label x="16" y="24">Rate</Label>
        <Label x="150" y="164">37 °C</Label>
      </Svg>
    </Paper>
  ),
  "atom-na": () => (
    <Paper caption="Figure 1 · Electron arrangement of sodium">
      <Svg viewBox="0 0 220 170">
        <circle cx="110" cy="85" r="10" />
        <circle cx="110" cy="85" r="28" />
        <circle cx="110" cy="85" r="48" />
        <circle cx="110" cy="85" r="68" />
        <circle cx="138" cy="85" r="3" fill={ink} stroke="none" />
        <circle cx="82" cy="85" r="3" fill={ink} stroke="none" />
        <Label x="110" y="88">11p</Label>
        <Label x="110" y="24">2,8,1</Label>
      </Svg>
    </Paper>
  ),
  electrolysis: () => (
    <Paper caption="Figure 1 · Electrolysis of molten lead bromide">
      <Svg viewBox="0 0 280 170">
        <rect x="70" y="50" width="140" height="80" />
        <line x1="100" y1="30" x2="100" y2="110" />
        <line x1="180" y1="30" x2="180" y2="110" />
        <line x1="100" y1="30" x2="180" y2="30" />
        <Label x="100" y="24">+</Label>
        <Label x="180" y="24">−</Label>
        <Label x="70" y="44" anchor="start">anode</Label>
        <Label x="210" y="44" anchor="start">cathode</Label>
        <Label x="140" y="96">PbBr₂(l)</Label>
      </Svg>
    </Paper>
  ),
  chromatography: () => (
    <Paper caption="Figure 1 · Paper chromatography">
      <Svg viewBox="0 0 220 180">
        <rect x="80" y="20" width="60" height="140" />
        <line x1="80" y1="145" x2="140" y2="145" />
        <line x1="80" y1="30" x2="140" y2="30" strokeDasharray="3 3" />
        <circle cx="110" cy="128" r="4" fill={ink} stroke="none" />
        <circle cx="110" cy="70" r="6" />
        <Label x="156" y="34" anchor="start">solvent front</Label>
        <Label x="156" y="74" anchor="start">spot</Label>
        <Label x="156" y="132" anchor="start">baseline</Label>
      </Svg>
    </Paper>
  ),
  ionic: () => (
    <Paper caption="Figure 1 · Sodium and chlorine forming ions">
      <Svg viewBox="0 0 280 140">
        <circle cx="70" cy="70" r="28" />
        <circle cx="210" cy="70" r="28" />
        <path d="M108 70 h54" />
        <polygon points="168,70 160,66 160,74" fill={ink} stroke="none" />
        <Label x="70" y="74">Na</Label>
        <Label x="210" y="74">Cl</Label>
        <Label x="70" y="118">2,8,1</Label>
        <Label x="210" y="118">2,8,7</Label>
        <Label x="140" y="58">electron</Label>
      </Svg>
    </Paper>
  ),
  flowchart: () => (
    <Paper caption="Figure 1 · A flowchart that uses iteration">
      <Svg viewBox="0 0 220 210" className="max-w-xs">
        <rect x="70" y="8" width="80" height="22" rx="11" />
        <rect x="60" y="44" width="100" height="22" transform="skewX(-12) translate(12,0)" />
        <rect x="60" y="80" width="100" height="22" />
        <polygon points="110,116 150,132 110,148 70,132" />
        <rect x="70" y="170" width="80" height="22" rx="11" />
        <line x1="110" y1="30" x2="110" y2="44" />
        <line x1="110" y1="66" x2="110" y2="80" />
        <line x1="110" y1="102" x2="110" y2="116" />
        <line x1="110" y1="148" x2="110" y2="170" />
        <path d="M150 132 H190 V90 H160" />
        <Label x="110" y="24">Start</Label>
        <Label x="110" y="60">INPUT x</Label>
        <Label x="110" y="96">x = x − 2</Label>
        <Label x="110" y="136">{"x < 0?"}</Label>
        <Label x="110" y="186">End</Label>
        <Label x="198" y="110" anchor="end">No</Label>
        <Label x="122" y="164" anchor="start">Yes</Label>
      </Svg>
    </Paper>
  ),
  "logic-circuit": () => (
    <Paper caption="Figure 1 · Logic circuit for a security system">
      <Svg viewBox="0 0 300 160">
        <Label x="20" y="40" anchor="start">A</Label>
        <Label x="20" y="80" anchor="start">B</Label>
        <Label x="20" y="120" anchor="start">C</Label>
        <path d="M40 36 H90" />
        <path d="M40 76 H90" />
        <path d="M40 116 H70" />
        <path d="M90 36 C 120 36, 120 76, 90 76 Z" />
        <circle cx="82" cy="116" r="10" />
        <Label x="82" y="120">1</Label>
        <path d="M92 56 H140" />
        <path d="M92 116 H140" />
        <rect x="140" y="44" width="36" height="84" />
        <path d="M176 86 H230" />
        <Label x="158" y="90">AND</Label>
        <Label x="110" y="50">OR</Label>
        <Label x="110" y="140">NOT</Label>
        <Label x="244" y="90">P</Label>
      </Svg>
    </Paper>
  ),
  "and-gate": () => (
    <Paper caption="Figure 1 · An AND gate">
      <Svg viewBox="0 0 240 120">
        <path d="M70 30 H120 C160 30, 160 90, 120 90 H70 Z" />
        <path d="M40 42 H70" />
        <path d="M40 78 H70" />
        <path d="M160 60 H200" />
        <Label x="28" y="46" anchor="end">A</Label>
        <Label x="28" y="82" anchor="end">B</Label>
        <Label x="214" y="64">P</Label>
      </Svg>
    </Paper>
  ),
  "star-network": () => (
    <Paper caption="Figure 1 · A network topology">
      <Svg viewBox="0 0 240 160">
        <rect x="100" y="64" width="40" height="28" />
        <circle cx="120" cy="24" r="10" />
        <circle cx="36" cy="80" r="10" />
        <circle cx="204" cy="80" r="10" />
        <circle cx="120" cy="136" r="10" />
        <line x1="120" y1="34" x2="120" y2="64" />
        <line x1="46" y1="80" x2="100" y2="78" />
        <line x1="140" y1="78" x2="194" y2="80" />
        <line x1="120" y1="92" x2="120" y2="126" />
        <Label x="120" y="82">hub</Label>
      </Svg>
    </Paper>
  ),
  breakeven: () => (
    <Paper caption="Figure 1 · Break-even chart">
      <Svg viewBox="0 0 280 180">
        <line x1="40" y1="150" x2="250" y2="150" />
        <line x1="40" y1="150" x2="40" y2="20" />
        <line x1="40" y1="110" x2="240" y2="110" />
        <line x1="40" y1="150" x2="240" y2="40" />
        <line x1="40" y1="150" x2="240" y2="70" />
        <circle cx="148" cy="90" r="3" fill={ink} stroke="none" />
        <line x1="148" y1="90" x2="148" y2="150" strokeDasharray="3 3" />
        <Label x="148" y="166">Q</Label>
        <Label x="16" y="24">£</Label>
        <Label x="250" y="154">Output</Label>
        <Label x="220" y="36">TR</Label>
        <Label x="220" y="66">TC</Label>
        <Label x="220" y="106">FC</Label>
      </Svg>
    </Paper>
  ),
  lifecycle: () => (
    <Paper caption="Figure 1 · Product life cycle">
      <Svg viewBox="0 0 300 170">
        <line x1="30" y1="140" x2="280" y2="140" />
        <line x1="30" y1="140" x2="30" y2="20" />
        <path d="M40 138 C 70 136, 80 120, 100 90 C 120 50, 150 28, 180 32 C 210 38, 230 80, 270 130" />
        <line x1="80" y1="20" x2="80" y2="140" strokeDasharray="3 3" />
        <line x1="130" y1="20" x2="130" y2="140" strokeDasharray="3 3" />
        <line x1="190" y1="20" x2="190" y2="140" strokeDasharray="3 3" />
        <line x1="240" y1="20" x2="240" y2="140" strokeDasharray="3 3" />
        <Label x="55" y="156">Intro</Label>
        <Label x="105" y="156">Growth</Label>
        <Label x="160" y="156">Maturity</Label>
        <Label x="220" y="156">Decline</Label>
        <Label x="16" y="24">Sales</Label>
      </Svg>
    </Paper>
  ),
  "org-chart": () => (
    <Paper caption="Figure 1 · An organisation chart">
      <Svg viewBox="0 0 280 150">
        <rect x="110" y="12" width="60" height="24" />
        <rect x="20" y="70" width="60" height="24" />
        <rect x="110" y="70" width="60" height="24" />
        <rect x="200" y="70" width="60" height="24" />
        <rect x="95" y="116" width="44" height="20" />
        <rect x="141" y="116" width="44" height="20" />
        <line x1="140" y1="36" x2="140" y2="54" />
        <line x1="50" y1="54" x2="230" y2="54" />
        <line x1="50" y1="54" x2="50" y2="70" />
        <line x1="140" y1="54" x2="140" y2="70" />
        <line x1="230" y1="54" x2="230" y2="70" />
        <line x1="140" y1="94" x2="140" y2="104" />
        <line x1="117" y1="104" x2="163" y2="104" />
        <line x1="117" y1="104" x2="117" y2="116" />
        <line x1="163" y1="104" x2="163" y2="116" />
        <Label x="140" y="28">CEO</Label>
        <Label x="50" y="86">HR</Label>
        <Label x="140" y="86">Ops</Label>
        <Label x="230" y="86">Sales</Label>
      </Svg>
    </Paper>
  ),
  "margin-safety": () => (
    <Paper caption="Figure 1 · Units sold, June–August (break-even = 4,000)">
      <Svg viewBox="0 0 280 180">
        <line x1="40" y1="150" x2="250" y2="150" />
        <line x1="40" y1="150" x2="40" y2="18" />
        <line x1="40" y1="86" x2="250" y2="86" strokeDasharray="4 3" />
        <rect x="70" y="42" width="32" height="108" />
        <rect x="130" y="98" width="32" height="52" />
        <rect x="190" y="54" width="32" height="96" />
        <Label x="86" y="166">Jun</Label>
        <Label x="146" y="166">Jul</Label>
        <Label x="206" y="166">Aug</Label>
        <Label x="32" y="90" anchor="end">4k</Label>
        <Label x="86" y="36">7.2k</Label>
        <Label x="146" y="92">3.5k</Label>
        <Label x="206" y="48">6.1k</Label>
        <Label x="248" y="80" anchor="end">BE</Label>
      </Svg>
    </Paper>
  ),
  "bar-gate": () => (
    <Paper caption="Figure 1 · Bar-gate stock graph for June">
      <Svg viewBox="0 0 280 170">
        <line x1="40" y1="140" x2="250" y2="140" />
        <line x1="40" y1="140" x2="40" y2="20" />
        <polyline points="40,40 100,110 100,40 180,110 180,40 250,140" />
        <line x1="40" y1="110" x2="250" y2="110" strokeDasharray="3 3" />
        <Label x="100" y="32">A</Label>
        <Label x="180" y="32">B</Label>
        <Label x="32" y="44" anchor="end">20k</Label>
        <Label x="32" y="114" anchor="end">5k</Label>
        <Label x="40" y="156">0</Label>
        <Label x="100" y="156">10</Label>
        <Label x="180" y="156">20</Label>
        <Label x="250" y="156">30</Label>
        <Label x="150" y="166">Days</Label>
      </Svg>
    </Paper>
  ),
  "design-mix": () => (
    <Paper caption="Figure 1 · The design mix">
      <Svg viewBox="0 0 240 160">
        <polygon points="120,24 210,140 30,140" />
        <Label x="120" y="48">Aesthetics</Label>
        <Label x="70" y="128">Function</Label>
        <Label x="170" y="128">Cost</Label>
      </Svg>
    </Paper>
  ),
  "market-share": () => (
    <Paper caption="Figure 1 · Cinema market share (%)">
      <Svg viewBox="0 0 280 170">
        <line x1="70" y1="20" x2="70" y2="140" />
        <line x1="70" y1="140" x2="250" y2="140" />
        <rect x="90" y="70" width="50" height="70" />
        <rect x="90" y="58" width="50" height="12" opacity={0.35} fill={ink} />
        <rect x="155" y="88" width="50" height="52" />
        <rect x="155" y="94" width="50" height="46" opacity={0.35} fill={ink} />
        <rect x="220" y="100" width="50" height="40" />
        <rect x="220" y="84" width="50" height="16" opacity={0.35} fill={ink} />
        <Label x="115" y="156">Nova</Label>
        <Label x="180" y="156">Peak</Label>
        <Label x="245" y="156">Roxy</Label>
        <Label x="115" y="66">22→24</Label>
        <Label x="180" y="82">20→18</Label>
        <Label x="245" y="78">16→16</Label>
        <Label x="40" y="36" anchor="start">solid 2018</Label>
        <Label x="40" y="52" anchor="start">tint 2021</Label>
      </Svg>
    </Paper>
  ),
  "potato-osmosis": () => (
    <Paper caption="Figure 1 · Potato cylinder in distilled water">
      <Svg viewBox="0 0 220 150">
        <rect x="60" y="30" width="100" height="100" />
        <rect x="92" y="55" width="36" height="62" />
        <Label x="110" y="24">beaker</Label>
        <Label x="110" y="48">distilled water</Label>
        <Label x="110" y="88">potato</Label>
      </Svg>
    </Paper>
  ),
  "punnett-rr": () => (
    <Paper caption="Figure 1 · Cross of two heterozygous pea plants">
      <Svg viewBox="0 0 220 150">
        <rect x="50" y="30" width="120" height="100" />
        <line x1="50" y1="80" x2="170" y2="80" />
        <line x1="110" y1="30" x2="110" y2="130" />
        <Label x="80" y="58">R</Label>
        <Label x="140" y="58">r</Label>
        <Label x="30" y="58">R</Label>
        <Label x="30" y="108">r</Label>
        <Label x="80" y="108">?</Label>
        <Label x="140" y="108">?</Label>
      </Svg>
    </Paper>
  ),
  "chem-cell": () => (
    <Paper caption="Figure 1 · A chemical cell">
      <Svg viewBox="0 0 240 150">
        <rect x="50" y="70" width="140" height="55" />
        <line x1="80" y1="40" x2="80" y2="110" />
        <line x1="160" y1="40" x2="160" y2="110" />
        <path d="M80 40 H160" />
        <rect x="108" y="24" width="24" height="16" />
        <Label x="120" y="36">V</Label>
        <Label x="80" y="128">X</Label>
        <Label x="160" y="128">copper</Label>
        <Label x="120" y="98">electrolyte</Label>
      </Svg>
    </Paper>
  ),
  "disappear-cross": () => (
    <Paper caption="Figure 1 · Timing a colour-change reaction">
      <Svg viewBox="0 0 220 150">
        <ellipse cx="110" cy="50" rx="36" ry="10" />
        <path d="M74 50 V110 Q110 140 146 110 V50" />
        <Label x="110" y="90">mixture</Label>
        <Label x="110" y="138">✕</Label>
        <Label x="110" y="24">eye</Label>
        <path d="M110 30 V48" />
      </Svg>
    </Paper>
  ),
  "ultrasound-echo": () => (
    <Paper caption="Figure 1 · Ultrasound pulse towards a wall">
      <Svg viewBox="0 0 280 120">
        <circle cx="50" cy="60" r="14" />
        <line x1="64" y1="60" x2="220" y2="60" strokeDasharray="4 3" />
        <line x1="230" y1="20" x2="230" y2="100" strokeWidth="4" />
        <Label x="50" y="90">device</Label>
        <Label x="145" y="50">6.6 m</Label>
        <Label x="248" y="60">wall</Label>
      </Svg>
    </Paper>
  ),
  "falling-forces": () => (
    <Paper caption="Figure 1 · Forces on a falling ball">
      <Svg viewBox="0 0 180 160">
        <circle cx="90" cy="80" r="22" />
        <path d="M90 50 V22" />
        <polygon points="90,18 86,28 94,28" fill={ink} stroke="none" />
        <path d="M90 102 V138" />
        <polygon points="90,146 86,136 94,136" fill={ink} stroke="none" />
        <Label x="128" y="30">air resistance</Label>
        <Label x="128" y="142">weight 2.0 N</Label>
      </Svg>
    </Paper>
  ),
  "water-wave": () => (
    <Paper caption="Figure 1 · A water wave">
      <Svg viewBox="0 0 280 140">
        <path d="M20 70 Q 50 20, 80 70 T 140 70 T 200 70 T 260 70" />
        <line x1="80" y1="28" x2="80" y2="112" strokeDasharray="3 3" />
        <line x1="80" y1="70" x2="200" y2="70" />
        <Label x="140" y="62">40 cm</Label>
        <Label x="48" y="70">12 cm</Label>
        <Label x="200" y="128">direction of travel</Label>
      </Svg>
    </Paper>
  ),
  respirometer: () => (
    <Paper caption="Figure 1 · A simple respirometer">
      <Svg viewBox="0 0 260 150">
        <rect x="40" y="40" width="90" height="80" />
        <path d="M130 70 H210" />
        <line x1="160" y1="60" x2="160" y2="80" />
        <Label x="85" y="70">organisms</Label>
        <Label x="85" y="90">soda lime</Label>
        <Label x="190" y="58">coloured</Label>
        <Label x="190" y="74">drop</Label>
        <Label x="160" y="108">scale</Label>
      </Svg>
    </Paper>
  ),
  advert: () => (
    <Paper caption="Figure 1 · A magazine advertisement">
      <Svg viewBox="0 0 260 160">
        <rect x="30" y="16" width="200" height="128" />
        <Label x="130" y="48">CRISP SOAP</Label>
        <Label x="130" y="72">Stay snow-bright.</Label>
        <Label x="130" y="100">Buy today.</Label>
        <Label x="130" y="122">Feel clean.</Label>
      </Svg>
    </Paper>
  ),
  ...CS_FIGURES,
};

export function QuestionFigure({
  figure,
  alt,
}: {
  figure?: string;
  alt?: string;
}) {
  if (!figure) return null;
  if (figure.startsWith("/")) {
    return (
      <figure className="mt-5 overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <img
          src={figure}
          alt={alt ?? "Exam stimulus"}
          className="aspect-[4/3] w-full object-cover"
        />
        {alt ? (
          <figcaption className="border-t border-border px-4 py-2 text-xs text-muted">{alt}</figcaption>
        ) : null}
      </figure>
    );
  }
  const render = FIGURES[figure];
  if (!render) return null;
  return <>{render()}</>;
}

export function hasFigure(figure?: string): boolean {
  if (!figure) return false;
  return figure.startsWith("/") || Boolean(FIGURES[figure]);
}
