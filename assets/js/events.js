// ArtsxRecs events. Sorted by date automatically; anything before today moves to "Past" on its own.
// artist: must match the artist's "slug" in artists.js so the row links to their profile.
// venue / tickets: leave "" until confirmed. ticketsLabel (optional): the button text instead of "Tickets", e.g. 'Waitlist'.
window.EVENTS = [
  {
    date: '2026-11-07',
    artist: 'oddisee',
    city: 'Washington, DC',
    country: 'United States',
    venue: '',
    tickets: '',
  },
  // Doha Film Festival (DFF Music) shows: ticket links from the client, 2026-11-09; date, time and venue as on those pages.
  {
    // Sun 22 Nov, 5:30 PM, with Intibint and Dana Salah.
    date: '2026-11-22',
    artist: 'tara',
    city: 'Doha',
    country: 'Qatar',
    venue: 'Geekdom, Lusail Boulevard',
    tickets: 'https://www.dohafilm.com/en/contents/e115dbe6-ba65-4700-aa78-8ad52d3a6eaf',
  },
  {
    // Tue 24 Nov, 5:30 PM, with Mishaal Tamer and Yuna. Was 22 Nov here until the ticket page showed the 24th.
    date: '2026-11-24',
    artist: 'elmiene',
    city: 'Doha',
    country: 'Qatar',
    venue: 'Geekdom, Lusail Boulevard',
    tickets: 'https://www.dohafilm.com/en/contents/c43ce106-0ef8-416d-86f2-abc3583b8a33',
  },
  // Toshiki Soejima European tour: ticket links from the client, 2026-11-09. London has two shows the same day.
  {
    date: '2026-11-28',
    artist: 'toshiki-soejima',
    city: 'London',
    country: 'United Kingdom',
    venue: 'The Jazz Cafe · Matinee',
    tickets: 'https://thejazzcafe.com/event/toshiki-soejima-matinee-show/',
  },
  {
    date: '2026-11-28',
    artist: 'toshiki-soejima',
    city: 'London',
    country: 'United Kingdom',
    venue: 'The Jazz Cafe · Evening, sold out',
    tickets: 'https://thejazzcafe.com/event/toshiki-soejima-evening-show/',
    ticketsLabel: 'Waitlist',
  },
  {
    // Also on Resident Advisor (https://ra.co/events/2513261); TixforGigs is the only seller with the discounted tickets.
    date: '2026-12-01',
    artist: 'toshiki-soejima',
    city: 'Berlin',
    country: 'Germany',
    venue: 'Gretchen',
    tickets: 'https://www.tixforgigs.com/Event/76108',
  },
  {
    date: '2026-12-02',
    artist: 'toshiki-soejima',
    city: 'Hamburg',
    country: 'Germany',
    venue: 'Bahnhof Pauli',
    tickets: 'https://www.eventim.de/en/event/toshiki-soejima-bahnhof-pauli-22012101/',
  },
  {
    // The venue's date (Fri 4 Dec); Toshiki's own tour page says 3 Dec. Venue page:
    // https://www.circolomagnolia.it/evento/toshiki-soejima-live-a-magnolia/
    date: '2026-12-04',
    artist: 'toshiki-soejima',
    city: 'Milan',
    country: 'Italy',
    venue: 'Circolo Magnolia, Segrate',
    tickets: 'https://link.dice.fm/D2d124fea3d3',
  },
  {
    date: '2026-12-06',
    artist: 'toshiki-soejima',
    city: 'Düsseldorf',
    country: 'Germany',
    venue: 'Ampere (Stahlwerk)',
    tickets: 'https://www.eventim.de/en/event/toshiki-soejima-ampere-22048117/',
  },
];
