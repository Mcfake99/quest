import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const ink = "currentColor";

function Paper({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className="mt-5 overflow-hidden rounded-xl bg-surface text-fg shadow-[var(--shadow-border)]">
      <div className="flex min-h-44 items-center justify-center p-4 md:p-5">{children}</div>
      <figcaption className="border-t border-border px-4 py-2 text-xs text-muted">{caption}</figcaption>
    </figure>
  );
}

function Svg({ viewBox, children, className }: { viewBox: string; children: ReactNode; className?: string }) {
  return (
    <svg viewBox={viewBox} className={cn("h-auto w-full max-w-md", className)} fill="none" stroke={ink} strokeWidth={1.6} strokeLinecap="square" aria-hidden>
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
    <text x={x} y={y} textAnchor={anchor} fill={ink} stroke="none" fontSize={11} fontFamily="inherit">
      {children}
    </text>
  );
}

export const CS_FIGURES: Record<string, () => ReactNode> = {
  "bus-network": () => (
    <Paper caption="Figure 1 · Computers tapped onto one shared cable">
      <Svg viewBox="0 0 280 140">
        <line x1="24" y1="78" x2="256" y2="78" />
        <line x1="20" y1="70" x2="20" y2="86" />
        <line x1="260" y1="70" x2="260" y2="86" />
        {[50, 110, 170, 230].map((x) => (
          <g key={x}>
            <line x1={x} y1="78" x2={x} y2="48" />
            <rect x={x - 16} y="22" width="32" height="22" />
          </g>
        ))}
        <Label x="140" y="108">backbone cable</Label>
        <Label x="140" y="126">terminator at each end</Label>
      </Svg>
    </Paper>
  ),
  "ring-network": () => (
    <Paper caption="Figure 1 · Devices joined in a circle. Arrows show the direction of data">
      <Svg viewBox="0 0 240 170">
        <circle cx="120" cy="78" r="46" />
        <polygon points="166,78 158,74 158,82" fill={ink} stroke="none" />
        <rect x="100" y="8" width="40" height="22" />
        <rect x="186" y="66" width="40" height="22" />
        <rect x="100" y="128" width="40" height="22" />
        <rect x="14" y="66" width="40" height="22" />
        <Label x="120" y="24">A</Label>
        <Label x="206" y="82">B</Label>
        <Label x="120" y="144">C</Label>
        <Label x="34" y="82">D</Label>
      </Svg>
    </Paper>
  ),
  "mesh-network": () => (
    <Paper caption="Figure 1 · Every device has a link to every other device">
      <Svg viewBox="0 0 240 160">
        <line x1="78" y1="40" x2="162" y2="40" />
        <line x1="60" y1="52" x2="60" y2="100" />
        <line x1="180" y1="52" x2="180" y2="100" />
        <line x1="78" y1="112" x2="162" y2="112" />
        <line x1="72" y1="48" x2="168" y2="104" />
        <line x1="168" y1="48" x2="72" y2="104" />
        <rect x="44" y="24" width="32" height="24" fill="var(--color-surface)" />
        <rect x="164" y="24" width="32" height="24" fill="var(--color-surface)" />
        <rect x="44" y="100" width="32" height="24" fill="var(--color-surface)" />
        <rect x="164" y="100" width="32" height="24" fill="var(--color-surface)" />
        <Label x="60" y="40">A</Label>
        <Label x="180" y="40">B</Label>
        <Label x="60" y="116">C</Label>
        <Label x="180" y="116">D</Label>
      </Svg>
    </Paper>
  ),
  "packet-route": () => (
    <Paper caption="Figure 1 · A packet on its way to a school website">
      <Svg viewBox="0 0 320 120">
        <rect x="8" y="40" width="58" height="32" />
        <rect x="96" y="40" width="58" height="32" />
        <ellipse cx="210" cy="56" rx="32" ry="22" />
        <rect x="252" y="40" width="60" height="32" />
        <path d="M66 56 H96" />
        <path d="M154 56 H178" />
        <path d="M242 56 H252" />
        <polygon points="96,56 88,52 88,60" fill={ink} stroke="none" />
        <polygon points="178,56 170,52 170,60" fill={ink} stroke="none" />
        <polygon points="252,56 244,52 244,60" fill={ink} stroke="none" />
        <Label x="37" y="60">laptop</Label>
        <Label x="125" y="60">router</Label>
        <Label x="210" y="60">Internet</Label>
        <Label x="282" y="60">server</Label>
      </Svg>
    </Paper>
  ),
  "dns-lookup": () => (
    <Paper caption="Figure 1 · Looking up questforge.school">
      <Svg viewBox="0 0 300 150">
        <rect x="16" y="20" width="88" height="36" />
        <rect x="106" y="78" width="88" height="36" />
        <rect x="196" y="20" width="88" height="36" />
        <path d="M60 56 V78 H106" />
        <path d="M194 96 H240 V56" />
        <polygon points="106,96 98,92 98,100" fill={ink} stroke="none" />
        <polygon points="240,56 232,52 232,60" fill={ink} stroke="none" />
        <Label x="60" y="36">Browser</Label>
        <Label x="60" y="50">asks for IP</Label>
        <Label x="150" y="94">DNS server</Label>
        <Label x="150" y="108">203.0.113.10</Label>
        <Label x="240" y="36">Web server</Label>
        <Label x="240" y="50">sends the page</Label>
      </Svg>
    </Paper>
  ),
  "pc-insides": () => (
    <Paper caption="Figure 1 · Inside a desktop case. Letters mark the parts">
      <Svg viewBox="0 0 320 200">
        <rect x="16" y="12" width="288" height="176" />
        <rect x="36" y="28" width="200" height="120" />
        <Label x="48" y="44" anchor="start">A</Label>
        <rect x="78" y="46" width="36" height="36" />
        <circle cx="96" cy="64" r="10" />
        <Label x="96" y="96">B</Label>
        <rect x="132" y="48" width="10" height="48" />
        <rect x="146" y="48" width="10" height="48" />
        <Label x="144" y="112">C</Label>
        <rect x="48" y="118" width="70" height="16" />
        <Label x="83" y="148">D</Label>
        <rect x="250" y="36" width="36" height="70" />
        <Label x="268" y="122">E</Label>
        <rect x="36" y="156" width="64" height="22" />
        <Label x="68" y="172">F</Label>
      </Svg>
    </Paper>
  ),
  "rear-ports": () => (
    <Paper caption="Figure 1 · The back of a PC">
      <Svg viewBox="0 0 320 150">
        <rect x="16" y="28" width="288" height="70" />
        <rect x="32" y="48" width="28" height="22" />
        <rect x="78" y="50" width="36" height="16" />
        <rect x="130" y="52" width="22" height="14" />
        <rect x="160" y="52" width="22" height="14" />
        <rect x="200" y="46" width="28" height="22" />
        <circle cx="256" cy="52" r="6" />
        <circle cx="278" cy="52" r="6" />
        <Label x="46" y="118">Power</Label>
        <Label x="96" y="118">Ethernet</Label>
        <Label x="156" y="118">USB</Label>
        <Label x="214" y="118">HDMI</Label>
        <Label x="268" y="118">Audio</Label>
      </Svg>
    </Paper>
  ),
  "task-slow": () => (
    <Paper caption="Figure 1 · Task Manager while the PC feels stuck">
      <Svg viewBox="0 0 280 160">
        <rect x="20" y="12" width="240" height="136" />
        <Label x="140" y="32">Task Manager</Label>
        <Label x="40" y="58" anchor="start">CPU</Label>
        <Label x="230" y="58" anchor="end">97%</Label>
        <Label x="40" y="80" anchor="start">Memory</Label>
        <Label x="230" y="80" anchor="end">42%</Label>
        <Label x="40" y="102" anchor="start">Disk</Label>
        <Label x="230" y="102" anchor="end">4%</Label>
        <Label x="40" y="124" anchor="start">Network</Label>
        <Label x="230" y="124" anchor="end">1%</Label>
      </Svg>
    </Paper>
  ),
  "boot-error": () => (
    <Paper caption="Figure 1 · The screen after the power button">
      <Svg viewBox="0 0 300 140">
        <rect x="16" y="16" width="268" height="108" />
        <Label x="36" y="48" anchor="start">No bootable device found</Label>
        <Label x="36" y="72" anchor="start">Insert boot media and press a key</Label>
        <Label x="36" y="100" anchor="start">_</Label>
      </Svg>
    </Paper>
  ),
  "router-lights": () => (
    <Paper caption="Figure 1 · Home router. A filled dot is on. An empty dot is off">
      <Svg viewBox="0 0 300 140">
        <rect x="40" y="36" width="220" height="56" rx="6" />
        <circle cx="70" cy="64" r="6" fill={ink} stroke="none" />
        <circle cx="118" cy="64" r="6" />
        <circle cx="166" cy="64" r="6" fill={ink} stroke="none" />
        <circle cx="214" cy="64" r="6" fill={ink} stroke="none" />
        <Label x="70" y="116">Power</Label>
        <Label x="118" y="116">WAN</Label>
        <Label x="166" y="116">LAN</Label>
        <Label x="214" y="116">Wi-Fi</Label>
      </Svg>
    </Paper>
  ),
  airflow: () => (
    <Paper caption="Figure 1 · Air through a case. Arrows show the intended direction">
      <Svg viewBox="0 0 280 150">
        <rect x="50" y="24" width="180" height="100" />
        <path d="M16 50 H50" />
        <polygon points="50,50 42,46 42,54" fill={ink} stroke="none" />
        <path d="M16 98 H50" />
        <polygon points="50,98 42,94 42,102" fill={ink} stroke="none" />
        <path d="M230 74 H264" />
        <polygon points="264,74 256,70 256,78" fill={ink} stroke="none" />
        <Label x="24" y="40">in</Label>
        <Label x="250" y="64">out</Label>
        <Label x="140" y="78">case</Label>
      </Svg>
    </Paper>
  ),
  "ram-notch": () => (
    <Paper caption="Figure 1 · A memory stick and its slot">
      <Svg viewBox="0 0 280 130">
        <rect x="30" y="28" width="150" height="28" />
        <rect x="92" y="28" width="8" height="10" fill="var(--color-surface, #fff)" />
        <rect x="40" y="78" width="170" height="18" />
        <rect x="102" y="78" width="8" height="10" />
        <Label x="105" y="20">notch</Label>
        <Label x="40" y="116" anchor="start">slot key must meet the notch</Label>
      </Svg>
    </Paper>
  ),
  "plugs-ab": () => (
    <Paper caption="Figure 1 · Two cables from the desk drawer">
      <Svg viewBox="0 0 280 130">
        <rect x="36" y="36" width="28" height="48" />
        <rect x="44" y="48" width="12" height="10" />
        <path d="M50 84 V108" />
        <Label x="50" y="24">A</Label>
        <rect x="160" y="40" width="56" height="36" />
        <path d="M168 48 H208" />
        <path d="M168 58 H208" />
        <path d="M168 68 H208" />
        <path d="M188 76 V108" />
        <Label x="188" y="24">B</Label>
      </Svg>
    </Paper>
  ),
};
