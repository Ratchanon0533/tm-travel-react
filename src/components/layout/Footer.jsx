import { Fragment } from "react";
import Icon from "../ui/Icon.jsx";
import { site, navigation } from "../../config/site.js";
import { useI18n } from "../../lib/i18n.jsx";
import { asset } from "../../lib/paths.js";
import { photoCredits } from "../../lib/images.js";
import styles from "./Footer.module.css";

export default function Footer() {
  const { t } = useI18n();
  const exploreLinks = navigation.slice(0, 3);

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <img src={asset(site.logo.white)} alt={site.name} width={site.logo.width} height={site.logo.height} loading="lazy" />
          <p className={styles.tagline}><span lang="ja">{site.taglineJa}</span>{t("footer.tagline") && <> — {t("footer.tagline")}</>}</p>
          <p className={styles.company}>{site.legalNameJa} · {site.legalName}</p>
        </div>

        <div>
          <h4>{t("footer.explore")}</h4>
          <ul>{exploreLinks.map((item) => <li key={item.href}><a href={item.href}>{t(item.key)}</a></li>)}</ul>
        </div>

        <div>
          <h4>{t("footer.company")}</h4>
          <ul>
            <li><a href="#about">{t("footer.aboutLink")}</a></li>
            <li><a href={site.japaneseSiteUrl} target="_blank" rel="noopener">{t("footer.jpSite")}</a></li>
          </ul>
        </div>

        <div>
          <h4>{t("footer.contact")}</h4>
          <ul className={styles.contact}>
            <li>
              <Icon name="pin" />
              <span>{site.address.map((line, i) => <Fragment key={i}>{line}{i < site.address.length - 1 && <br />}</Fragment>)}</span>
            </li>
            <li><Icon name="phone" /><a href={site.phoneHref}>{site.phone}</a></li>
          </ul>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p>© <span suppressHydrationWarning>{new Date().getFullYear()}</span> {site.legalName} {t("footer.rights")}</p>
        <details className={styles.credits}>
          <summary>{t("footer.credits")}</summary>
          <p>{t("footer.creditsNote")}: {photoCredits().join(", ")}</p>
        </details>
      </div>
    </footer>
  );
}
