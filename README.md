# slom75.online — Shiva Lakshmanan's personal site

A six-page static website. Plain HTML, CSS and JavaScript: no framework, no build
step, no database, no tracking, and no calls to outside services.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Home: introduction, links to each section, game teaser |
| `about.html` | About: story, career path, projects, quick facts |
| `writing.html` | Writing: links out to Medium and LinkedIn |
| `lab.html` | Lab: three interest strands and the tower sketcher |
| `game.html` | Lights On, the puzzle game |
| `contact.html` | Contact: email link |
| `404.html` | Shown when someone follows a broken link |
| `css/style.css` | All styling. Colours and fonts are set at the top |
| `js/main.js` | Menu, skyline drawings, scroll effects, email link |
| `js/game.js` | The Lights On game |
| `js/lab.js` | The tower sketcher on the Lab page |
| `assets/` | Images, the link-preview image (`og.png`) and fonts |
| `favicon.svg` | The browser-tab icon |
| `CNAME` | Tells GitHub Pages the site lives at slom75.online |
| `.nojekyll` | Tells GitHub Pages to serve the files exactly as they are |
| `robots.txt`, `sitemap.xml` | Help search engines find the pages |

## Things to replace with your own

1. **Portrait** (About page). Save your photo as `assets/portrait.jpg` (a 4:5
   upright crop works best), then in `about.html` change `assets/portrait.svg`
   to `assets/portrait.jpg` and rewrite the `alt` text to describe the photo.
2. **Sample entries** (Lab page). Anything marked with a small "Sample" tag is
   a stand-in. Edit the text in `lab.html` and delete the line
   `<span class="tag">Sample</span>` above it.
3. **Sample photos** (Lab page). Replace `assets/photo-1.svg`, `photo-2.svg`
   and `photo-3.svg` with your own images (4:3 landscape works best) and update
   each `src`, `alt` and caption in `lab.html`.
4. **Featured articles** (Writing page). `writing.html` contains a ready-made,
   commented-out block for listing individual articles. Instructions are inside
   the comment.

## Editing text

Open any `.html` file in a text editor, change the words between the tags, and
save. The menu and footer are repeated in every page, so a change to the menu
has to be made in all seven `.html` files.

## Changing the look

Open `css/style.css`. The first block, `:root { ... }`, holds every colour and
font. For example, change `--cyan` to try a different accent colour.

## The game

- Twelve levels, set in `js/main.js` on the line starting `SL.LEVELS`. Each pair
  is `[columns, rows]`.
- Progress is saved in the visitor's own browser (localStorage, under the key
  `lightsOn.v1`). Nothing is sent anywhere.
- The messages shown after each tower are at the top of `js/game.js`
  (`WIN_LINES`).

## Fonts

Big Shoulders Display and Newsreader, both under the SIL Open Font License.
The licence texts are in `assets/fonts/`.

## Previewing on your own computer

Double-click `index.html`. Everything works straight from the folder.
