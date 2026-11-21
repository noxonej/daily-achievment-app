/**
 * Landing pages (C3): plain, fast HTML (no JavaScript) in English and Lithuanian, generated at build
 * time from the one app URL (src/site.ts), so links, canonical URLs and the sitemap follow a domain
 * move. Output: <base>welcome/ (EN), <base>welcome/lt/ (LT), plus robots.txt and sitemap.xml.
 */
export type Lang = 'en' | 'lt';

interface Copy {
  title: string;
  description: string;
  h1: string;
  lead: string;
  cta: string;
  ctaSub: string;
  features: Array<[string, string, string]>;
  howTitle: string;
  how: string[];
  privacyTitle: string;
  privacy: string;
  faqTitle: string;
  faq: Array<[string, string]>;
  switchLang: string;
  footer: string;
}

const COPY: Record<Lang, Copy> = {
  en: {
    title: 'Squzo: level up your real life (habits, goals, money)',
    description:
      'Squzo turns your day into quests. Build habits, keep streaks, grow your Body, Mind, Wealth, Discipline and Social stats, save for goals and compete with friends. Free, no ads.',
    h1: 'Level up your real life.',
    lead: 'Squzo turns your day into quests. Do them, keep your streak, and watch your real-life stats grow: Body, Mind, Wealth, Discipline and Social.',
    cta: 'Start free',
    ctaSub: 'Works in your browser. Add it to your home screen in one tap. No ads.',
    features: [
      ['⚔️', 'Daily quests and streaks', 'Small, doable quests every day. Miss a day? A streak shield has your back.'],
      ['📊', 'Real-life stats', 'Every quest grows a stat. See your character sheet as a radar and level each stat to 100.'],
      ['💰', 'Money and savings goals', 'Track spending, stay under your daily limit and watch your car fund fill up.'],
      ['🤝', 'Squads and challenges', 'Squads of up to 10 friends with one shared streak. Join 7, 14 or 30-day challenges from a link.'],
      ['🏆', 'Fair leaderboards', 'Daily XP caps, impossible scores hidden, report and block built in.'],
      ['🔒', 'Private by design', 'Your data stays on your phone. Cloud backups are encrypted with a key only you have.'],
    ],
    howTitle: 'How it works',
    how: ['Pick what you want to level up.', 'Choose 3 small daily quests.', 'Do the first one right now and hit level 2.'],
    privacyTitle: 'Your privacy',
    privacy:
      'No ads, no selling data, no tracking across apps. Optional anonymous usage counts (you can turn them off). Delete your cloud data any time.',
    faqTitle: 'Questions',
    faq: [
      ['Is Squzo free?', 'Yes. Quests, streaks, stats, friends and joining challenges are free.'],
      ['Do I need an account?', 'No. Sign in with Google only if you want backups, friends and squads.'],
      ['Does it work on iPhone and Android?', 'Yes, in the browser. Tap Share → Add to Home Screen to use it like an app.'],
    ],
    switchLang: 'Lietuviškai',
    footer: 'Squzo. Not medical or financial advice.',
  },
  lt: {
    title: 'Squzo: kelk savo tikro gyvenimo lygį (įpročiai, tikslai, pinigai)',
    description:
      'Squzo paverčia tavo dieną užduotimis. Kurk įpročius, palaikyk serijas, augink Kūno, Proto, Turtų, Disciplinos ir Bendravimo rodiklius, taupyk tikslams ir varžykis su draugais. Nemokamai, be reklamų.',
    h1: 'Kelk savo tikro gyvenimo lygį.',
    lead: 'Squzo paverčia tavo dieną užduotimis. Atlik jas, palaikyk seriją ir stebėk, kaip auga tavo tikri rodikliai: Kūnas, Protas, Turtai, Disciplina ir Bendravimas.',
    cta: 'Pradėti nemokamai',
    ctaSub: 'Veikia naršyklėje. Vienu paspaudimu pridėk į pradžios ekraną. Be reklamų.',
    features: [
      ['⚔️', 'Kasdienės užduotys ir serijos', 'Mažos, įveikiamos užduotys kasdien. Praleidai dieną? Serijos skydas apsaugos.'],
      ['📊', 'Tikro gyvenimo rodikliai', 'Kiekviena užduotis augina rodiklį. Matyk savo charakterį radare ir kelk kiekvieną iki 100 lygio.'],
      ['💰', 'Pinigai ir taupymo tikslai', 'Sek išlaidas, neviršyk dienos limito ir stebėk, kaip pildosi mašinos fondas.'],
      ['🤝', 'Komandos ir iššūkiai', 'Iki 10 draugų komanda su bendra serija. Prisijunk prie 7, 14 ar 30 dienų iššūkių per nuorodą.'],
      ['🏆', 'Sąžiningos lentelės', 'Dienos XP ribos, neįmanomi rezultatai paslepiami, galima pranešti ir užblokuoti.'],
      ['🔒', 'Privatumas pirmiausia', 'Tavo duomenys lieka telefone. Debesies kopijos užšifruotos raktu, kurį turi tik tu.'],
    ],
    howTitle: 'Kaip tai veikia',
    how: ['Pasirink, ką nori patobulinti.', 'Išsirink 3 mažas kasdienes užduotis.', 'Atlik pirmą iškart ir pasiek 2 lygį.'],
    privacyTitle: 'Tavo privatumas',
    privacy:
      'Jokių reklamų, duomenų pardavimo ar sekimo kitose programėlėse. Nebūtina anoniminė naudojimo statistika (gali išjungti). Debesies duomenis gali ištrinti bet kada.',
    faqTitle: 'Klausimai',
    faq: [
      ['Ar Squzo nemokama?', 'Taip. Užduotys, serijos, rodikliai, draugai ir prisijungimas prie iššūkių nemokami.'],
      ['Ar reikia paskyros?', 'Ne. Prisijunk su Google tik jei nori atsarginių kopijų, draugų ir komandų.'],
      ['Ar veikia iPhone ir Android?', 'Taip, naršyklėje. Paspausk Bendrinti → Į pradžios ekraną ir naudok kaip programėlę.'],
    ],
    switchLang: 'English',
    footer: 'Squzo. Ne medicininė ir ne finansinė konsultacija.',
  },
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const landingPath = (lang: Lang) => (lang === 'en' ? 'welcome/' : 'welcome/lt/');

/** One landing page. `appUrl` ends with "/" (e.g. https://noxonej.github.io/daily-achievment-app/). */
export function landingHtml(lang: Lang, appUrl: string): string {
  const c = COPY[lang];
  const self = `${appUrl}${landingPath(lang)}`;
  const other = `${appUrl}${landingPath(lang === 'en' ? 'lt' : 'en')}`;
  const icon = `${appUrl}app-icon-512.png`;
  // Same-site files are linked relatively, so the page also works on a preview server.
  const up = lang === 'lt' ? '../../' : '../';
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Squzo',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web, iOS, Android',
    description: c.description,
    url: appUrl,
    image: icon,
    inLanguage: lang,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  };
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'" />
<title>${esc(c.title)}</title>
<meta name="description" content="${esc(c.description)}" />
<link rel="canonical" href="${self}" />
<link rel="alternate" hreflang="en" href="${appUrl}${landingPath('en')}" />
<link rel="alternate" hreflang="lt" href="${appUrl}${landingPath('lt')}" />
<link rel="alternate" hreflang="x-default" href="${appUrl}${landingPath('en')}" />
<link rel="icon" href="${up}favicon.svg" type="image/svg+xml" />
<meta name="theme-color" content="#0b0d11" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Squzo" />
<meta property="og:title" content="${esc(c.title)}" />
<meta property="og:description" content="${esc(c.description)}" />
<meta property="og:url" content="${self}" />
<meta property="og:image" content="${icon}" />
<meta property="og:locale" content="${lang === 'lt' ? 'lt_LT' : 'en_US'}" />
<meta name="twitter:card" content="summary" />
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<style>
:root{--bg:#0b0d11;--card:#141821;--ink:#f4f6f8;--sub:#94a3b8;--acc:#38bdf8;--acc2:#0891b2;--line:rgba(255,255,255,.08)}
@media (prefers-color-scheme:light){:root{--bg:#f4f6f8;--card:#fff;--ink:#10161f;--sub:#526070;--acc:#0b6fb0;--acc2:#0891b2;--line:rgba(0,0,0,.08)}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:960px;margin:0 auto;padding:0 20px}
header{display:flex;align-items:center;justify-content:space-between;padding:20px 0}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:20px;color:var(--ink);text-decoration:none}
.brand img{width:36px;height:36px;border-radius:10px}
.lang{color:var(--sub);font-size:14px;text-decoration:none}
.hero{padding:48px 0 32px;text-align:center}
h1{font-size:clamp(34px,7vw,60px);line-height:1.05;letter-spacing:-.02em;margin:0 0 16px}
.lead{max-width:620px;margin:0 auto 28px;color:var(--sub);font-size:18px}
.cta{display:inline-block;background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff;font-weight:800;padding:16px 34px;border-radius:999px;text-decoration:none;font-size:18px}
.cta:focus-visible,a:focus-visible{outline:3px solid var(--acc);outline-offset:3px}
.small{color:var(--sub);font-size:14px;margin-top:12px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin:40px 0}
.card{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:20px}
.card h3{margin:8px 0 6px;font-size:18px}.card p{margin:0;color:var(--sub);font-size:15px}
.emoji{font-size:26px}
h2{font-size:26px;margin:40px 0 14px}
ol{padding-left:22px}ol li{margin:6px 0}
details{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 18px;margin:10px 0}
summary{font-weight:700;cursor:pointer}details p{color:var(--sub);margin:8px 0 0}
footer{color:var(--sub);font-size:13px;padding:40px 0;text-align:center}
.end{text-align:center;margin:48px 0 8px}
</style>
</head>
<body>
<div class="wrap">
<header>
<a class="brand" href="${appUrl}"><img src="${up}app-icon-192.png" alt="" width="36" height="36" />Squzo</a>
<a class="lang" href="${other}" hreflang="${lang === 'en' ? 'lt' : 'en'}" lang="${lang === 'en' ? 'lt' : 'en'}">${c.switchLang}</a>
</header>
<main>
<section class="hero">
<h1>${esc(c.h1)}</h1>
<p class="lead">${esc(c.lead)}</p>
<a class="cta" href="${appUrl}?source=landing-${lang}">${esc(c.cta)}</a>
<p class="small">${esc(c.ctaSub)}</p>
</section>
<section class="grid">
${c.features.map(([e, h, p]) => `<article class="card"><div class="emoji" aria-hidden="true">${e}</div><h3>${esc(h)}</h3><p>${esc(p)}</p></article>`).join('\n')}
</section>
<section><h2>${esc(c.howTitle)}</h2><ol>${c.how.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></section>
<section><h2>${esc(c.privacyTitle)}</h2><p>${esc(c.privacy)}</p></section>
<section><h2>${esc(c.faqTitle)}</h2>
${c.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
</section>
<p class="end"><a class="cta" href="${appUrl}?source=landing-${lang}">${esc(c.cta)}</a></p>
</main>
<footer>© ${new Date().getUTCFullYear()} ${esc(c.footer)}</footer>
</div>
</body>
</html>
`;
}

export function robotsTxt(appUrl: string): string {
  return `User-agent: *\nAllow: /\nSitemap: ${appUrl}sitemap.xml\n`;
}

export function sitemapXml(appUrl: string): string {
  const urls = [appUrl, `${appUrl}${landingPath('en')}`, `${appUrl}${landingPath('lt')}`];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
}
