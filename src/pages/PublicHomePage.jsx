import React, { useEffect, useRef, useState } from "react";
import {
  Archive,
  TrendingUp,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Headphones,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Check,
  Sun,
  Moon,
  Globe,
  Lock
} from "lucide-react";
import { DEFAULT_SITE_CONTENT } from "../lib/constants";
import "./landing.css";

export default function PublicHomePage({
  siteContent,
  isAuthenticated,
  onSignup,
  onSignin,
  onLogout,
  onEnter,
  theme = "light",
  onToggleTheme,
  lang = "ar",
  onToggleLang,
  onOpenAdmin
}) {
  const landing = siteContent.landing || DEFAULT_SITE_CONTENT.landing;
  const rootRef = useRef(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const primaryAction = isAuthenticated ? onEnter : onSignup;
  const secondaryAction = isAuthenticated ? onEnter : onSignin;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const onScroll = () => setNavScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });

    const fadeEls = root.querySelectorAll(".fade-up");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -60px 0px", threshold: 0.1 }
    );
    fadeEls.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToId = (id) => (event) => {
    if (event?.preventDefault) event.preventDefault();
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const navHeight = 72;
      const top = el.getBoundingClientRect().top + window.scrollY - navHeight - 20;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const whatsappHref = `https://wa.me/${(siteContent.supportPhone || "").replace(/[^0-9]/g, "")}`;

  const renderHeroTitle = () => {
    const title = siteContent.heroTitle || "";
    const highlight = siteContent.heroHighlight;
    if (highlight && title.includes(highlight)) {
      const idx = title.indexOf(highlight);
      return (
        <>
          {title.slice(0, idx)}
          <span className="highlight">{highlight}</span>
          {title.slice(idx + highlight.length)}
        </>
      );
    }
    return title;
  };

  const pricingTiers = [landing.pricingBasic, landing.pricingPro, landing.pricingBusiness];
  const featureIcons = [Clock, AlertTriangle, TrendingUp, CalendarDays, CalendarDays, Archive];
  const navLinks = landing.navLinks || DEFAULT_SITE_CONTENT.landing.navLinks;

  return (
    <div className="spl" ref={rootRef}>
      <nav className={`navbar${navScrolled ? " scrolled" : ""}`}>
        <div className="container">
          <a href="#hero" className="nav-brand" onClick={scrollToId("hero")}>
            <div className="nav-logo">
              {siteContent.logo ? (
                <img
                  src={siteContent.logo}
                  alt="ShiftPay HR"
                  style={{ width: "100%", height: "100%", borderRadius: "inherit", objectFit: "contain" }}
                />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v10l4.5 4.5" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              )}
            </div>
            <div className="nav-brand-text">
              ShiftPay <span>HR</span>
            </div>
          </a>

          <div className={`nav-links${mobileOpen ? " active" : ""}`}>
            {navLinks.map((link) => (
              <a key={link.target} href={`#${link.target}`} className="nav-link" onClick={scrollToId(link.target)}>
                {link.label}
              </a>
            ))}
            <div className="nav-mobile-actions">
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "12px" }}>
                {onToggleTheme && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onToggleTheme}
                    title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
                    style={{ padding: "8px 12px", minWidth: "auto" }}
                  >
                    {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                  </button>
                )}
                {onToggleLang && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onToggleLang}
                    title="تغيير اللغة"
                    style={{ padding: "8px 12px", minWidth: "auto", fontSize: "0.8rem", fontWeight: "bold" }}
                  >
                    <Globe size={14} style={{ marginLeft: "4px" }} />
                    {lang === "ar" ? "English" : "العربية"}
                  </button>
                )}
              </div>
              {isAuthenticated ? (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setMobileOpen(false);
                      primaryAction();
                    }}
                  >
                    فتح النظام
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setMobileOpen(false);
                      onSignin();
                    }}
                  >
                    تسجيل الدخول
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setMobileOpen(false);
                      onLogout();
                    }}
                  >
                    تسجيل خروج
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setMobileOpen(false);
                      onSignin();
                    }}
                  >
                    {landing.loginCta || "تسجيل الدخول"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setMobileOpen(false);
                      primaryAction();
                    }}
                  >
                    {siteContent.primaryCta || "ابدأ الآن"}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="nav-actions">
            {onToggleTheme && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onToggleTheme}
                title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
                style={{ padding: "8px 12px", minWidth: "auto" }}
                aria-label="تبديل المظهر"
              >
                {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            )}
            {onToggleLang && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onToggleLang}
                title="Language / اللغة"
                style={{ padding: "8px 12px", minWidth: "auto", fontSize: "0.8rem", fontWeight: "bold" }}
                aria-label="تغيير اللغة"
              >
                <Globe size={15} style={{ marginLeft: "4px" }} />
                {lang === "ar" ? "EN" : "عربي"}
              </button>
            )}
            {isAuthenticated ? (
              <>
                <button type="button" className="btn btn-secondary" onClick={onSignin} title="تسجيل الدخول بحساب آخر">
                  تسجيل الدخول
                </button>
                <button type="button" className="btn btn-secondary" onClick={onLogout} title="تسجيل الخروج">
                  تسجيل خروج
                </button>
                <button type="button" className="btn btn-primary" onClick={primaryAction}>
                  فتح النظام
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-secondary" onClick={onSignin}>
                  {landing.loginCta || "تسجيل الدخول"}
                </button>
                <button type="button" className="btn btn-primary" onClick={primaryAction}>
                  {siteContent.primaryCta || "ابدأ الآن"}
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className={`nav-mobile-toggle${mobileOpen ? " active" : ""}`}
            aria-label="فتح القائمة"
            onClick={() => setMobileOpen((value) => !value)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <section className="hero" id="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge fade-up">
              <Sparkles size={16} />
              {siteContent.heroBadge}
            </div>

            <h1 className="hero-title fade-up fade-up-delay-1">{renderHeroTitle()}</h1>

            <p className="hero-desc fade-up fade-up-delay-2">{siteContent.heroText}</p>

            <div className="hero-actions fade-up fade-up-delay-3">
              <button type="button" className="btn btn-primary btn-large" onClick={primaryAction}>
                <ArrowLeft size={18} />
                {isAuthenticated ? "فتح النظام" : (siteContent.primaryCta || "ابدأ الآن")}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-large"
                onClick={onSignin}
              >
                {isAuthenticated ? "تسجيل الدخول بحساب آخر" : (siteContent.secondaryCta || landing.loginCta || "تسجيل الدخول")}
              </button>
            </div>

            <div className="hero-trust fade-up fade-up-delay-4">
              {(landing.heroTrust || []).map((text, index) => {
                const TrustIcon = index === 0 ? ShieldCheck : index === 1 ? Clock : CalendarDays;
                return (
                  <React.Fragment key={text}>
                    {index > 0 ? <div className="hero-trust-divider"></div> : null}
                    <div className="hero-trust-item">
                      <TrustIcon size={18} />
                      {text}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="hero-visual fade-up fade-up-delay-2">
            <div className="dashboard-preview">
              <div className="dashboard-topbar">
                <div className="dashboard-topbar-right">
                  <div className="dashboard-dot green"></div>
                  <div className="dashboard-dot yellow"></div>
                  <div className="dashboard-dot red"></div>
                  <span className="dashboard-topbar-title">لوحة تقارير الرواتب</span>
                </div>
                <span className="dashboard-topbar-date">يوليو 2026</span>
              </div>
              <div className="dashboard-body">
                <div className="dashboard-kpis">
                  <div className="kpi-card">
                    <div className="kpi-label">إجمالي الموظفين</div>
                    <div className="kpi-value">48</div>
                    <div className="kpi-sub">هذا الشهر</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-label">نسبة الالتزام</div>
                    <div className="kpi-value success">92%</div>
                    <div className="kpi-sub">حضور منتظم</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-label">حالات تأخير</div>
                    <div className="kpi-value danger">7</div>
                    <div className="kpi-sub">هذا الأسبوع</div>
                  </div>
                </div>

                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>الموظف</th>
                        <th>الشيفت</th>
                        <th>الحضور</th>
                        <th>الانصراف</th>
                        <th>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>أحمد محمد علي</td>
                        <td>صباحي</td>
                        <td>08:02</td>
                        <td>16:05</td>
                        <td>
                          <span className="status-badge on-time">
                            <span className="status-dot"></span> ملتزم
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>سارة عبدالرحمن</td>
                        <td>مسائي</td>
                        <td>16:15</td>
                        <td>00:10</td>
                        <td>
                          <span className="status-badge late">
                            <span className="status-dot"></span> متأخر 15 د
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>محمود حسن</td>
                        <td>صباحي</td>
                        <td>07:55</td>
                        <td>17:30</td>
                        <td>
                          <span className="status-badge on-time">
                            <span className="status-dot"></span> أوفر تايم 1.5 س
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>نورا السيد</td>
                        <td>منقسم</td>
                        <td>09:00</td>
                        <td>18:00</td>
                        <td>
                          <span className="status-badge on-time">
                            <span className="status-dot"></span> ملتزم
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section comparison" id="comparison">
        <div className="container">
          <div className="text-center fade-up">
            <div className="section-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              {landing.comparisonBadge}
            </div>
            <h2 className="section-title">{landing.comparisonTitle}</h2>
            <p className="section-desc">{landing.comparisonDesc}</p>
          </div>

          <div className="comparison-grid" style={{ marginTop: "var(--space-12)" }}>
            <div className="comparison-column old fade-up fade-up-delay-1">
              <div className="comparison-column-header">
                <div className="comparison-column-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <span className="comparison-column-title">{landing.comparisonOldLabel}</span>
              </div>
              {(landing.comparisonOld || []).map((item) => (
                <div className="comparison-card" key={item.title}>
                  <div className="comparison-card-icon">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div className="comparison-card-title">{item.title}</div>
                    <div className="comparison-card-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="comparison-divider fade-up">
              <div className="comparison-arrow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </div>
            </div>

            <div className="comparison-column new fade-up fade-up-delay-2">
              <div className="comparison-column-header">
                <div className="comparison-column-icon">
                  <CheckCircle2 size={24} />
                </div>
                <span className="comparison-column-title">{landing.comparisonNewLabel}</span>
              </div>
              {(landing.comparisonNew || []).map((item) => (
                <div className="comparison-card" key={item.title}>
                  <div className="comparison-card-icon">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div className="comparison-card-title">{item.title}</div>
                    <div className="comparison-card-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <div className="text-center fade-up">
            <div className="section-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              {landing.featuresBadge}
            </div>
            <h2 className="section-title">{landing.featuresTitle}</h2>
            <p className="section-desc">{landing.featuresDesc}</p>
          </div>

          <div className="features-grid">
            {(landing.features || []).map((feature, index) => {
              const FeatureIcon = featureIcons[index % featureIcons.length];
              return (
                <div className="feature-card fade-up" key={feature.title}>
                  <div className="feature-icon">
                    <FeatureIcon size={24} />
                  </div>
                  <div className="feature-title">{feature.title}</div>
                  <div className="feature-desc">{feature.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section pricing" id="pricing">
        <div className="container">
          <div className="text-center fade-up">
            <div className="section-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              {landing.pricingBadge}
            </div>
            <h2 className="section-title">{landing.pricingTitle}</h2>
            <p className="section-desc">{landing.pricingDesc}</p>
          </div>

          <div className="pricing-grid">
            {pricingTiers.map((tier, index) => (
              <div className={`pricing-card${tier?.badge ? " popular" : ""} fade-up`} key={tier?.name || index}>
                {tier?.badge ? <div className="pricing-popular-badge">{tier.badge}</div> : null}
                <div className="pricing-name">{tier?.name}</div>
                <div className="pricing-desc">{tier?.desc}</div>
                <div className="pricing-price">
                  <span className="pricing-amount">{tier?.amount}</span>
                  <span className="pricing-currency">ج.م</span>
                </div>
                <div className="pricing-period">{tier?.period}</div>
                <div className="pricing-features">
                  {(tier?.features || []).map((line) => (
                    <div className="pricing-feature" key={line}>
                      <CheckCircle2 size={18} />
                      {line}
                    </div>
                  ))}
                </div>
                <button type="button" className={`btn ${tier?.badge ? "btn-primary" : "btn-secondary"}`} onClick={primaryAction}>
                  {tier?.cta || "ابدأ الآن"}
                </button>
              </div>
            ))}
          </div>

          <div className="pricing-enterprise fade-up">
            <div className="pricing-enterprise-info">
              <div className="pricing-enterprise-title">{landing.pricingEnterpriseTitle}</div>
              <div className="pricing-enterprise-desc">{landing.pricingEnterpriseDesc}</div>
            </div>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-large">
              <MessageCircle size={18} />
              {landing.pricingEnterpriseCta}
            </a>
          </div>
        </div>
      </section>

      <section className="cta-section" id="cta">
        <div className="container">
          <div className="cta-content fade-up">
            <h2 className="cta-title">{landing.ctaTitle}</h2>
            <p className="cta-desc">{landing.ctaDesc}</p>
            <button type="button" className="btn btn-white btn-large" onClick={primaryAction}>
              <ArrowLeft size={18} />
              {landing.ctaButton}
            </button>
          </div>
        </div>
      </section>

      <footer className="footer" id="support">
        <div className="container">
          <div className="footer-grid">
            <div>
              <a href="#hero" className="nav-brand" style={{ color: "white" }} onClick={scrollToId("hero")}>
                <div className="nav-logo">
                  {siteContent.logo ? (
                    <img
                      src={siteContent.logo}
                      alt="ShiftPay HR"
                      style={{ width: "100%", height: "100%", borderRadius: "inherit", objectFit: "contain" }}
                    />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v10l4.5 4.5" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  )}
                </div>
                <div className="nav-brand-text" style={{ color: "white" }}>
                  ShiftPay <span style={{ color: "rgba(255,255,255,0.5)" }}>HR</span>
                </div>
              </a>
              <p className="footer-brand-desc">{landing.footerBrandDesc}</p>
            </div>

            <div>
              <div className="footer-col-title">روابط سريعة</div>
              <div className="footer-links">
                {navLinks.map((link) => (
                  <a key={link.target} href={`#${link.target}`} className="footer-link" onClick={scrollToId(link.target)}>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div className="footer-col-title">المنتج</div>
              <div className="footer-links">
                <button type="button" className="footer-link" onClick={primaryAction}>
                  {siteContent.primaryCta}
                </button>
                <button type="button" className="footer-link" onClick={secondaryAction}>
                  {landing.loginCta}
                </button>
                <a href="#pricing" className="footer-link" onClick={scrollToId("pricing")}>
                  الباقات والأسعار
                </a>
                <a href="#admin" className="footer-link" onClick={(e) => { if (onOpenAdmin) { e.preventDefault(); onOpenAdmin(); } }}>
                  إدارة الموقع والأسعار
                </a>
                <a href="/privacy" className="footer-link" target="_blank" rel="noopener noreferrer">
                  سياسة الخصوصية
                </a>
                <a href="/terms" className="footer-link" target="_blank" rel="noopener noreferrer">
                  شروط الخدمة
                </a>
              </div>
            </div>

            <div>
              <div className="footer-col-title">تواصل معنا</div>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="footer-contact-item whatsapp">
                <MessageCircle size={20} />
                واتساب
              </a>
              <a href={`mailto:${siteContent.supportEmail}`} className="footer-contact-item">
                <Mail size={20} />
                {siteContent.supportEmail}
              </a>
              <a href="https://shiftpay.online" target="_blank" rel="noopener noreferrer" className="footer-contact-item">
                <Headphones size={20} />
                shiftpay.online
              </a>
            </div>
          </div>

          <hr className="footer-divider" />

          <div className="footer-bottom">
            <span>{landing.footerCopyright}</span>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "0.8rem" }}>
              <a href="/privacy" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }} target="_blank" rel="noopener noreferrer">سياسة الخصوصية</a>
              <span>•</span>
              <a href="/terms" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }} target="_blank" rel="noopener noreferrer">شروط الخدمة</a>
            </div>
            <span>{landing.footerTagline}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

