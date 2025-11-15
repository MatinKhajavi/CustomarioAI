import { useState } from "react";
import "./MockWebsite.css";

interface MockWebsiteProps {
  onFeedbackStart: () => void;
}

function MockWebsite({ onFeedbackStart }: MockWebsiteProps) {
  const [activeTab, setActiveTab] = useState("features");
  const [email, setEmail] = useState("");

  return (
    <div className="mock-website">
      <header className="website-header">
        <div className="header-content">
          <h1 className="logo">TechFlow</h1>
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
            <button className="cta-button">Get Started</button>
          </nav>
        </div>
      </header>

      <main className="website-main">
        <section className="hero-section">
          <h2>Streamline Your Workflow</h2>
          <p>
            The all-in-one platform for managing your projects, teams, and
            productivity.
          </p>
          <div className="hero-actions">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="email-input"
            />
            <button className="primary-button">Start Free Trial</button>
          </div>
        </section>

        <section className="tabs-section">
          <div className="tabs">
            <button
              className={activeTab === "features" ? "tab active" : "tab"}
              onClick={() => setActiveTab("features")}
            >
              Features
            </button>
            <button
              className={activeTab === "pricing" ? "tab active" : "tab"}
              onClick={() => setActiveTab("pricing")}
            >
              Pricing
            </button>
            <button
              className={activeTab === "integrations" ? "tab active" : "tab"}
              onClick={() => setActiveTab("integrations")}
            >
              Integrations
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "features" && (
              <div className="content-card">
                <h3>Powerful Features</h3>
                <ul>
                  <li>Real-time collaboration</li>
                  <li>Advanced analytics</li>
                  <li>Custom workflows</li>
                  <li>Team management</li>
                </ul>
              </div>
            )}
            {activeTab === "pricing" && (
              <div className="content-card">
                <h3>Flexible Pricing</h3>
                <div className="pricing-grid">
                  <div className="pricing-card">
                    <h4>Starter</h4>
                    <p className="price">$9/month</p>
                    <ul>
                      <li>5 projects</li>
                      <li>10 team members</li>
                    </ul>
                  </div>
                  <div className="pricing-card">
                    <h4>Professional</h4>
                    <p className="price">$29/month</p>
                    <ul>
                      <li>Unlimited projects</li>
                      <li>50 team members</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "integrations" && (
              <div className="content-card">
                <h3>Integrations</h3>
                <p>Connect with your favorite tools:</p>
                <div className="integration-badges">
                  <span className="badge">Slack</span>
                  <span className="badge">GitHub</span>
                  <span className="badge">Jira</span>
                  <span className="badge">Notion</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="cta-section">
          <h2>Ready to get started?</h2>
          <button className="primary-button" onClick={onFeedbackStart}>
            Join Now
          </button>
        </section>
      </main>

      <footer className="website-footer">
        <p>&copy; 2024 TechFlow. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default MockWebsite;
