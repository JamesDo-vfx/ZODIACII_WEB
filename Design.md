# designs.md — Zodiac II Media Unified Design System

## 1. Mục tiêu

File này dùng để giữ toàn bộ website **Zodiac II Media** đồng bộ với ngôn ngữ thiết kế hiện tại của `index.html`.

Tất cả các trang như:

- `index.html`
- `work.html?category=all`
- `work.html?category=film`
- `work.html?category=commercial`
- `work.html?category=music-video`
- `reel.html?category=...`
- `about.html`
- `contact.html`

phải dùng chung một ngôn ngữ thiết kế:

- Dark cinematic
- Editorial typography
- Fullscreen / large media surfaces
- Micro navigation
- Image/video-led layout
- Minimal UI
- Subtle motion
- Premium VFX studio feeling

Website không được nhìn như một template agency thông thường.  
Website phải giống một **cinematic VFX portfolio / showreel system**.

---

## 2. Design DNA chính

Tinh thần thiết kế cần giữ nhất quán:

```text
Dark cinematic.
Minimal interface.
Oversized type.
Tiny metadata.
Large video/image surfaces.
Editorial grid.
Quiet premium motion.
No decorative noise.
No SaaS feeling.
```

Trang `index.html` hiện là chuẩn tham chiếu chính.  
Các trang khác phải follow scale, spacing, màu sắc, motion, typography và media treatment của trang này.

---

## 3. Global CSS Tokens

Tất cả page phải dùng chung token hiện có trong `:root`.

Không tạo màu, spacing, font-size mới nếu không thật sự cần.

```css
:root {
  --color-black: #030303;
  --color-ink: #070707;
  --color-charcoal: #111111;
  --color-dark-gray: #1a1a1a;
  --color-line: rgba(255, 255, 255, 0.12);
  --color-text: #f2f2f2;
  --color-text-muted: rgba(242, 242, 242, 0.62);
  --color-text-faint: rgba(242, 242, 242, 0.34);

  --font-display: "Archivo", "Inter Tight", Arial, sans-serif;
  --font-body: "Inter", Arial, sans-serif;

  --space-xs: 8px;
  --space-sm: 16px;
  --space-md: 32px;
  --space-lg: 64px;
  --space-xl: 120px;

  --radius-sm: 4px;
  --radius-md: 10px;

  --duration-fast: 180ms;
  --duration-normal: 420ms;
  --duration-slow: 900ms;
  --ease-cinematic: cubic-bezier(0.16, 1, 0.3, 1);

  --text-micro: 10px;
  --text-small: 12px;
  --text-body: 16px;
  --text-medium: clamp(20px, 3vw, 42px);
  --text-large: clamp(48px, 10vw, 160px);
  --text-hero: clamp(64px, 12vw, 210px);

  --page-pad: clamp(18px, 1.2vw, 56px);
  --max-width: 1720px;
}
```

### Quy tắc

- Không dùng màu trắng thuần `#ffffff` tràn lan. Dùng `--color-text`.
- Không dùng đen khác nếu không cần. Dùng `--color-black` hoặc `--color-ink`.
- Không tạo spacing random. Dùng `--page-pad`, `--space-*`, hoặc `clamp()` theo hệ đã có.
- Không tạo easing mới. Dùng `--ease-cinematic`.

---

## 4. Page Shell

Tất cả page phải nằm trong cấu trúc chung:

```html
<body data-page="...">
  <div class="grain" aria-hidden="true"></div>

  <header class="site-header" data-header>
    ...
  </header>

  <main id="page" class="page-shell">
    ...
  </main>

  <footer class="site-footer">
    ...
  </footer>

  <script src="data/projects.js" defer></script>
  <script src="script.js" defer></script>
</body>
```

### Bắt buộc

- Luôn dùng `.page-shell`.
- Luôn có `.grain`.
- Luôn dùng `.site-header` trừ khi có lý do cực kỳ rõ ràng.
- Luôn dùng `.site-footer` hoặc một biến thể footer tối giản.
- Không tạo header/footer riêng biệt cho từng page.

