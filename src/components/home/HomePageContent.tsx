"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BatteryCharging,
  Check,
  ChevronDown,
  Cpu,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Plus,
  Minus,
  Snowflake,
  Sun,
  X,
  Zap,
  House,
} from "lucide-react";
import { SizerWizard } from "@/components/sizer/SizerWizard";
import { BRAND, telUrl, whatsappUrl } from "@/lib/constants";
import { useHomepageCopy } from "@/lib/useHomepageCopy";
import { benefits, costCopy, faqs, services } from "./homepageData";
import "./homepage.css";

const appliances = [
  { id: "lights", name: "Lights" },
  { id: "fans", name: "Fans" },
  { id: "fridge", name: "Refrigerator" },
  { id: "tv", name: "TV" },
];
const costIcons = [Cpu, BatteryCharging, Sun, Snowflake, House];
const chat = whatsappUrl(
  "Hello TorchVolt, I’d like to discuss solar installation for my home or business.",
);
function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="tv-eyebrow">
      {children}
      <span />
    </p>
  );
}
function Photo({
  file,
  alt,
  className = "",
  priority = false,
}: {
  file: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={`/images/${file.replace(".png", ".webp")}`}
      alt={alt}
      width={1200}
      height={800}
      className={className}
      preload={priority}
      sizes="(max-width: 700px) 100vw, 50vw"
    />
  );
}
function Wordmark() {
  return (
    <Link href="/" className="tv-wordmark" aria-label="TorchVolt home">
      <Zap fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
      TorchVolt
    </Link>
  );
}

