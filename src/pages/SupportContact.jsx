import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Facebook,
  Headphones,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import "./SupportContact.css";

const XIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const SUPPORT_CONTACTS = [
  {
    id: "dial",
    label: "Dial",
    value: "100",
    href: "tel:100",
    icon: Phone,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    value: "0554300000",
    href: "https://wa.me/233554300000",
    icon: MessageCircle,
  },
  {
    id: "email",
    label: "Email",
    value: "customercare.GH@mtn.com",
    href: "mailto:customercare.GH@mtn.com",
    icon: Mail,
  },
  {
    id: "facebook",
    label: "Facebook",
    value: "MTNGhana",
    href: "https://web.facebook.com/MTNGhana/",
    icon: Facebook,
  },
  {
    id: "twitter",
    label: "Twitter / X",
    links: [
      { label: "@MTNGhana", href: "https://x.com/MTNGhana/" },
      { label: "@AskMTNGhana", href: "https://x.com/AskMTNGhana/" },
    ],
    icon: XIcon,
  },
];

export default function SupportContact() {
  return (
    <section className="support-contact-page">
      <div className="support-contact-overlay" aria-hidden="true" />
      <div className="support-contact-glow-top" aria-hidden="true" />
      <div className="support-contact-glow-bottom" aria-hidden="true" />

      <div className="support-contact-header">
        <Link to="/" className="support-back-btn">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
        <h1>SUPERWINNINGS SUPPORT</h1>
        <p>
          Need help with your subscription or quiz? Reach MTN Ghana support using
          any of the official contact options below.
        </p>
      </div>

      <div className="support-contact-card">
        <div className="support-contact-card-inner">
          <span className="support-contact-badge">
            <Headphones size={14} />
            MTN Support Contact
          </span>

          <ul className="support-contact-list">
            {SUPPORT_CONTACTS.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.id} className="support-contact-item">
                  <span className="support-contact-icon">
                    <Icon size={18} />
                  </span>

                  <div className="support-contact-content">
                    <span className="support-contact-label">{item.label}</span>

                    {item.links ? (
                      <div className="support-contact-links">
                        {item.links.map((link) => (
                          <a
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <a
                        className="support-contact-value"
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        {item.value}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
