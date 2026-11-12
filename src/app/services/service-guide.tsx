"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import { whatsappUrl } from "@/lib/constants";

const services = [
  {
    id: "residential", label: "Residential solar", title: "Residential solar installation",
    image: "residential-solar.webp", alt: "Solar panels on a home roof",
    description: "Keep the essentials running when grid power is unreliable. We size your panels, inverter and batteries around the appliances you use, whether you live in a flat or a large duplex.",
    items: ["Lights, fans, refrigerators and freezers", "Televisions, laptops and Wi-Fi routers", "Washing machines, air conditioners and water pumps when the system is sized for them"],
    action: "Get a quote for my home",
  },
  {
    id: "commercial", label: "Commercial solar", title: "Commercial solar installation",
    image: "commercial-solar.webp", alt: "Solar panels installed on a commercial property",
    description: "Reduce interruptions and reliance on generators. We assess your equipment, peak demand and operating hours to plan backup or offset daytime consumption.",
    items: ["Offices, retail stores and supermarkets", "Restaurants, hotels, salons and barbershops", "Schools, clinics and small manufacturers"],
    action: "Request a commercial solar quote",
  },
  {
    id: "panels", label: "Solar panels", title: "Solar panel installation",
    image: "solar-upgrade.webp", alt: "Technician inspecting rooftop solar panels",
    description: "We recommend a panel configuration based on your energy use, available roof space, shading and equipment compatibility.",
    items: ["Energy assessment and panel capacity recommendations", "Site evaluation, mounting and positioning", "Electrical connections, testing and commissioning"],
    action: "Get a solar panel installation quote",
  },
  {
    id: "inverters", label: "Inverters", title: "Inverter installation",
    image: "inverter-battery.webp", alt: "Wall-mounted inverter and battery equipment",
    description: "Get backup when grid power goes out. We size your inverter for the appliances you want to run, including equipment that needs extra power on startup.",
    items: ["Inverter capacity assessment and hybrid inverter installation", "Battery integration and automatic changeover where supported", "Electrical protection, configuration and testing"],
    action: "Request an inverter installation quote",
  },
  {
    id: "batteries", label: "Battery storage", title: "Solar battery installation and upgrades",
    image: "inverter-battery.webp", alt: "Installed battery storage beside an inverter",
    description: "Store power for use at night or during outages. We assess your daily use and backup needs before recommending new or upgraded storage.",
    items: ["Battery capacity assessment and lithium battery installation", "Compatible upgrades and inverter integration", "Battery performance checks"],
    action: "Get a solar battery quote",
  },
  {
    id: "maintenance", label: "Maintenance & repairs", title: "Solar system maintenance and repairs",
    image: "solar-upgrade.webp", alt: "Technician checking a rooftop solar system",
    description: "If your inverter trips, batteries drain too quickly or panels underperform, tell us what you’re seeing and we’ll confirm inspection availability.",
    items: ["Panel inspection and cleaning", "Inverter, battery and connection checks", "Fault diagnosis, troubleshooting and performance checks"],
    action: "Request solar system maintenance",
    enquiry: "Hello TorchVolt, I’d like to ask about maintenance or repairs for my solar system.",
  },
  {
    id: "upgrades", label: "System upgrades", title: "Solar system upgrades and expansion",
    image: "solar-equipment.webp", alt: "Solar panel, inverter and battery equipment",
    description: "You may be able to support more appliances without replacing your whole system. We assess compatibility, electrical capacity and safety before recommending changes.",
    items: ["Add solar panels or battery storage", "Upgrade your inverter", "Improve energy management and support additional appliances"],
    action: "Upgrade my solar system",
    enquiry: "Hello TorchVolt, I’d like help assessing an upgrade to my existing solar system.",
  },
] as const;

export function MobileServicesNav({ links }: { links: readonly (readonly [string, string])[] }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const close = () => { if (menu.current) menu.current.open = false; };
  return (
    <details className="svc-mobile-nav" ref={menu}>
      <summary aria-label="Navigation menu"><Menu size={24} aria-hidden="true" /></summary>
      <nav aria-label="Mobile navigation">
        {links.map(([label, href]) => <Link key={href} href={href} onClick={close} aria-current={href === "/services" ? "page" : undefined}>{label}</Link>)}
        <Link href="/size" onClick={close}>Get a free quote</Link>
      </nav>
    </details>
  );
}

export function ServiceGuide() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = services.length - 1;
    const next = event.key === "Home" ? 0 : event.key === "End" ? last
      : event.key === "ArrowDown" ? (index + 1) % services.length
      : event.key === "ArrowUp" ? (index + last) % services.length : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className="svc-guide">
      <div className="svc-tabs" role="tablist" aria-label="Solar services" aria-orientation="vertical">
        {services.map((service, index) => (
          <button
            key={service.id}
            ref={(element) => { tabs.current[index] = element; }}
            type="button"
            id={`service-tab-${service.id}`}
            role="tab"
            aria-selected={index === active}
            aria-controls={`service-panel-${service.id}`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => move(event, index)}
          >
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            {service.label}
          </button>
        ))}
      </div>
      {services.map((service, index) => (
        <section
          key={service.id}
          id={`service-panel-${service.id}`}
          role="tabpanel"
          aria-labelledby={`service-tab-${service.id}`}
          hidden={index !== active}
          className="svc-panel"
          tabIndex={0}
        >
          <h3>{service.title}</h3>
          <Image className="svc-panel-image" src={`/images/${service.image}`} alt={service.alt} width={800} height={300} />
          <p>{service.description}</p>
          <ul className="svc-checks">{service.items.map((item) => <li key={item}>{item}</li>)}</ul>
          {"enquiry" in service ? (
            <a className="svc-button svc-green" href={whatsappUrl(service.enquiry)}>{service.action}<ArrowRight size={18} aria-hidden="true" /></a>
          ) : (
            <Link className="svc-button svc-green" href="/size">{service.action}<ArrowRight size={18} aria-hidden="true" /></Link>
          )}
        </section>
      ))}
    </div>
  );
}
