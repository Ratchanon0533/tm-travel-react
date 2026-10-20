import { useEffect, useRef, useState } from "react";
import Icon from "../ui/Icon.jsx";
import Eyebrow from "../ui/Eyebrow.jsx";
import Button from "../ui/Button.jsx";
import Select from "../ui/Select.jsx";
import { site } from "../../config/site.js";
import { useI18n } from "../../lib/i18n.jsx";
import styles from "./PartnerForm.module.css";

/**
 * "Become a partner" popup (native <dialog>: Esc, focus and backdrop handled). Opens when `open`
 * is true; calls onClose when dismissed.
 * Sending: with site.partnerFormEndpoint set, the form is posted to that form service; otherwise the
 * visitor's email app opens, addressed to site.email, with everything filled in.
 * Two columns on wide screens: who it is for and a "write your own email" option (the address, which opens a blank
 * email, and a copy button) on the left, the form on the right. Stacked on phones.
 */
export default function PartnerForm({ open, onClose }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const [status, setStatus] = useState("idle"); // idle · sending · mailed · sent · error
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(site.email);
      ok = true;
    } catch {
      // clipboard API blocked (some in-app browsers): copy through a hidden text field inside the dialog
      const field = Object.assign(document.createElement("textarea"), { value: site.email, readOnly: true });
      field.style.cssText = "position: fixed; opacity: 0; pointer-events: none;";
      ref.current.append(field);
      field.select();
      try { ok = document.execCommand("copy"); } catch { /* the address is on screen anyway */ }
      field.remove();
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) {
      setStatus("idle");
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
    document.body.classList.toggle("no-scroll", open);
  }, [open]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (site.partnerFormEndpoint) {
      setStatus("sending");
      try {
        const res = await fetch(site.partnerFormEndpoint, { method: "POST", headers: { Accept: "application/json" }, body: data });
        setStatus(res.ok ? "sent" : "error");
      } catch {
        setStatus("error");
      }
      return;
    }
    // No form service: hand everything to the visitor's email app (labels in English, for our team)
    const v = (name) => String(data.get(name) ?? "").trim();
    const body = [
      `Company: ${v("company")}`,
      `Name: ${v("name")}`,
      `Email: ${v("email")}`,
      `Country / region: ${v("country")}`,
      `Type of business: ${v("type")}`,
      "",
      v("message"),
    ].join("\n");
    const subject = `Partnership inquiry — ${v("company")}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus("mailed");
  };

  const done = status === "mailed" || status === "sent";
  const mailLink = <a href={`mailto:${site.email}`}>{site.email}</a>;

  return (
    <dialog ref={ref} className={styles.modal} aria-labelledby="partner-form-title" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <button className={styles.close} type="button" aria-label={t("modal.close")} onClick={onClose}>
        <Icon name="close" size={22} />
      </button>

      <div className={styles.layout}>
        {/* Left: who it's for, and the option to write your own email */}
        <aside className={styles.side}>
          <Eyebrow light>{t("partners.eyebrow")}</Eyebrow>
          <h3 id="partner-form-title" className={styles.title}>{t("partners.cta")}</h3>
          <p className={styles.intro}>{t("pform.intro")}</p>
          <div className={styles.direct}>
            <p>{t("pform.direct")}</p>
            <div className={styles.address}>
              <a href={`mailto:${site.email}?subject=${encodeURIComponent("Partnership inquiry")}`}><Icon name="mail" size={18} />{site.email}</a>
              <button type="button" className={copied ? styles.copied : undefined} onClick={copyAddress}>
                <Icon name="copy" size={15} />
                <span aria-live="polite">{copied ? t("pform.copied") : t("pform.copy")}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Right: the form, or the thank-you note once sent */}
        {done ? (
          <div className={styles.done} aria-live="polite">
            <span className={styles.check} aria-hidden="true"><Icon name="chevron" size={30} /></span>
            <h3 className={styles.doneTitle}>{t("pform.thanks")}</h3>
            <p>{status === "sent" ? t("pform.thanksSent") : <>{t("pform.thanksMail")} {mailLink}</>}</p>
            <Button variant="navy" onClick={onClose}>{t("modal.close")}</Button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={onSubmit}>
            <input type="hidden" name="_subject" value="Partnership inquiry" />
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>{t("pform.company")} *</span>
                <input name="company" required autoComplete="organization" />
              </label>
              <label className={styles.field}>
                <span>{t("pform.name")} *</span>
                <input name="name" required autoComplete="name" />
              </label>
              <label className={styles.field}>
                <span>{t("pform.email")} *</span>
                <input name="email" type="email" required autoComplete="email" />
              </label>
              <label className={styles.field}>
                <span>{t("pform.country")}</span>
                <input name="country" autoComplete="country-name" />
              </label>
              <div className={`${styles.field} ${styles.wide}`}>
                <span id="partner-form-type">{t("pform.type")}</span>
                <Select name="type" labelId="partner-form-type" options={["partners.t1", "partners.t2", "partners.t3", "pform.other"].map((key) => t(key))} />
              </div>
              <label className={`${styles.field} ${styles.wide}`}>
                <span>{t("pform.message")}</span>
                <textarea name="message" rows={3} placeholder={t("pform.messageHint")} />
              </label>
            </div>

            {status === "error" && <p className={styles.error} role="alert">{t("pform.error")} {mailLink}</p>}

            <div className={styles.actions}>
              <Button type="submit" variant="navy" iconRight="arrow" disabled={status === "sending"}>{t("pform.send")}</Button>
              {!site.partnerFormEndpoint && <p className={styles.note}>{t("pform.note")}</p>}
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
