/**
 * The landing page. Reorder, remove or add sections here.
 */
import { I18nProvider, useI18n } from "./lib/i18n.jsx";
import { useReveal } from "./hooks/useReveal.js";
import { useDocumentHead } from "./hooks/useDocumentHead.js";
import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import BackToTop from "./components/layout/BackToTop.jsx";
import Hero from "./components/sections/Hero.jsx";
import Intro from "./components/sections/Intro.jsx";
import Destinations from "./components/sections/Destinations.jsx";
import Seasons from "./components/sections/Seasons.jsx";
import Experiences from "./components/sections/Experiences.jsx";
import CallToAction from "./components/sections/CallToAction.jsx";

export default function App({ lang }) {
  return (
    <I18nProvider lang={lang}>
      <HomePage />
    </I18nProvider>
  );
}

function HomePage() {
  const { lang, t } = useI18n();
  useDocumentHead(lang, t("meta.title"));
  useReveal();

  return (
    <>
      <a className="skip-link" href="#main">{t("a11y.skip")}</a>
      <Header />
      <main id="main">
        <Hero />
        <Intro />
        <Destinations />
        <Seasons />
        <Experiences />
        <CallToAction />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
