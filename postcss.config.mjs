import { fileURLToPath } from "node:url";

// Tailwind first, then a small local step that keeps the styles working on
// older phones (see postcss-old-phones.cjs). The full path is needed because
// the build loads plugins from its own folder.
const oldPhones = fileURLToPath(new URL("./postcss-old-phones.cjs", import.meta.url));

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    [oldPhones]: {},
  },
};

export default config;