---

## 5. Header System

Header hiện tại là chuẩn:

```html
<header class="site-header" data-header>
  <a class="brand-mark" href="index.html">Zodiac II Media</a>

  <div class="nav-timeline" aria-hidden="true">
    <span data-progress-segment></span>
    ...
  </div>

  <nav class="nav-links">
    <button type="button" data-work-trigger>Work</button>
    <a href="about.html">About</a>
    <a href="contact.html">Contact</a>
  </nav>
</header>
```

### Style bắt buộc

- Header fixed.
- Text rất nhỏ.
- Không dùng logo lớn.
- Không dùng button kiểu CTA.
- Không dùng navbar box lớn.
- `Work` luôn mở fullscreen overlay, không phải dropdown.
- `About` và `Contact` là link trực tiếp.
- Header có thể blur nhẹ khi scroll.

### Không được

- Không ẩn header trên `work.html`.
- Không làm header riêng cho page con.
- Không thêm background màu đậm che hết hero.
- Không biến header thành menu agency thông thường.

---

## 6. Work Overlay

`Work` là interaction quan trọng.

Khi bấm `Work`, hiện fullscreen overlay:

```text
All Work
Commercial
Music Video
Film
Billboard
```

### Bắt buộc

- Full viewport.
- Background page phía sau blur.
- Overlay có dark translucent wash.
- 5 dòng chữ rất lớn.
- Có nút `Back` nhỏ góc phải.
- ESC đóng overlay.
- Không phải dropdown.
- Không phải sidebar menu.

### Link chuẩn

```text
All Work      -> work.html?category=all
Commercial    -> work.html?category=commercial
Music Video   -> work.html?category=music-video
Film          -> work.html?category=film
Billboard     -> work.html?category=billboard
```

### Visual

- Text dùng `--font-display`.
- Cỡ chữ dùng `clamp(56px, 8vw, 150px)`.
- Hover vào một dòng thì dòng đó sáng hơn, các dòng khác mờ nhẹ.
- Motion blur-to-clear, translate nhẹ, không bounce.

---

## 7. Typography System

Typography là phần quan trọng nhất sau hình ảnh.

### Display type

Dùng cho:

- Hero title
- Page title
- Reel title
- Work category title
- Large statement
- Contact email
- Capability rows

Style:

```css
font-family: var(--font-display);
font-weight: 420-500;
line-height: 0.82 - 1.02;
letter-spacing: 0 hoặc -0.03em;
```

### Micro type

Dùng cho:

- Header
- Section kicker
- Reel label
- Project category
- Footer
- Metadata

Style:

```css
font-size: var(--text-micro);
text-transform: uppercase;
letter-spacing: 0.06em;
color: var(--color-text-muted);
```

### Body / subtitle

Dùng cho:

- Subtitle
- Intro paragraph
- About text nhỏ
- Reel description

Style:

```css
font-size: clamp(16px, 1.35vw, 24px);
line-height: 1.35;
color: var(--color-text-muted);
```

### Không được

- Không dùng quá nhiều font khác nhau.
- Không dùng font decorative.
- Không dùng font script.
- Không dùng typography quá corporate.
- Không dùng letter-spacing quá rộng cho headline lớn.

---

## 8. Section System

Tất cả section nội dung nên dùng `.section-pad`.

```css
.section-pad {
  position: relative;
  z-index: 2;
  padding: clamp(90px, 13vw, 210px) var(--page-pad);
  background: var(--color-black);
  border-top: 1px solid rgba(255,255,255,0.06);
}
```

### Quy tắc

- Section phải có khoảng thở lớn.
- Không nhồi quá nhiều nội dung vào một section.
- Không dùng background trắng.
- Không dùng card layout corporate.
- Section nên có `.section-kicker` nếu cần label nhỏ.
- Section heading dùng `.section-heading`.

