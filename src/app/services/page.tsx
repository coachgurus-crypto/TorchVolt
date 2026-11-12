import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BatteryCharging, Building2, ChevronDown, Layers, MessageCircle, Phone, Settings, SlidersHorizontal, Sun, Wallet, Wrench, Zap } from "lucide-react";
import { BRAND, telUrl, whatsappUrl } from "@/lib/constants";
import { MobileServicesNav, ServiceGuide } from "./service-guide";
import "./services.css";

export const metadata: Metadata = {
  title: "Solar Installation Services in Ibadan, Nigeria",
  description: "Explore residential and commercial solar, panels, inverters, batteries, maintenance and system upgrades in Ibadan. Request a free quote from TorchVolt.",
  alternates: { canonical: "/services" },
};

const chat = whatsappUrl("Hello TorchVolt, I’d like to discuss a solar project.");
const navigation = [["Home", "/"], ["Services", "/services"], ["Shop", "/shop"], ["How it works", "#installation-process"], ["FAQs", "#service-faqs"]] as const;
const sizing = [
  ["Select your appliances", "Tell us what you want to keep running."],
  ["Choose your backup requirements", "Tell us how long you need power during outages."],
  ["Get a solar recommendation", "See a suggested setup based on your needs."],
];
const benefits = [
  [SlidersHorizontal, "Sized around your needs", "We assess your actual appliances and power use before recommending a system."],
  [Wallet, "Recommendations that fit your budget", "Prioritize the essentials or plan a larger setup."],
  [Layers, "A clear explanation of your package", "Know what’s included, what it can power and what to expect."],
  [Wrench, "Installation planning and testing", "We consider your property’s requirements and test the installed system."],
  [Building2, "For homes and businesses", "From small apartments to family homes, shops and offices."],
] as const;
const costs = [
  [Sun, "Solar panel capacity", "The wattage and number of panels your system needs."],
  [Zap, "Inverter size", "The power needed to run your appliances, including startup demand."],
  [BatteryCharging, "Battery storage", "How much stored energy you need for backup."],
  [Settings, "Equipment specifications", "The brand, quality and compatibility of the components."],
  [Wrench, "Installation complexity", "Roof conditions, mounting, wiring distances and existing infrastructure."],
] as const;
const process = [
  ["Initial consultation", "Tell us about your property, appliances and power challenges."],
  ["Power assessment", "We estimate demand and backup needs, and assess the site where necessary."],
  ["Recommendation and quote", "We suggest a suitable combination of panels, inverter and batteries, with a quote."],
  ["Installation and configuration", "Once approved, we install and configure the system and carry out safety checks."],
  ["Testing and handover", "We test the system and explain how to use and maintain it."],
];
const areas = ["Bodija", "Akobo", "Challenge", "Ring Road", "Oluyole", "Jericho", "Eleyele", "Apata", "Moniya", "Iwo Road", "Mokola", "Bashorun", "New Garage", "Akala Express"];
const faqs = [
  ["What solar installation services do you offer?", "We offer residential and commercial installations, solar panels, inverters, battery storage and system upgrades. Contact us to confirm maintenance and repair availability."],
  ["How much does it cost to install solar in Ibadan?", "Your quote depends on your electricity needs, inverter capacity, solar panels, battery storage and installation requirements. Request a free quote based on what you want to power."],
  ["Can you install solar panels on an existing inverter?", "In some cases. The inverter must support solar input directly or work with compatible charging equipment. We can assess your current setup first."],
  ["Can solar power run an air conditioner?", "Yes, when the system is sized with enough inverter capacity, solar generation and battery storage for the air conditioner’s operating and startup needs."],
  ["Do I need batteries if I’m installing solar panels?", "Not always. Some grid-connected systems work without batteries. If you want power at night or during grid outages, storage is often part of the solution."],
  ["How long does solar installation take?", "Timing varies with system size, property type, site complexity and equipment availability. A small residential setup may take less time than a larger commercial project."],
  ["Can I start small and upgrade later?", "Yes, if your setup is designed for expansion. Check inverter capacity, battery compatibility and panel configuration before choosing equipment."],
  ["Do you install outside Ibadan?", "Contact us to confirm availability for your location. We also welcome enquiries from Lagos and Abuja."],
];

function Quote({ children = "Get a free solar quote", green = false }: { children?: string; green?: boolean }) {
  return <Link className={`svc-button ${green ? "svc-green" : "svc-gold"}`} href="/size">{children}<ArrowRight size={18} aria-hidden="true" /></Link>;
}

function WhatsApp() {
  return <a className="svc-button svc-outline" href={chat}><MessageCircle size={18} aria-hidden="true" />Chat on WhatsApp</a>;
}

function Wordmark() {
  return <Link className="svc-wordmark" href="/"><Zap size={28} fill="currentColor" aria-hidden="true" />TorchVolt</Link>;
}

