import { icons } from "./icons.js";

/** <Icon name="arrow" size={18} />  — available names are in ./icons.js */
export default function Icon({ name, size, className = "", ...rest }) {
  const svg = icons[name];
  if (!svg) throw new Error(`Icon "${name}" not found in src/components/ui/icons.js`);
  return (
    <svg
      className={`icon ${className}`.trim()}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={size ? { width: size, height: size } : undefined}
      dangerouslySetInnerHTML={{ __html: svg }}
      {...rest}
    />
  );
}