---

## 9. Media Treatment

Media là trung tâm của website.

Tất cả ảnh/video phải dùng treatment giống index.

### Quy tắc media

```css
object-fit: cover;
filter: contrast(1.05 - 1.12) saturate(0.78 - 0.95) brightness(0.72 - 0.88);
```

### Overlay

Media card nên có overlay dạng:

```css
linear-gradient(0deg, rgba(0,0,0,0.56), transparent 42%)
linear-gradient(90deg, rgba(0,0,0,0.3), transparent 34%)
linear-gradient(180deg, rgba(0,0,0,0.1), transparent 30%)
```

### Hover

Khi hover:

- Image/video scale nhẹ `1.045`.
- Video preview fade in.
- Overlay tối hơn nhẹ.
- Text dịch lên 2–4px.
- Không bounce.
- Không zoom quá mạnh.
- Không blur quá mạnh.

---

## 10. Grain Texture

Tất cả page phải có grain rất nhẹ.

```html
<div class="grain" aria-hidden="true"></div>
```

Grain chỉ để tạo cảm giác film texture.  
Không được để grain quá rõ hoặc gây noise.

---

## 11. Motion Language

Motion phải giống index:

- Blur-to-clear reveal.
- Opacity fade.
- TranslateY nhẹ.
- Slow media drift.
- Hover preview video.
- Title slide animation ở reel cards.
- Không playful.

### Reveal chuẩn

```css
.reveal {
  opacity: 0;
  filter: blur(14px);
  transform: translateY(24px);
  transition:
    opacity var(--duration-slow) var(--ease-cinematic),
    filter var(--duration-slow) var(--ease-cinematic),
    transform var(--duration-slow) var(--ease-cinematic);
  transition-delay: var(--delay, 0ms);
}

.reveal.is-visible {
  opacity: 1;
  filter: blur(0);
  transform: translateY(0);
}
```

### Không được

- Không dùng bouncy animation.
- Không dùng animated gradient.
- Không dùng random parallax nặng.
- Không dùng cursor gimmick nếu chưa tối ưu.
- Không dùng transition quá nhanh kiểu web app.

---

## 12. Homepage / index.html

`index.html` là design source of truth.

Cấu trúc hiện tại cần được giữ:

```text
Hero / Master Showreel
Behind The Work
Featured Reels
Capabilities
About Preview
Contact Strip
Footer
```

### Hero

- Full viewport.
- Video background.
- Không cần text nếu visual đủ mạnh.
- Nếu có text, phải lớn và tối giản.

### Behind The Work

- Dùng `.large-statement`.
- Text lớn, editorial, cinematic.
- Không chia thành paragraph corporate nhỏ.

### Featured Reels

- Là section quan trọng.
- Không thay bằng project grid.
- Reels là entry point cấp cao.

### Capabilities

- Dạng large text rows.
- Không dùng icon cards.

### About Preview

- Dạng 2-column large text.
- Không viết dài.

### Contact

- Email lớn.
- Social nhỏ.
- Không form.

---

## 13. Featured Reels System

Featured Reels là một trong các module chính của design system.

### Layout chuẩn

```text
[ Music Video Reel - large ] [ Commercial Reel ]
[ Music Video Reel - large ] [ Film Reel       ]
[ Billboard Reel - wide across bottom           ]
```

Hiện tại dùng grid areas:

```css
.reel-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-areas:
    "music music commercial commercial"
    "music music film film"
    "billboard billboard billboard billboard";
}
```

### Card behavior

- Poster mặc định.
- Hover thì preview video chạy.
- Title có vertical slide one-time style.
- Click mở `reel.html?category=...`.

### Card text

- Label nhỏ uppercase.
- Title lớn vừa phải.
- Text nằm bottom-left.
- Không dùng CTA button trong card.

### Không được

- Không biến reel card thành service card.
- Không thêm mô tả dài trên card.
- Không dùng gradient màu.
- Không dùng icon.

