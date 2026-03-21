import DOMPurify from "dompurify";

const CONFIG_INLINE = {
  ALLOWED_TAGS: [
    "em",
    "i",
    "strong",
    "b",
    "u",
    "s",
    "del",
    "sup",
    "sub",
    "span",
    "br",
    "code",
  ],
  ALLOWED_ATTR: ["class", "style", "aria-hidden"],
  KEEP_CONTENT: true,
  FORCE_BODY: false,
};

const CONFIG_PASSAGE = {
  ALLOWED_TAGS: [
    "p",
    "h2",
    "h3",
    "h4",
    "ol",
    "ul",
    "li",
    "blockquote",
    "hr",
    "div",
    "section",
    "em",
    "i",
    "strong",
    "b",
    "u",
    "s",
    "del",
    "sup",
    "sub",
    "span",
    "br",
    "code",
  ],
  ALLOWED_ATTR: ["class", "style", "aria-hidden", "id"],
  KEEP_CONTENT: true,
};

const CONFIG_FOOTNOTE = {
  ALLOWED_TAGS: ["em", "i", "strong", "b", "sup", "sub", "span", "br"],
  ALLOWED_ATTR: ["class", "style"],
  KEEP_CONTENT: true,
};

export function sanitizeInline(html) {
  if (!html || typeof html !== "string") return "";
  return DOMPurify.sanitize(html, CONFIG_INLINE);
}

export function sanitizePassage(html) {
  if (!html || typeof html !== "string") return "";
  return DOMPurify.sanitize(html, CONFIG_PASSAGE);
}

export function sanitizeFootnote(html) {
  if (!html || typeof html !== "string") return "";
  return DOMPurify.sanitize(html, CONFIG_FOOTNOTE);
}

export function containsHtml(str) {
  return typeof str === "string" && /<[a-z][\s\S]*>/i.test(str);
}
