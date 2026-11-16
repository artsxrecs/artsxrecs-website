// ArtsxRecs — renders the roster, profiles, news and events from the files in data/.
// The client edits those files in Pages CMS (app.pagescms.org; the editor is set up in .pages.yml).
(async () => {
  const DRAFT = true; // draft shows "coming soon" placeholders for missing texts
  const page = document.body.dataset.page;

  // ---- data: each page loads only the files it shows
  const NEEDS = {
    home: ['artists', 'home-news'],
    artists: ['artists'],
    artist: ['artists', 'events'],
    events: ['artists', 'events'],
    news: ['artists', 'news'],
  };
  const data = {};
  try {
    await Promise.all(
      (NEEDS[page] || []).map(async (name) => {
        const res = await fetch(`data/${name}.json`);
        if (!res.ok) throw new Error(`data/${name}.json: ${res.status}`);
        data[name] = await res.json();
      })
    );
  } catch (err) {
    console.error(err);
  }

  // Names compared the way people type them: no accents, any case, "The" ignored (TÄRA = Tara, The Roots = Roots).
  const plain = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const sortName = (name) => plain(name).replace(/^the\s+/, '');
  const slugify = (name) => plain(name).replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // Artists A–Z (ignoring "The"), so a new artist lands in the right place wherever the editor adds it.
  // An artist without a web name (slug) gets one made from the name.
  // Each file holds one list under a name ({ "artists": [...] }), so the editor can fold the entries away.
  const listOf = (d, key) => (Array.isArray(d) ? d : (d && d[key]) || []);
  const ARTISTS = listOf(data.artists, 'artists')
    .filter((a) => a && a.name)
    .map((a) => ({ ...a, slug: a.slug || slugify(a.name), links: a.links || {} }))
    .sort((x, y) => (sortName(x.name) < sortName(y.name) ? -1 : sortName(x.name) > sortName(y.name) ? 1 : 0));
  const bySlug = (slug) => ARTISTS.find((a) => a.slug === slug);
  // Events and news name their artist as the editor typed it (usually the name): find that artist's slug.
  // Anything that matches no artist is kept as typed and shown without a link.
  const withArtist = (item) => {
    const a = item.artist ? bySlug(item.artist) || ARTISTS.find((x) => sortName(x.name) === sortName(item.artist)) : null;
    return { ...item, artist: a ? a.slug : item.artist || '' };
  };
  const EVENTS = listOf(data.events, 'events')
    .filter((e) => e && e.date)
    .map(withArtist)
    .sort((a, b) => a.date.localeCompare(b.date));
  const NEWS = listOf(data.news, 'news').filter((s) => s && s.title).map(withArtist);
  const homeNews = data['home-news'] || {};
  const HOME_NEWS = { recent: (homeNews.recent || []).map(withArtist), past: (homeNews.past || []).map(withArtist) };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Photos: the editor stores a path ("/assets/img/artists/x.jpg"); older entries a bare file name.
  const imgPath = (p, dir) => (String(p).includes('/') ? String(p).replace(/^\/+/, '') : `assets/img/${dir}/${p}`);
  // The small copy of an artist photo (for rows and cards); new uploads have none yet, so <img> falls back to the full one.
  const smallImg = (p) => {
    const full = imgPath(p, 'artists');
    const small = full.replace(/^(assets\/img\/artists\/)(?!small\/)([^/]+)$/, '$1small/$2');
    return `src="${esc(small)}"${small === full ? '' : ` onerror="this.onerror=null;this.src='${esc(full)}'"`}`;
  };
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const fmtDate = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`;
  };
  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const isUpcoming = (e) => e.date >= today;

  const initials = (name) => {
    const words = name.replace(/^The\s+/i, '').replace(/&/g, ' ').split(/[\s-]+/).filter(Boolean);
    return (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)).toUpperCase();
  };
  // Stable tone per artist so the placeholder grid has rhythm, not a pattern.
  const TONES = ['var(--main-deep)', '#dcdbd0', '#d2d1c5']; // shades of their Soft Ivory
  const tone = (slug) => TONES[[...String(slug || '')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % TONES.length];

  // Photos fill their frames (client, like mindfeederz.com); crops lose the bottom, not the top (CSS),
  // and "focus" moves the crop where someone stands off-centre.
  const media = (a, eager) =>
    `<div class="tile-media" style="--tone:${tone(a.slug)}">${
      a.photo
        ? `<img src="${esc(imgPath(a.photo, 'artists'))}" alt="${esc(a.name)}"${
            a.focus ? ` style="object-position:${esc(a.focus)}"` : ''
          } decoding="async" ${eager ? '' : 'loading="lazy"'}>`
        : `<span class="tile-initials" aria-hidden="true">${esc(initials(a.name))}</span>`
    }</div>`;

  // ---- nav state
  const navKey = page === 'artist' ? 'artists' : page;
  document.querySelectorAll('.nav a').forEach((a) => {
    if (a.dataset.nav === navKey) a.setAttribute('aria-current', 'page');
  });
  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  // ---- homepage alternatives to offer the client (draft only): ARTSXRECS and the waveform in the
  // centre, with the signature huge and faint behind them (?hero=name) or gone (?hero=bare)
  const heroAlt = new URLSearchParams(location.search).get('hero');
  if (heroAlt === 'name' || heroAlt === 'bare') document.documentElement.dataset.hero = heroAlt;

  // ---- header: clear at the top of Home and Events, a frosted bar once the page scrolls under it
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 8);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- tabs (shared by Artists and Events), state kept in the URL hash
  function tabs(root, keys, render) {
    const buttons = [...root.querySelectorAll('.tab')];
    const pick = (key) => {
      if (!keys.includes(key)) key = keys[0];
      buttons.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === key)));
      render(key);
    };
    buttons.forEach((b) =>
      b.addEventListener('click', () => {
        history.replaceState(null, '', '#' + b.dataset.tab);
        pick(b.dataset.tab);
      })
    );
    pick(location.hash.slice(1));
  }

  // ---- Artists
  if (page === 'artists') {
    const grid = document.getElementById('grid');
    const counts = { current: 0, past: 0 };
    ARTISTS.forEach((a) => counts[a.status]++);
    document.querySelectorAll('[data-count]').forEach((el) => (el.textContent = counts[el.dataset.count]));

    tabs(document.querySelector('.page-head'), ['current', 'past'], (key) => {
      grid.innerHTML = ARTISTS.filter((a) => a.status === key)
        .map(
          (a, i) => `
          <a class="tile reveal" style="--i:${Math.min(i, 12)}" href="artist.html?a=${a.slug}">
            ${media(a)}
            <div class="tile-name"><span>${esc(a.name)}</span></div>
            ${a.note ? `<span class="label">${esc(a.note)}</span>` : ''}
          </a>`
        )
        .join('');
    });
  }

  // ---- Artist profile
  if (page === 'artist') {
    const slug = new URLSearchParams(location.search).get('a');
    const a = bySlug(slug);
    const root = document.getElementById('profile');
    if (!a) {
      root.innerHTML = `<p class="label">Artist not found.</p><p><a class="text-link" href="artists.html">See all artists</a></p>`;
      return;
    }
    document.title = `${a.name} — ArtsxRecs`;

    const group = ARTISTS.filter((x) => x.status === a.status);
    const idx = group.indexOf(a);
    const prev = group[(idx - 1 + group.length) % group.length];
    const next = group[(idx + 1) % group.length];

    const LINKS = [
      ['spotify', 'Spotify'],
      ['appleMusic', 'Apple Music'],
      ['instagram', 'Instagram'],
      ['youtube', 'YouTube'],
    ];
    // Only links we have (an empty one would look broken). "Extra links" (e.g. a duo's two Instagrams,
    // "Instagram · Blu") sit next to the platform their label starts with; any others come last.
    const extras = (a.extraLinks || []).filter((x) => x && x.url);
    const placed = new Set();
    const items = [];
    LINKS.forEach(([k, label]) => {
      const v = a.links[k];
      if (Array.isArray(v)) v.forEach(([who, url]) => items.push([`${label} · ${who}`, url]));
      else if (v) items.push([label, v]);
      extras.forEach((x) => {
        if (!placed.has(x) && String(x.label || '').startsWith(label)) placed.add(x), items.push([x.label, x.url]);
      });
    });
    extras.forEach((x) => placed.has(x) || items.push([x.label || 'Website', x.url]));
    const links = items
      .map(([text, url]) => `<li><a class="caps text-link" href="${esc(url)}" target="_blank" rel="noopener">${esc(text)}</a></li>`)
      .join('');

    const upcoming = EVENTS.filter((e) => e.artist === a.slug && isUpcoming(e));

    root.innerHTML = `
      <a class="back label reveal" href="artists.html${a.status === 'past' ? '#past' : ''}">← All artists</a>
      <div class="profile-media reveal">${media(a, true)}</div>
      <div class="profile-info">
        <p class="label reveal" style="--i:1">${a.status === 'current' ? 'Current artist' : 'Past artist'}</p>
        <h1 class="display profile-name reveal" style="--i:2;--chars:${Math.max(...a.name.split(/\s+/).map((w) => [...w].length))}">${esc(a.name)}</h1>
        ${
          a.note
            ? `<p class="label profile-note reveal" style="--i:2">${
                a.noteLink ? `<a href="${esc(a.noteLink)}" target="_blank" rel="noopener">${esc(a.note)} ↗</a>` : esc(a.note)
              }</p>`
            : ''
        }
        ${a.managed ? `<p class="label profile-note reveal" style="--i:2">Management: ArtsxRecs</p>` : ''}
        <div class="profile-bio reveal" style="--i:3">${
          a.bio
            ? a.bio.split(/\n\s*\n/).map((para) => `<p>${esc(para.trim())}</p>`).join('')
            : `<p class="pending">Biography coming soon.</p>`
        }${
          a.collab
            ? `<p class="profile-collab">In collaboration with ${
                a.collabLink
                  ? `<a class="text-link" href="${esc(a.collabLink)}" target="_blank" rel="noopener">${esc(a.collab)}</a>`
                  : esc(a.collab)
              }</p>`
            : ''
        }</div>
        ${links ? `<div class="profile-section reveal" style="--i:4"><p class="label">Listen &amp; follow</p><ul class="links">${links}</ul></div>` : ''}
        ${
          upcoming.length
            ? `<div class="profile-section reveal" style="--i:5"><p class="label">Upcoming</p><ul class="events" style="margin-top:12px">${upcoming.map(eventRow).join('')}</ul></div>`
            : ''
        }
        <nav class="profile-pager" aria-label="More artists">
          <a href="artist.html?a=${prev.slug}"><span class="label">← Previous</span><span class="caps">${esc(prev.name)}</span></a>
          <a class="next" href="artist.html?a=${next.slug}"><span class="label">Next →</span><span class="caps">${esc(next.name)}</span></a>
        </nav>
        <div class="profile-sign" aria-hidden="true"></div>
      </div>`;
  }

  // ---- Events
  function eventRow(e) {
    const a = bySlug(e.artist);
    const name = a ? a.name : e.artist;
    return `
      <li class="event">
        <span class="event-date">${fmtDate(e.date)}</span>
        ${a ? `<a class="event-artist caps" href="artist.html?a=${a.slug}">${esc(name)}</a>` : `<span class="event-artist caps">${esc(name)}</span>`}
        <span class="event-place">${esc(e.city)}, ${esc(e.country)}</span>
        <span class="event-venue ${e.venue ? '' : 'pending'}">${e.venue ? esc(e.venue) : 'Venue to be announced'}</span>
        ${
          e.tickets
            ? `<a class="event-tickets caps" href="${esc(e.tickets)}" target="_blank" rel="noopener">${esc(e.ticketsLabel || 'Tickets')} <span class="arrow">→</span></a>`
            : `<span class="event-tickets caps pending">Tickets soon</span>`
        }
      </li>`;
  }

  // ---- Home: Recent News and Past News (news.js), then the band of artists
  if (page === 'home') {
    // The alternative hero shows the name on its own: a copy of the logo's ARTSXRECS lettering.
    const word = document.querySelector('.sig-word');
    const wave0 = document.querySelector('.hero-wave');
    if (document.documentElement.dataset.hero && word && wave0) {
      const name = document.createElement('div');
      name.className = 'hero-name';
      const svg = word.cloneNode(true);
      svg.removeAttribute('class');
      svg.removeAttribute('style');
      name.appendChild(svg);
      wave0.before(name);
    }

    // Recent News and Past News: compact cards, each linking to the artist.
    const HOME = HOME_NEWS;
    document.querySelectorAll('[data-home]').forEach((list) => {
      list.innerHTML = (HOME[list.dataset.home] || [])
        .map((story) => {
          const a = bySlug(story.artist);
          if (!a) return '';
          const href = `artist.html?a=${a.slug}`;
          return `
          <article class="news-card on-scroll">
            <a class="news-card-media" href="${href}" tabindex="-1" aria-hidden="true">${storyPhoto(story, a)}</a>
            <p class="label news-card-meta">${esc(story.meta)}</p>
            <h3 class="news-card-title">${esc(a.name)}</h3>
            <p class="news-card-text">${esc(story.text)}</p>
            ${story.tag ? `<p class="label news-tag">${esc(story.tag)}</p>` : ''}
            <a class="news-card-link caps" href="${href}">Explore artist <span class="arrow" aria-hidden="true">→</span></a>
          </article>`;
        })
        .join('');
    });

    // The waveform under the logo: bars shaped like a track (louder in the middle) with a playhead
    // running along them in CSS. Each pass the bars take a new shape, like the next track coming on.
    const wave = document.querySelector('.wave');
    if (wave) {
      const BARS = innerWidth < 720 ? 44 : 72;
      let seed = 1837;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const draw = () => {
        const bars = Array.from({ length: BARS }, (_, i) => {
          const shape = 0.35 + 0.65 * Math.sin((Math.PI * i) / (BARS - 1)) ** 0.6;
          return `<i style="--h:${Math.round((0.25 + 0.75 * rnd()) * shape * 100)}%;--d:${(-rnd() * 1.5).toFixed(2)}s"></i>`;
        }).join('');
        wave.querySelectorAll('.wave-bars').forEach((el) => (el.innerHTML = bars));
      };
      draw();
      wave.querySelector('.wave-played').addEventListener('animationiteration', draw);
    }

    // The band shows everyone else: the artists in the news above already have their own card.
    const inNews = new Set([...(HOME.recent || []), ...(HOME.past || [])].map((story) => story.artist));
    const band = document.querySelector('.band');
    if (band) artistRow(band, ARTISTS.filter((a) => a.status === 'current' && a.photo && !inNews.has(a.slug)));
  }

  // A story's photo: its own if it has one, else a partner's logo, else the artist's portrait (the
  // small version is plenty at this size), else a placeholder with the initials. The story's "focus"
  // can move the crop for its frame (Toshiki: less ceiling).
  function storyPhoto(story, a) {
    if (story.logo && !story.photo) return `<img class="story-logo" src="${esc(imgPath(story.logo, 'partners'))}" alt="" loading="lazy" decoding="async">`;
    if (story.photo) {
      return `<img src="${esc(imgPath(story.photo, 'news'))}" alt=""${
        story.focus ? ` style="object-position:${esc(story.focus)}"` : ''
      } loading="lazy" decoding="async">`;
    }
    if (a && a.photo) {
      const focus = story.focus || a.focus;
      return `<img ${smallImg(a.photo)} alt=""${
        focus ? ` style="object-position:${esc(focus)}"` : ''
      } loading="lazy" decoding="async">`;
    }
    return `<span class="tile-initials" aria-hidden="true">${esc(initials(story.title || (a ? a.name : '')))}</span>`;
  }

  // The band of artists: a straight row of portraits drifting slowly to the left, round and round
  // (client: straight frames, not the arch). The row holds the portraits twice, so the loop is seamless.
  function artistRow(el, people) {
    if (!people.length) return;
    const order = people.slice().sort(() => Math.random() - 0.5);
    const tile = (a) =>
      `<span class="row-tile"><img ${smallImg(a.photo)} alt=""${
        a.focus ? ` style="object-position:${esc(a.focus)}"` : ''
      } decoding="async"></span>`;
    const set = order.map(tile).join('');
    el.innerHTML = `<div class="row-track">${set}${set}</div>`;
    el.style.setProperty('--n', order.length);
    // Moves only while it's on screen.
    new IntersectionObserver(([entry]) => el.classList.toggle('is-paused', !entry.isIntersecting)).observe(el);
  }

  // ---- News page: newest first by date (client: chronological). The sort is stable, so stories on the
  // same day keep their order in news.js; a story without a date yet counts as the newest.
  if (page === 'news') {
    document.getElementById('news').innerHTML = NEWS
      .slice()
      .sort((x, y) => (y.date || '9999').localeCompare(x.date || '9999'))
      .map((story) => {
        const a = story.artist ? bySlug(story.artist) : null;
        const link = a
          ? `<a class="news-link caps" href="artist.html?a=${a.slug}">Explore artist <span class="arrow" aria-hidden="true">→</span></a>`
          : story.link
            ? `<a class="news-link caps" href="${esc(story.link)}" target="_blank" rel="noopener">Visit website <span class="arrow" aria-hidden="true">↗</span></a>`
            : '';
        return `
        <li class="news-item on-scroll">
          <div class="news-media" style="--tone:${tone(story.title)}">${storyPhoto(story, a)}</div>
          <div class="news-body">
            <p class="label news-date">${story.date ? fmtDate(story.date) : DRAFT ? 'Date to follow' : ''}</p>
            <h2 class="news-title">${esc(story.title)}</h2>
            <p class="news-text">${esc(story.text)}</p>
            ${link}
          </div>
        </li>`;
      })
      .join('');
  }

  // ---- "Email us" opens the visitor's mail app. A mailto link does nothing on a computer without one,
  // and the address isn't written out on the page, so it is also copied, with a short note.
  const note = document.querySelector('.contact-note');
  document.querySelectorAll('a[data-copy-email]').forEach((a) =>
    a.addEventListener('click', () => {
      const address = a.getAttribute('href').replace('mailto:', '');
      if (!navigator.clipboard || !note) return;
      navigator.clipboard
        .writeText(address)
        .then(() => {
          note.textContent = `${address} – copied`;
          clearTimeout(note.hideTimer);
          note.hideTimer = setTimeout(() => (note.textContent = ''), 5000);
        })
        .catch(() => {});
    })
  );

  // ---- sections further down the page rise in gently as they scroll into view
  const later = document.querySelectorAll('.on-scroll');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }),
      { rootMargin: '0px 0px -10% 0px' }
    );
    later.forEach((el) => io.observe(el));
  } else {
    later.forEach((el) => el.classList.add('is-in'));
  }

  if (page === 'events') {
    const list = document.getElementById('events');
    const upcoming = EVENTS.filter(isUpcoming);
    const past = EVENTS.filter((e) => !isUpcoming(e)).reverse();
    document.querySelector('[data-count="upcoming"]').textContent = upcoming.length;
    document.querySelector('[data-count="past"]').textContent = past.length;

    // Artist filter (client, 2026-11-09): a dropdown of the artists with upcoming dates, A–Z ignoring "The".
    // It belongs to the Upcoming tab and hides on Past, or when fewer than two artists have dates.
    // ?artist=<slug> keeps a filtered list shareable (e.g. one artist's tour).
    const filter = document.getElementById('event-filter');
    const select = document.getElementById('artist-filter');
    const nameOf = (slug) => (bySlug(slug) || { name: slug }).name;
    const sortKey = (slug) => nameOf(slug).replace(/^The\s+/i, '');
    const onTour = [...new Set(upcoming.map((e) => e.artist))].sort((a, b) =>
      sortKey(a).localeCompare(sortKey(b), 'en', { sensitivity: 'base' })
    );
    let chosen = new URLSearchParams(location.search).get('artist');
    if (!onTour.includes(chosen)) chosen = null;
    let tab = 'upcoming';

    select.replaceChildren(new Option('All artists', ''), ...onTour.map((slug) => new Option(nameOf(slug), slug)));

    const render = () => {
      const useFilter = tab === 'upcoming' && onTour.length > 1;
      filter.hidden = !useFilter;
      select.value = chosen || '';
      select.classList.toggle('is-set', !!chosen);
      let rows = tab === 'upcoming' ? upcoming : past;
      if (useFilter && chosen) rows = rows.filter((e) => e.artist === chosen);
      list.innerHTML = rows.length
        ? `<ul class="events">${rows.map(eventRow).join('')}</ul>`
        : `<p class="events-empty">${tab === 'upcoming' ? 'New dates will be announced here.' : 'Past events will be listed here.'}</p>`;
    };

    select.addEventListener('change', () => {
      chosen = select.value || null;
      const url = new URL(location.href);
      if (chosen) url.searchParams.set('artist', chosen);
      else url.searchParams.delete('artist');
      history.replaceState(null, '', url);
      render();
    });

    tabs(document.querySelector('.page-head'), ['upcoming', 'past'], (key) => {
      tab = key;
      render();
    });
  }
})();