---

## 14. Reel Page / reel.html

`reel.html` phải đồng bộ với homepage.

### Cấu trúc

```text
Header
Reel Hero
Large Video Player
Other Reels
Contact Strip
Footer
```

### Reel Hero

- Title rất lớn.
- Label nhỏ.
- Description ngắn.
- Padding top lớn giống hiện tại.
- Không cần hero image nếu video player đã mạnh.

### Video player

- 16:9.
- Full width trong `--max-width`.
- Background đen.
- Không dùng browser/mockup frame.
- Không dùng card shadow.

### Other Reels

- Chỉ là text links nhỏ.
- Không cần card phức tạp.

---

## 15. Work Page / work.html

`work.html?category=...` không được là archive 2-column đơn giản.

Nó phải là một landing page cinematic theo category, nhưng vẫn dùng chung design scale của index.

### Cấu trúc khuyến nghị

```text
Header
Work Category Hero
Category Intro
Editorial Project Grid
Contact Strip
Footer
```

### Quan trọng

Không ẩn header/footer/contact trên work page.

Nếu CSS có đoạn này thì phải bỏ:

```css
body[data-page="work"] .site-header,
body[data-page="work"] .site-footer,
body[data-page="work"] .contact-strip {
  display: none;
}
```

### Work Category Hero

Hero nên dùng project đầu tiên trong category làm media.

```html
<section class="work-category-hero">
  <div class="work-category-hero__media" data-category-media></div>
  <button class="work-category-hero__arrow work-category-hero__arrow--prev">‹</button>
  <button class="work-category-hero__arrow work-category-hero__arrow--next">›</button>
  <div class="work-category-hero__copy">
    <p data-category-hero-category>Commercial</p>
    <h1 data-category-title>Commercial</h1>
    <p data-category-hero-title>Selected Work</p>
  </div>
</section>
```

### Hero style

- Height khoảng `62vh - 78vh`.
- Full-width media.
- Overlay tối.
- Text nằm center hoặc lower-center.
- Arrows rất nhỏ/tối giản.
- Không carousel phức tạp nếu chưa cần.

### Category Intro

Sau hero có intro text center:

```text
Selected commercial, CGI, and VFX work by Zodiac II Media.
```

Style:

- Centered.
- Max-width 760–920px.
- Font display.
- Size `clamp(24px, 2.2vw, 42px)`.
- Padding generous.

### Editorial Project Grid

Không dùng grid đều 2 cột đơn giản.

Nên dùng asymmetric grid:

```text
[ Large Project        ] [ Wide Project         ]
[ Large Project        ] [ Standard Project     ]
[ Standard Project     ] [ Standard Project     ]
```

Có thể dùng class theo index:

```js
project-card--large
project-card--wide
project-card--standard
```

### Grid CSS gợi ý

```css
.project-grid--editorial {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: clamp(14px, 1.25vw, 24px);
  padding-inline: var(--page-pad);
}

.project-grid--editorial .project-card--large {
  grid-column: span 6;
  grid-row: span 2;
}

.project-grid--editorial .project-card--wide {
  grid-column: span 6;
}

.project-grid--editorial .project-card--standard {
  grid-column: span 6;
}

.project-card--large .project-frame {
  aspect-ratio: 4 / 5;
}

.project-card--wide .project-frame {
  aspect-ratio: 16 / 7;
}

.project-card--standard .project-frame {
  aspect-ratio: 16 / 9;
}
```

### Mobile

Trên mobile:

- Single column.
- All cards full width.
- Aspect ratio khoảng `16/10` hoặc `4/5`.
- Header vẫn hiện.
- Không phụ thuộc hover.

---

## 16. About Page

`about.html` phải đồng bộ với index.

### Cấu trúc

```text
Header
Page Hero / About Hero
Large About Statement
Stats Row
Contact Strip optional
Footer
```

### Page Hero

Dùng `.page-hero` và `.page-hero__media`.

