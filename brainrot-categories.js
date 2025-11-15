// brainrot-categories.js
import { BRAINROT_NAMES } from "./brainrot-names.js";

const DIR = "/Photo brainrot site";
export const PLACEHOLDER = "/images/brainrot/placeholder.webp";

// Convertit le nom humain → slug kebab-case
function toSlug(name) {
  return name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // enlève les accents
    .replace(/[^a-zA-Z0-9\s]/g, "") // supprime caractères spéciaux
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-"); // remplace espaces par tirets
}

// Crée l’URL d’image correspondante
export function imageUrlFor(name) {
  const slug = toSlug(name);
  return `${DIR}/${slug}.webp`;
}

// Pour réessayer en .png ou .jpg si erreur
export function onImageErrorRotate(img) {
  const tried = (img.dataset.triedExts || "").split(",").filter(Boolean);
  const next = { webp: "png", png: "jpg" }[tried.at(-1)] || "webp";
  if (next && !tried.includes(next)) {
    tried.push(next);
    img.dataset.triedExts = tried.join(",");
    img.src = imageUrlFor(img.dataset.catName).replace(".webp", `.${next}`);
  } else {
    img.src = PLACEHOLDER;
  }
}

window.BR_ONERR = onImageErrorRotate;

// Liste auto
export const CATEGORIES = BRAINROT_NAMES.map(name => ({
  name,
  image: imageUrlFor(name),
}));