export default function ServicesPage() {
  return (
    <div className="svc-page">
      <a className="svc-skip" href="#services-content">Skip to content</a>
      <header className="svc-header">
        <div className="svc-wrap svc-nav">
          <Wordmark />
          <nav aria-label="Main navigation">{navigation.map(([label, href]) => <Link key={href} href={href} aria-current={href === "/services" ? "page" : undefined}>{label}</Link>)}</nav>
          <div className="svc-nav-quote"><Quote>Get a free quote</Quote></div>
          <MobileServicesNav links={navigation} />
        </div>
      </header>

      <section className="svc-wrap svc-split svc-hero" id="services-content">
        <div>
          <p className="svc-kicker">Our services</p>
          <h1>Solar installation services in Ibadan, Nigeria</h1>
          <p className="svc-lead">Reliable solar power for homes and businesses.</p>
          <p>From essential backup to a complete solar system, we’ll help you find a setup that fits what you power and your budget.</p>
          <div className="svc-actions"><Quote /><WhatsApp /></div>
        </div>
        <Image className="svc-photo svc-hero-photo" src="/images/services-installer.webp" alt="Solar installer working on a rooftop panel in Ibadan" width={1200} height={1050} preload />
      </section>

      <section className="svc-section svc-mint" id="service-guide">
        <div className="svc-wrap">
          <p className="svc-kicker">The service guide</p>
          <h2>Explore our solar services</h2>
          <p>Find the right service for what you want to power, how long you need backup and what you plan to spend.</p>
          <ServiceGuide />
          <p className="svc-guide-note">Not sure where to start? <Link href="/size">Use the solar calculator</Link></p>
        </div>
      </section>

      <section className="svc-section svc-mint svc-sizing" id="solar-calculator">
        <div className="svc-wrap svc-split">
          <div>
            <p className="svc-kicker">Find your right system</p>
            <h2>Not sure which solar system you need?</h2>
            <p>Use our sizing tool to estimate the power and backup your setup needs.</p>
            <ol className="svc-sizing-steps">{sizing.map(([title, body], index) => <li key={title}><span>{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol>
            <Quote green>Calculate my solar system size</Quote>
          </div>
          <Image className="svc-photo" src="/images/process-appliances.webp" alt="Homeowner using a phone to plan appliance needs" width={1200} height={800} />
        </div>
      </section>

      <section className="svc-section">
        <div className="svc-wrap svc-split">
          <div>
            <p className="svc-kicker">Our difference</p>
            <h2>Why choose TorchVolt?</h2>
            <Image className="svc-photo svc-benefit-photo" src="/images/residential-solar.webp" alt="Home with rooftop solar panels" width={1200} height={800} />
            <a className="svc-text-link" href={chat}>Speak with TorchVolt about your project <ArrowRight size={18} aria-hidden="true" /></a>
          </div>
          <ul className="svc-feature-list">{benefits.map(([Icon, title, body]) => <li key={title}><Icon aria-hidden="true" /><div><h3>{title}</h3><p>{body}</p></div></li>)}</ul>
        </div>
      </section>

      <section className="svc-section svc-dark" id="service-pricing">
        <div className="svc-wrap svc-split svc-cost">
          <div><p className="svc-kicker">Quote factors</p><h2>What affects the cost of solar installation?</h2><p>Your quote depends on what you want to power, how much backup you need and the installation work at your property.</p><div className="svc-actions"><Quote /></div></div>
          <ul className="svc-feature-list">{costs.map(([Icon, title, body]) => <li key={title}><Icon aria-hidden="true" /><div><h3>{title}</h3><p>{body}</p></div></li>)}</ul>
        </div>
      </section>

      <section className="svc-section svc-mint" id="installation-process">
        <div className="svc-wrap">
          <p className="svc-kicker">The installation process</p><h2>From consultation to handover</h2>
          <ol className="svc-timeline">{process.map(([title, body], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{body}</p></li>)}</ol>
          <div className="svc-actions svc-center"><Quote green>Start my solar installation</Quote></div>
        </div>
      </section>

      <section className="svc-section" id="service-coverage">
        <div className="svc-wrap svc-split">
          <div>
            <p className="svc-kicker">Coverage</p><h2>Solar installation across Ibadan</h2>
            <p>We welcome home and business enquiries across Ibadan, Oyo State.</p>
            <ul className="svc-checks svc-areas">{areas.map((area) => <li key={area}>{area}</li>)}</ul>
            <p>Ask us about availability in unlisted areas, Lagos and Abuja.</p>
            <div className="svc-actions"><a className="svc-button svc-green" href={whatsappUrl("Hello TorchVolt, can you confirm solar installation availability in my area?")}>Check installation availability <ArrowRight size={18} aria-hidden="true" /></a></div>
          </div>
          <Image className="svc-photo" src="/images/ibadan-coverage.webp" alt="Aerial view of a leafy residential area in Ibadan" width={1000} height={1000} />
        </div>
      </section>

      <section className="svc-section svc-faq" id="service-faqs">
        <div className="svc-wrap svc-split">
          <div><p className="svc-kicker">FAQ</p><h2>Frequently asked questions</h2><p>Quick answers to common questions about our solar services.</p></div>
          <div className="svc-accordion">{faqs.map(([question, answer], index) => <details key={question} name="services-faq" open={index === 2}><summary>{question}<ChevronDown size={18} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div>
        </div>
      </section>

      <footer className="svc-dark svc-footer">
        <div className="svc-wrap">
          <div className="svc-split">
            <div><p className="svc-kicker">Let’s talk solar</p><h2>Ready to install solar?</h2><p>Tell us what you want to power. We’ll help you find the right system.</p></div>
            <div><div className="svc-actions"><Quote /><WhatsApp /></div><a className="svc-phone" href={telUrl()}><Phone size={18} aria-hidden="true" />{BRAND.phoneDisplay}</a></div>
          </div>
          <div className="svc-footer-bottom"><Wordmark /><span>Solar solutions for homes and businesses in Ibadan.</span><Link href="/blog">Blog</Link></div>
        </div>
      </footer>
    </div>
  );
}