- Full viewport hoặc near-full viewport.
- Video/image background.
- Overlay tối.
- Title lớn.
- Subtitle ngắn.

### About copy

- Dùng `.about-copy`.
- Dạng 2-column large text như index.
- Không viết dài kiểu corporate profile.

### Stats row

Giữ micro typography.

```text
Ho Chi Minh City, Vietnam
VFX / CGI Studio
Commercial / Music Video / Film / Billboard
2025 Showreel
```

---

## 17. Contact Page

`contact.html` phải là cinematic business card.

### Cấu trúc

```text
Header
Contact Strip
Contact Data
Footer
```

### Style

- Background đen.
- Email cực lớn.
- Phone/social nhỏ.
- Không form.
- Không map.
- Không card box.

### Email

Dùng `.contact-email`.

```css
font-size: clamp(44px, 9vw, 162px);
line-height: 0.92;
```

### Contact grid

Có thể dùng 2 cột trên desktop, 1 cột trên mobile.

---

## 18. Project Cards

Project cards phải đồng bộ với reel cards nhưng khác cấp độ.

### Cấu trúc

```html
<article class="project-card reveal">
  <a href="...">
    <figure class="project-frame">
      <img>
      <video>
      <figcaption class="project-info">
        <h3>Project Title</h3>
        <span class="project-category">Commercial</span>
      </figcaption>
    </figure>
  </a>
</article>
```

### Hover

- Image fade out.
- Video fade in.
- Scale nhẹ.
- Text lift nhẹ.
- Category vẫn nhỏ.
- Không thêm button “View Project” lớn.

### Title scale

Desktop:

```css
font-size: clamp(36px, 3.25vw, 66px);
```

Mobile:

```css
font-size: clamp(34px, 12vw, 64px);
```

### Không được

- Không làm project cards thành white cards.
- Không dùng border/shadow kiểu UI.
- Không dùng tag nhiều màu.
- Không thêm mô tả dài trong card.

---

## 19. Capability Rows

Capabilities phải là text row system, không phải service cards.

### Structure

```html
<button class="capability-row reveal">
  <span>VFX Supervision</span>
  <small>Planning shots from set through final delivery.</small>
</button>
```

### Style

- Border top/bottom thin.
- Title lớn.
- Description hiện nhẹ khi hover.
- Trên mobile description luôn hiện.

### Không được

- Không dùng icon grid.
- Không dùng cards.
- Không dùng màu accent mạnh.

---

## 20. Contact Strip

Contact strip có thể tái sử dụng ở nhiều page.

### Structure

```html
<section class="section-pad contact-strip">
  <p class="section-kicker reveal">Contact</p>
  <a class="contact-email reveal" href="mailto:contact@zodiacii.com">contact@zodiacii.com</a>
  <nav class="social-links reveal">
    ...
  </nav>
</section>
```

### Style

- Min-height khoảng `72vh`.
- Email là hero element.
- Social links nhỏ.
- Không form.

---

## 21. Footer

Footer phải rất nhỏ và tĩnh.

```html
<footer class="site-footer">
  <span>Zodiac II Media</span>
  <span>Ho Chi Minh City, Vietnam</span>
  <span>© 2026</span>
  <span data-local-time>Local Time --:--</span>
</footer>
```

### Không được

- Không thêm sitemap lớn.
- Không thêm nhiều columns.
- Không thêm newsletter form.
- Không thêm logo lớn.

---

## 22. Data-driven Rendering

Các page phải dùng data, không hardcode tràn lan.

### Projects

Dùng:

```js
window.projects
```

Cho:

- `work.html?category=...`
- selected project grid
- work category hero
- Featured Reels ở homepage, generated from project categories
- `reel.html?category=...`
- Other category reel links

### Không được

- Không copy/paste card HTML nhiều lần nếu đã có data.
- Không tạo data structure riêng không đồng bộ.
- Không đổi category slug tùy tiện.

---

## 23. Category Slugs

