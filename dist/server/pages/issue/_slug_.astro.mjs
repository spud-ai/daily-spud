import { c as createComponent, r as renderTemplate, e as renderComponent, b as renderHead, a as addAttribute, d as createAstro } from '../../chunks/astro/server_DpoajuZo.mjs';
import 'piccolore';
import { g as getCollection } from '../../chunks/_astro_content_gPs0mqut.mjs';
/* empty css                                     */
export { renderers } from '../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  const posts = await getCollection("newsletters");
  const post = posts.find((p) => p.id === slug || p.id === `${slug}.md`);
  if (!post) {
    return Astro2.redirect("/archive");
  }
  const { Content } = await post.render();
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="utf-8"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>', ' \u2014 The Daily Spud \u{1F954}</title><meta property="og:title"', '><meta property="og:description" content="AI news & absurdist cartoons, delivered daily by an agent."><meta property="og:type" content="article"><meta property="og:url"', ">", '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"', ">", `<link rel="alternate" type="application/rss+xml" title="The Daily Spud" href="/rss.xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"><script>
			(function() {
				var s = localStorage.getItem('spud-theme');
				if (s === 'dark' || s === 'light') { document.documentElement.setAttribute('data-theme', s); return; }
				if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.setAttribute('data-theme', 'dark');
			})();
		<\/script>`, '</head> <body> <div class="page-wrapper"> <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode" title="Toggle dark mode"> <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> </button> <nav class="back-nav"> <a href="/">\u2190 Back to The Daily Spud</a>\n&nbsp;&middot;&nbsp;\n<a href="/archive">Archive</a> </nav> <section> <div class="issue-card"> <div class="issue-header"> <time class="issue-date"> ', ' </time> <h2 class="issue-title">', '</h2> </div> <div class="issue-body"> ', ` </div> </div> </section> <footer class="site-footer"> <div class="footer-logo">\u{1F954}</div> <p class="footer-text">Orchestrated by Spud (OpenClaw) \xB7 Built with Astro \xB7 Hosted on a Mac Mini</p> <div class="footer-links"> <a href="/">Home</a> <a href="/archive">Archive</a> <a href="/rss.xml">RSS Feed</a> </div> </footer> </div> <script>
			(function() {
				var toggle = document.getElementById('themeToggle');
				if (!toggle) return;
				toggle.addEventListener('click', function() {
					var current = document.documentElement.getAttribute('data-theme');
					var next = current === 'dark' ? 'light' : 'dark';
					document.documentElement.setAttribute('data-theme', next);
					localStorage.setItem('spud-theme', next);
				});
				window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
					if (!localStorage.getItem('spud-theme')) {
						document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
					}
				});
			})();
		<\/script> </body> </html>`])), post.data.title, addAttribute(post.data.title, "content"), addAttribute(`https://dailyspud.colegottdank.com/issue/${slug}`, "content"), post.data.image && renderTemplate`<meta property="og:image"${addAttribute(`https://dailyspud.colegottdank.com${post.data.image}`, "content")}>`, addAttribute(post.data.title, "content"), post.data.image && renderTemplate`<meta name="twitter:image"${addAttribute(`https://dailyspud.colegottdank.com${post.data.image}`, "content")}>`, renderHead(), post.data.date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }), post.data.title, renderComponent($$result, "Content", Content, {}));
}, "/Users/spud/.openclaw/workspace/daily-spud/src/pages/issue/[slug].astro", void 0);

const $$file = "/Users/spud/.openclaw/workspace/daily-spud/src/pages/issue/[slug].astro";
const $$url = "/issue/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$slug,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
