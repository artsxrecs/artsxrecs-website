// ArtsxRecs news (client's list 2026-10-27, dates 2026-10-28, changes 2026-10-29, 2026-11-01 and 2026-11-16).
//
// NEWS: the News page, shown newest first by date (client: chronological order); stories on the same
// day keep the order they have here. News starts from June 1, 2026.
//   artist: the artist's "slug" in artists.js. Their photo is used until the story has its own, and
//           the story links to their profile. Leave "" for partners without a profile.
//   title:  the headline (usually the artist's or partner's name)
//   text:   the short description
//   date:   publication date, "YYYY-MM-DD"
//   photo:  file inside assets/img/news/ ("" = the artist's photo, or a placeholder)
//   logo:   for partners: their logo inside assets/img/partners/, shown whole on a plain tile
//   link:   optional website for partners (opens in a new tab)
//   focus:  optional crop of the photo in this story (CSS object-position), e.g. "50% 50%" to show less
//           above the head; the artist's own "focus" is used otherwise
//
// HOME_NEWS: the cards on the homepage, in this order: "recent" (Recent News) and "past" (Past News).
//   meta: the small line above the name. tag: an optional mint label (Oddisee: his management).
window.NEWS = [
  { artist: 'hyphen-dash', title: 'Hyphen Dash', text: 'Confirmed for Nova Jazz Festival in Yverdon, Switzerland.', date: '2026-11-07', photo: '' },
  { artist: 'elmiene', title: 'Elmiene', text: 'Confirmed to perform at the Doha Film Festival.', date: '2026-11-04', photo: '' },
  { artist: 'tara', title: 'TÄRA', text: 'Confirmed to perform at the Doha Film Festival.', date: '2026-11-04', photo: '' },
  { artist: 'oddisee', title: 'Oddisee', text: 'Confirmed as a headliner in Washington, D.C., with another upcoming appearance at Adams Morgan PorchFest.', date: '2026-11-02', photo: '' },
  { artist: 'hyphen-dash', title: 'Hyphen Dash', text: 'Announcing their new EP, Dark Water.', date: '2026-10-23', photo: '' },
  { artist: 'toshiki-soejima', title: 'Toshiki Soejima', text: 'ArtsxRecs brings Toshiki Soejima on his first-ever European tour.', date: '2026-10-20', photo: '', focus: '50% 50%' },
  { artist: 'sara-chakarova', title: 'Sara Chakarova', text: 'Proud to welcome Sara Chakarova to the ArtsxRecs roster!', date: '2026-10-13', photo: '' },
  { artist: '', title: 'The Alchemist Asia Group', text: 'Following a long-standing relationship, ArtsxRecs and The Alchemist Asia Group officially join forces.', date: '2026-10-12', photo: '', logo: 'alchemist-asia.svg', link: 'https://alchemistasia.com' },
  { artist: 'tara', title: 'TÄRA', text: 'ESNS announces TÄRA for its 2027 festival.', date: '2026-10-12', photo: '' },
  { artist: 'izabalien', title: 'izabalien', text: 'Performing at the SoAlive Music Conference.', date: '2026-10-08', photo: '' },
  { artist: 'hyphen-dash', title: 'Hyphen Dash', text: 'Set to close their European tour in Warsaw at Jassmine on October 29.', date: '2026-10-07', photo: '' },
  { artist: 'hyphen-dash', title: 'Hyphen Dash', text: 'Awarded at Cologne Jazzweek.', date: '2026-09-30', photo: '' },
  { artist: 'hyphen-dash', title: 'Hyphen Dash', text: 'Kicking off their first European tour.', date: '2026-09-20', photo: '' },
  { artist: '', title: "ELLE & L's Festival", text: 'The festival kicks off in Berlin on August 27, featuring JARA and Gaidaa.', date: '2026-08-26', photo: '', logo: 'elle-and-ls.png' },
  { artist: 'the-alchemist', title: 'The Alchemist', text: 'Hip-hop icon The Alchemist comes to Oslo for an exclusive performance on August 28.', date: '2026-08-24', photo: '' },
  { artist: 'protoje', title: 'Protoje', text: 'Protoje headlines Uprising Festival in Slovakia, joined by hip-hop legends Masta Ace & Marco Polo.', date: '2026-08-24', photo: '' },
  { artist: 'oddisee', title: 'Oddisee & Good Compny', text: 'Oddisee & Good Compny wow the crowd at Electric Castle Festival in Romania.', date: '2026-07-25', photo: '' },
  { artist: 'gaidaa', title: 'Gaidaa', text: 'Gaidaa kicks off a mini European tour with stops in Frankfurt, Berlin and Warsaw.', date: '2026-07-24', photo: '' },
  { artist: 'the-roots', title: 'The Roots', text: 'The Roots leave hip-hop and jazz fans stunned with their first-ever headline performance in Poland.', date: '2026-07-10', photo: '' },
  { artist: 'oddisee', title: 'Oddisee & Good Compny', text: 'Oddisee & Good Compny head to Europe for a summer festival run.', date: '2026-06-20', photo: '' },
  { artist: 'toshiki-soejima', title: 'Toshiki Soejima', text: 'ArtsxRecs signs a long-term partnership to represent Toshiki Soejima across Europe.', date: '2026-06-20', photo: '', focus: '50% 50%' },
  { artist: '', title: 'ArtsxRecs x Stereofox', text: 'ArtsxRecs and Stereofox announce a new partnership spanning several areas of the music business.', date: '2026-06-10', photo: '', logo: 'stereofox.svg', link: 'https://stereofox.com' },
];

window.HOME_NEWS = {
  recent: [
    { artist: 'elmiene', meta: 'Doha Film Festival', text: 'Confirmed to perform at the Doha Film Festival.', photo: 'elmiene.jpg', focus: '35% 50%' },
    { artist: 'toshiki-soejima', meta: 'European tour', text: 'Japanese guitarist Toshiki Soejima kicks off his first-ever European tour this month, presented by ArtsxRecs.', photo: 'toshiki-soejima.jpg', focus: '35% 50%' },
    { artist: 'oddisee', meta: 'Washington, D.C. · Adams Morgan PorchFest', text: 'Confirmed as a headliner in Washington, D.C., with another upcoming appearance at Adams Morgan PorchFest.', tag: 'Management: ArtsxRecs', photo: 'oddisee.jpg', focus: '80% 50%' },
  ],
  past: [
    { artist: 'the-roots', meta: 'Warsaw · July 2026', text: 'Legendary hip-hop band The Roots leave hip-hop and jazz enthusiasts stunned with their first-ever headline performance in Poland, taking the stage in Warsaw on July 7, 2026.', photo: 'the-roots.jpg', focus: '35% 50%' },
    { artist: 'the-alchemist', meta: 'Oslo · August 2026', text: 'Hip-hop icon and legendary producer The Alchemist delivers an exclusive performance in Oslo, Norway, on August 28, 2026, at Dattera til Hagen.', photo: 'the-alchemist.jpg', focus: '80% 50%' },
    { artist: 'freddie-gibbs', meta: 'European tours', text: 'Grammy-nominated rapper Freddie Gibbs brought his signature sound to audiences across Europe through a series of live performances and tours.', photo: 'freddie-gibbs.jpg', focus: '40% 50%' },
  ],
};