Dùng thống nhất:

```text
all
commercial
music-video
film
billboard
```

`all` là virtual category, không dùng làm project category thật.

Featured Reels are category-based and generated from `projects.js`. There is no separate `reels.js` data file.

---

## 24. Responsive Rules

### Desktop

- Max-width: `--max-width`.
- Page padding: `--page-pad`.
- Header 3 cột.
- Reel grid asymmetric.
- Work grid editorial.
- Contact email rất lớn.

### Tablet

- Header bỏ timeline nếu cần.
- Grid bắt đầu đơn giản hóa.
- Text vẫn lớn nhưng không tràn.

### Mobile

- Header 2 cột.
- Nav gap nhỏ.
- Reels single column.
- Projects single column.
- Footer single column.
- Contact email wrap được.
- Không phụ thuộc hover.

### Không được

- Không shrink typography quá nhỏ.
- Không biến layout mobile thành quá nhiều text nhỏ.
- Không bỏ media chính.

---

## 25. Accessibility

Dù cinematic, web vẫn phải accessible.

### Bắt buộc

- Semantic HTML.
- Proper heading hierarchy.
- Alt text cho image.
- Video có poster.
- ESC close overlay.
- Focus state rõ.
- Links có aria-label nếu cần.
- Không rely hoàn toàn vào hover.
- Respect `prefers-reduced-motion`.

### Focus style

```css
:focus-visible {
  outline: 1px solid rgba(255,255,255,0.82);
  outline-offset: 4px;
}
```

---

## 26. Performance

Website phải nhẹ và mượt.

### Bắt buộc

- Preview video `preload="metadata"`.
- Hero video compressed.
- Poster images optimized.
- Lazy load media dưới fold.
- Không autoplay nhiều video preview cùng lúc.
- Không dùng animation library nặng.
- Không animate width/height/top/left nếu có thể.
- Dùng transform/opacity/filter.

---

## 27. Do / Don't

### Do

- Dùng dark cinematic media.
- Dùng chữ lớn, label nhỏ.
- Dùng grid editorial.
- Dùng video preview trên hover.
- Dùng spacing lớn.
- Dùng motion nhẹ và chậm.
- Dùng cùng header/footer trên mọi page.
- Giữ `index.html` là source of truth.

### Don’t

- Không làm style riêng lẻ cho từng page.
- Không làm page con sáng hơn hoặc corporate hơn.
- Không dùng white sections.
- Không dùng colorful cards.
- Không dùng CTA button lớn.
- Không dùng icon service cards.
- Không dùng drop shadow nặng.
- Không dùng border radius lớn kiểu SaaS.
- Không ẩn header trên work page.
- Không biến Work thành dropdown.
- Không thay Featured Reels bằng project archive.

---

## 28. Checklist đồng bộ trước khi commit

Trước khi hoàn thành bất kỳ page nào, kiểm tra:

- Page có dùng `.site-header` giống index không?
- Page có dùng `.grain` không?
- Page có dùng `.page-shell` không?
- Page có dùng màu từ `:root` không?
- Page có dùng `--page-pad` không?
- Typography có cùng scale với index không?
- Media có overlay/filter giống index không?
- Hover có cùng feeling không?
- Motion có dùng `.reveal` không?
- Work overlay còn hoạt động không?
- Mobile có giữ premium feeling không?
- Page có nhìn như cùng một website với index không?

Nếu câu trả lời là “không” ở bất kỳ mục nào, cần chỉnh lại trước khi hoàn tất.

---

## 29. Final Design Standard

Tất cả trang phải nhìn như cùng thuộc một hệ thống:

```text
Zodiac II Media = cinematic dark VFX portfolio.
Large moving images.
Oversized editorial typography.
Tiny navigation and metadata.
Premium restraint.
No generic agency design.
```

`index.html` là chuẩn thị giác chính.  
Mọi trang khác phải kế thừa và mở rộng từ hệ này, không được phát triển thành style riêng.
