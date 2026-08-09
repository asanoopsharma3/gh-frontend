import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import "./Terms.css";

const TERMS_SECTIONS = [
  {
    icon: "🎮",
    title: "1. Eligibility",
    paragraphs: [
      "Participation in GHSuperWinnings.com is open to users who are legally eligible to subscribe and participate under the laws and regulations of their country. By using the service, you confirm that you meet all applicable eligibility requirements.",
    ],
  },
  {
    icon: "📱",
    title: "2. Subscription Service",
    paragraphs: [
      "GHSuperWinnings.com is a subscription-based entertainment and quiz platform.",
    ],
    bullets: [
      "Subscription plans may include Daily, Weekly, or Monthly options.",
      "Applicable subscription fees will be charged through your mobile operator or approved payment method.",
      "Subscription renewals may occur automatically until cancelled by the user.",
      "Users may unsubscribe at any time through the available unsubscribe mechanisms.",
    ],
  },
  {
    icon: "✨",
    title: "3. Service Description",
    paragraphs: [
      "Subscribers gain access to quizzes, challenges, games, leaderboards, rewards programs, and other promotional activities available on GHSuperWinnings.com.",
    ],
  },
  {
    icon: "🎯",
    title: "4. Gameplay & Points",
    bullets: [
      "Users can participate in quizzes and challenges to earn points.",
      "Points are awarded based on successful participation and correct answers.",
      "The number of points awarded for each activity may vary.",
      "GHSuperWinnings.com reserves the right to modify point allocation mechanisms at any time.",
    ],
  },
  {
    icon: "🏆",
    title: "5. Leaderboard",
    bullets: [
      "Users are ranked on leaderboards based on accumulated points.",
      "Leaderboards may be Daily, Weekly, Monthly, or Promotional.",
      "Rankings are updated automatically based on platform activity.",
      "In the event of a tie, GHSuperWinnings.com may apply additional criteria to determine rankings.",
    ],
  },
  {
    icon: "🎁",
    title: "6. Rewards & Prizes",
    bullets: [
      "Eligible users may receive rewards, prizes, airtime, cash prizes, vouchers, devices, or other promotional benefits.",
      "Reward types, quantities, and eligibility requirements may vary by promotion.",
      "Rewards are subject to verification and compliance with these Terms & Conditions.",
      "Rewards are non-transferable and cannot be exchanged unless expressly stated.",
    ],
  },
  {
    icon: "👑",
    title: "7. Winner Selection",
    bullets: [
      "Winners are selected based on leaderboard rankings, accumulated points, promotional mechanics, or random draws where applicable.",
      "All winner selections are final once verified by GHSuperWinnings.com.",
      "The platform reserves the right to request identity verification before prize distribution.",
    ],
  },
  {
    icon: "⚖️",
    title: "8. Fair Usage Policy",
    paragraphs: ["Users must not:"],
    bullets: [
      "Use bots, scripts, or automated tools.",
      "Manipulate scores, rankings, or reward mechanisms.",
      "Create multiple accounts for unfair advantage.",
      "Engage in fraudulent, abusive, or unlawful activities.",
    ],
    footer:
      "Violations may result in account suspension, disqualification, forfeiture of rewards, or permanent termination of access.",
  },
  {
    icon: "👤",
    title: "9. User Responsibilities",
    paragraphs: [
      "Users are responsible for ensuring that the mobile number and information provided are accurate and up to date. GHSuperWinnings.com is not responsible for rewards that cannot be delivered due to incorrect user information.",
    ],
  },
  {
    icon: "🧾",
    title: "10. Prize Claims",
    bullets: [
      "Prize claims may require identity verification.",
      "Failure to provide requested information within the specified timeframe may result in forfeiture of the prize.",
      "Fraudulent claims will be rejected.",
    ],
  },
  {
    icon: "🔒",
    title: "11. Privacy & Data Protection",
    paragraphs: [
      "By using the service, you consent to the collection and processing of your mobile number and related information for:",
    ],
    bullets: [
      "Service delivery",
      "Subscription management",
      "Reward fulfillment",
      "Customer support",
      "Service improvement",
    ],
    footer:
      "Personal information will be handled in accordance with applicable data protection laws.",
  },
  {
    icon: "🌐",
    title: "12. Service Availability",
    paragraphs: [
      "While we strive to provide uninterrupted access, GHSuperWinnings.com does not guarantee continuous availability. Service interruptions may occur due to maintenance, network issues, technical failures, or circumstances beyond our control.",
    ],
  },
  {
    icon: "🛡️",
    title: "13. Limitation of Liability",
    paragraphs: [
      "GHSuperWinnings.com, its partners, affiliates, and mobile operators shall not be liable for any indirect, incidental, consequential, or special damages arising from the use of the service.",
    ],
  },
  {
    icon: "📝",
    title: "14. Modification of Terms",
    paragraphs: [
      "GHSuperWinnings.com reserves the right to amend these Terms & Conditions at any time. Continued use of the service following such changes constitutes acceptance of the updated Terms.",
    ],
  },
  {
    icon: "💬",
    title: "15. Contact Support",
    paragraphs: [
      "For assistance, inquiries, subscription support, or prize-related questions, please contact the official GHSuperWinnings.com customer support channels available on the website.",
    ],
  },
];

export default function Terms() {
  return (
    <section className="terms-page">
      <div className="terms-overlay" aria-hidden="true" />
      <div className="terms-glow-top" aria-hidden="true" />
      <div className="terms-glow-bottom" aria-hidden="true" />

      <div className="terms-header">
        <Link to="/" className="terms-back-btn">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
        <h1>Terms &amp; Conditions</h1>
        <p>
          Welcome to <strong>GHSuperWinnings.com</strong>. By accessing or using the
          service, you agree to be bound by these Terms &amp; Conditions.
        </p>
      </div>

      <div className="terms-card">
        <div className="terms-card-inner">
          <span className="terms-badge">
            <FileText size={14} />
            Legal Information
          </span>

          <div className="terms-content">
            {TERMS_SECTIONS.map((section) => (
              <article key={section.title} className="terms-section">
                <h2>
                  <span className="terms-section-icon" aria-hidden="true">
                    {section.icon}
                  </span>
                  {section.title}
                </h2>

                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                {section.bullets && (
                  <ul>
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}

                {section.footer && <p>{section.footer}</p>}
              </article>
            ))}
          </div>
        </div>
      </div>

      <footer className="terms-footer">
        © 2026 GHSuperWinnings.com. All Rights Reserved.
      </footer>
    </section>
  );
}
