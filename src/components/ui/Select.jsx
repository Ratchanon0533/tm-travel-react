import { useEffect, useId, useRef, useState } from "react";
import { cx } from "../../lib/cx.js";
import styles from "./Select.module.css";

/**
 * Styled dropdown that sends its value with the form like <select name="…"> (through a hidden input).
 * A native select's open list can't be styled, so this draws its own.
 * Keyboard: ↑ ↓ Home End move, Enter / Space pick, Esc closes the list (not the popup it's in).
 * Props: name, options (labels; the label is the value), defaultValue, labelId (id of the visible label)
 */
export default function Select({ name, options, defaultValue, labelId }) {
  const id = useId();
  const box = useRef(null);
  const trigger = useRef(null);
  const [value, setValue] = useState(defaultValue ?? options[0]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0); // highlighted option while open

  // Close when clicking anywhere else
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!box.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const show = () => { setActive(Math.max(options.indexOf(value), 0)); setOpen(true); };
  const choose = (i) => { setValue(options[i]); setOpen(false); trigger.current.focus(); };

  const onKeyDown = (e) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); show(); }
      return;
    }
    const last = options.length - 1;
    const keys = {
      ArrowDown: () => setActive((a) => Math.min(a + 1, last)),
      ArrowUp: () => setActive((a) => Math.max(a - 1, 0)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(active),
      " ": () => choose(active),
      Escape: () => setOpen(false),
    };
    if (keys[e.key]) {
      e.preventDefault(); // Esc: close only the list, not the dialog around it
      keys[e.key]();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={box} className={cx(styles.select, open && styles.open)}>
      <input type="hidden" name={name} value={value} />
      <button
        ref={trigger}
        id={`${id}-value`}
        className={styles.trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={labelId ? `${labelId} ${id}-value` : undefined}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
      >
        <span>{value}</span>
        <svg className={styles.caret} viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <ul id={`${id}-list`} className={styles.list} role="listbox" aria-labelledby={labelId}>
          {options.map((option, i) => (
            <li
              key={option}
              id={`${id}-${i}`}
              className={cx(styles.option, i === active && styles.active)}
              role="option"
              aria-selected={option === value}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()} // keep focus on the button
              onClick={() => choose(i)}
            >
              {option}
              {option === value && <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