export function HomePageContent() {
  const copy = useHomepageCopy();
  const [selected, setSelected] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  function openQuote() {
    lastTrigger.current = document.activeElement as HTMLElement;
    setMenuOpen(false);
    setQuoteOpen(true);
  }
  function closeQuote() {
    setQuoteOpen(false);
    lastTrigger.current?.focus();
  }
  useEffect(() => {
    if (!quoteOpen) return;
    const modal = dialog.current;
    const previousOverflow = document.body.style.overflow;
    modal?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      modal?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [quoteOpen]);
  useEffect(() => {
    function followQuoteAnchor() {
      if (window.location.hash === "#size") setQuoteOpen(true);
    }
    followQuoteAnchor();
    window.addEventListener("hashchange", followQuoteAnchor);
    return () => window.removeEventListener("hashchange", followQuoteAnchor);
  }, []);
  const quoteButton = (label = copy.hero.primaryCta, gold = false) => (
    <button
      type="button"
      className={`tv-button ${gold ? "tv-button-gold" : "tv-button-green"}`}
      onClick={openQuote}
    >
      {label}
      <ArrowRight size={19} aria-hidden="true" />
    </button>
  );
  const whatsapp = (
    <a className="tv-button tv-button-outline" href={chat}>
      <MessageCircle size={20} aria-hidden="true" />
      {copy.hero.secondaryCta}
    </a>
  );

  return (
    <div className="tv-home">
      <a className="tv-skip" href="#home-content">
        Skip to content
      </a>
      <header className="tv-header">
        <div className="tv-container tv-nav">
          <Wordmark />
          <nav aria-label="Main navigation" className="tv-desktop-nav">
            <a href="#solutions">
              Solutions
              <ChevronDown size={15} />
            </a>
            <a href="#how">{copy.header.howItWorks}</a>
            <a href="#faqs">FAQs</a>
          </nav>
          <div className="tv-nav-actions">
            <button
              className="tv-button tv-button-gold tv-nav-quote"
              onClick={openQuote}
            >
              {copy.header.cta}
            </button>
            <button
              className="tv-menu-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-controls="tv-mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="tv-mobile-nav"
            className="tv-mobile-nav"
            aria-label="Mobile navigation"
          >
            {[
              ["Solutions", "solutions"],
              ["How it works", "how"],
              ["FAQs", "faqs"],
            ].map(([label, id]) => (
              <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <Link href="/blog">Blog</Link>
          </nav>
        )}
      </header>
      <section
        className="tv-hero"
        id="home-content"
        aria-labelledby="hero-heading"
      >
        <Photo
          file="home-solar-evening.png"
          alt="Solar-powered home with warmly lit rooms at dusk"
          className="tv-hero-image"
          priority
        />
        <div className="tv-container tv-hero-content">
          <Eyebrow>{copy.hero.cities}</Eyebrow>
          <h1 id="hero-heading">
            {copy.hero.headline} <em>{copy.hero.headlineAccent}</em>
          </h1>
          <p className="tv-hero-lead">
            Let TorchVolt keep your
            <br />
            lights on.
          </p>
          <p className="tv-hero-body">{copy.hero.body}</p>
          <div className="tv-button-row">
            {quoteButton(undefined, true)}
            {whatsapp}
          </div>
          <p className="tv-reassurance">No guesswork. No obligation.</p>
        </div>
      </section>
      <section
        className="tv-section tv-appliances"
        aria-labelledby="appliance-heading"
      >
        <div className="tv-container">
          <Eyebrow>{copy.size.eyebrow}</Eyebrow>
          <h2 id="appliance-heading">{copy.size.heading}</h2>
          <p className="tv-section-intro">{copy.size.body}</p>
          <div className="tv-appliance-grid">
            {appliances.map(({ id, name }) => (
              <button
                key={id}
                type="button"
                className={`tv-appliance ${selected.includes(id) ? "is-selected" : ""}`}
                aria-pressed={selected.includes(id)}
                onClick={() =>
                  setSelected((previous) =>
                    previous.includes(id)
                      ? previous.filter((value) => value !== id)
                      : [...previous, id],
                  )
                }
              >
                <span className="tv-checkbox">
                  {selected.includes(id) && <Check size={16} />}
                </span>
                <Image
                  src={`/images/appliance-${id}.webp`}
                  alt=""
                  width={160}
                  height={160}
                  className="tv-appliance-product"
                  sizes="160px"
                />
                <span>{name}</span>
              </button>
            ))}
          </div>
          <div className="tv-centered">
            {quoteButton("Find my system")}
            <p>A system built around what you actually power.</p>
          </div>
        </div>
      </section>
      <section className="tv-section tv-process" id="how">
        <div className="tv-container">
          <Eyebrow>{copy.how.eyebrow}</Eyebrow>
          <h2>{copy.how.heading}</h2>
          <p className="tv-section-intro">
            Get a solar solution tailored to your home or business in Ibadan.
          </p>
          <div className="tv-process-grid">
            {[
              {
                title: "Choose appliances.",
                body: "Pick the appliances you want to keep running.",
                image: "process-appliances.png",
                alt: "A homeowner choosing appliances on a phone",
              },
              {
                title: "Tell us your needs.",
                body: "Let us know how you want to use the system, from essential backup to a larger setup.",
                image: "process-needs.png",
                alt: "A notebook listing backup electricity needs",
              },
              {
                title: "Get a recommendation and free quote.",
                body: "We’ll size a suitable system for your needs and follow up with pricing.",
                image: "solar-consultation.png",
                alt: "A solar consultation with a homeowner",
              },
            ].map((step, i) => (
              <article key={step.title}>
                <div className="tv-process-photo">
                  <Photo file={step.image} alt={step.alt} />
                  <span>0{i + 1}</span>
                </div>
                <h3>{copy.how.steps[i].title}</h3>
                <span className="tv-short-rule" />
                <p>{copy.how.steps[i].body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="tv-section tv-services" id="solutions">
        <div className="tv-container">
          <Eyebrow>Solar solutions</Eyebrow>
          <h2>
            Solar solutions for your
            <br />
            <em>home and business.</em>
          </h2>
          <p className="tv-section-intro">
            From essential backup to a complete solar setup, we’ll help you find
            the right fit.
          </p>
          <div className="tv-services-grid">
            {services.map(([title, body, file, alt]) => (
              <article key={title}>
                <Photo file={file} alt={alt} />
                <span className="tv-short-rule" />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <div className="tv-centered">
            {quoteButton("Request a solar consultation")}
          </div>
        </div>
      </section>
      <section className="tv-section tv-benefits">
        <div className="tv-container">
          <Eyebrow>Why TorchVolt</Eyebrow>
          <h2>Your needs first. The right system next.</h2>
          <p className="tv-section-intro">
            Clear advice, practical options and a solar setup designed around
            your everyday.
          </p>
          <div className="tv-benefits-grid">
            <Photo
              file="solar-consultation.png"
              alt="A solar consultant discussing an appliance list with a homeowner"
            />
            <div>
              <ol>
                {benefits.map(([title, body], index) => (
                  <li key={title}>
                    <span className="tv-benefit-number">0{index + 1}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {quoteButton()}
              <p className="tv-reassurance">No guesswork. No obligation.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="tv-section tv-cost" id="cost">
        <div className="tv-container">
          <div className="tv-cost-grid">
            <div>
              <Eyebrow>Understanding the cost</Eyebrow>
              <h2>
                What will your
                <br />
                solar system <em>cost?</em>
              </h2>
              <p className="tv-section-intro">
                It depends on what you want to power, how long you need backup
                and the equipment your property requires.
              </p>
              {quoteButton("Calculate my solar requirements", true)}
              <p className="tv-cost-note">
                Get a recommendation first. Receive pricing after we understand
                your needs.
              </p>
              <Photo
                file="solar-equipment.png"
                alt="Solar panels, inverter and battery equipment"
                className="tv-cost-photo"
              />
            </div>
            <div className="tv-cost-factors">
              {costCopy.map(([title, body], index) => {
                const Icon = costIcons[index];
                return (
                  <div key={title}>
                    <Icon strokeWidth={1.5} aria-hidden="true" />
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="tv-cost-takeaway">
            <span className="tv-short-rule" />
            Your appliance list is a better starting point than a random package
            price.
          </p>
        </div>
      </section>
      <section className="tv-coverage">
        <div className="tv-container tv-coverage-grid">
          <div>
            <Eyebrow>Local solar support</Eyebrow>
            <h2>
              Solar installation
              <br />
              across Ibadan.
            </h2>
            <p className="tv-section-intro">
              From homes to growing businesses, tell us where you are and we’ll
              confirm installation availability.
            </p>
            <ul className="tv-areas">
              {[
                "Bodija",
                "Challenge",
                "Apata",
                "Akobo",
                "Ring Road",
                "Eleyele",
                "Oluyole",
                "Jericho",
                "Other parts of Ibadan",
              ].map((area) => (
                <li key={area}>{area}</li>
              ))}
            </ul>
            <a className="tv-button tv-button-green" href={chat}>
              Speak with TorchVolt
              <ArrowRight size={19} />
            </a>
            <p className="tv-coverage-note">
              We also welcome solar enquiries from Lagos and Abuja.
            </p>
            <p className="tv-location">
              <MapPin size={20} />
              Ibadan, Oyo State, Nigeria
            </p>
          </div>
          <Photo
            file="ibadan-coverage.png"
            alt="Aerial view of a leafy neighbourhood with solar-equipped homes"
          />
        </div>
      </section>
      <section className="tv-section tv-faq" id="faqs">
        <div className="tv-container tv-faq-grid">
          <div>
            <Eyebrow>Your questions, answered</Eyebrow>
            <h2>
              A little clarity
              <br />
              before you
              <br />
              go solar.
            </h2>
            <p className="tv-section-intro">
              Straightforward answers to common questions about solar
              installation in Ibadan.
            </p>
            <div className="tv-faq-contact">
              <p>Still have a question?</p>
              <a href={chat}>
                <MessageCircle size={23} />
                Chat with TorchVolt
              </a>
            </div>
          </div>
          <div>
            {faqs.map(([question, answer], i) => (
              <div key={question} className="tv-faq-item">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-answer-${i}`}
                  >
                    {question}
                    <span
                      className={openFaq === i ? "is-open" : ""}
                      aria-hidden="true"
                    >
                      {openFaq === i ? <Minus size={24} /> : <Plus size={24} />}
                    </span>
                  </button>
                </h3>
                <div id={`faq-answer-${i}`} hidden={openFaq !== i}>
                  <p>{answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="tv-final">
        <Photo
          file="home-solar-evening.png"
          alt="A warmly lit solar-powered home in the evening"
          className="tv-hero-image"
        />
        <div className="tv-container tv-final-content">
          <Eyebrow>Let’s keep your lights on</Eyebrow>
          <h2>
            Ready to stop
            <br />
            worrying about
            <br />
            <em>electricity?</em>
          </h2>
          <p>
            Tell us what you want to power.
            <br />
            We’ll help you figure out what you need.
          </p>
          <div className="tv-button-row">
            {quoteButton(undefined, true)}
            {whatsapp}
          </div>
          <p className="tv-reassurance">No guesswork. No obligation.</p>
        </div>
      </section>
      <footer className="tv-footer">
        <div className="tv-container">
          <div className="tv-footer-grid">
            <div>
              <Wordmark />
              <p>
                Solar power solutions for homes
                <br />
                and businesses in Ibadan, Nigeria.
              </p>
            </div>
            <div>
              <span className="tv-short-rule" />
              <h3>Explore</h3>
              <a href="#solutions">Solutions</a>
              <a href="#how">How it works</a>
              <a href="#faqs">FAQs</a>
              <Link href="/blog">Blog</Link>
            </div>
            <div>
              <span className="tv-short-rule" />
              <h3>Let’s talk</h3>
              <a href={chat}>Call or WhatsApp</a>
              <a href={telUrl()} className="tv-footer-phone">
                {BRAND.phoneDisplay}
              </a>
              <p>Ibadan, Oyo State</p>
            </div>
          </div>
          <div className="tv-footer-bottom">
            <p>© {new Date().getFullYear()} TorchVolt. All rights reserved.</p>
            <Link href="/admin">Admin</Link>
          </div>
        </div>
      </footer>
      {quoteOpen && (
        <dialog
          ref={dialog}
          className="tv-quote-dialog"
          aria-labelledby="quote-dialog-title"
          onCancel={closeQuote}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeQuote();
          }}
        >
          <div className="tv-dialog-heading">
            <div>
              <span className="tv-eyebrow">Your free solar quote</span>
              <h2 id="quote-dialog-title">Let’s find your fit.</h2>
            </div>
            <button
              type="button"
              onClick={closeQuote}
              className="tv-dialog-close"
              aria-label="Close quote tool"
              autoFocus
            >
              <X />
            </button>
          </div>
          <SizerWizard embedded initialAppliances={selected} />
          <p className="tv-dialog-help">
            <Phone size={14} />
            Prefer to talk? <a href={telUrl()}>{BRAND.phoneDisplay}</a>
          </p>
        </dialog>
      )}
    </div>
  );
}
