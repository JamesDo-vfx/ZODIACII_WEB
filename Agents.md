# AGENTS.md — Data Pipeline Rules (Zodiac II Web)

Mục tiêu file này:
- Chuẩn hóa cách vận hành 3 script `.bat` trong `data/scripts/`.
- Giữ đồng nhất dữ liệu khi cập nhật thêm project.
- Bảo toàn schema hiện có trong `data/projects.js` (không phá contract với frontend).

## 1) Pipeline chuẩn và thứ tự chạy

Luôn chạy theo đúng thứ tự:
1. `data/scripts/1__ApplyCsvToProjects.bat`
2. `data/scripts/2__SyncProjectImagesToProjects.bat`
3. `data/scripts/3__GenerateThumbnailsAndPreviewFromEmbedUrl.bat`

Ý nghĩa:
- Bước 1: CSV là nguồn dữ liệu gốc để regenerate `data/projects.js` + scaffold thư mục `project/<slug>/`.
- Bước 2: Đồng bộ đường dẫn ảnh/video local vào `thumbnail`, `gallery`, `previewVideo`.
- Bước 3: Tự động generate media từ `embedUrl` (YouTube/Vimeo/TikTok), sau đó cập nhật path vào `projects.js` nếu user xác nhận.

Không chạy bước 2/3 trước bước 1 khi CSV vừa thay đổi.

## 2) Contract schema bắt buộc của `window.projects`

Mỗi project object trong `data/projects.js` phải giữ đúng các key sau:
- `title` (string)
- `slug` (string)
- `category` (string)
- `categoryLabel` (string)
- `client` (string)
- `scope` (string)
- `description` (string)
- `credits` (string[])
- `awards` (string[])
- `awardTag` (string)
- `thumbnail` (string, web path bắt đầu bằng `/project/...` hoặc fallback `/project/placehole_image.jpg`)
- `previewVideo` (string, web path bắt đầu bằng `/project/...` hoặc fallback `/project/placehole_video.webm`)
- `embedUrl` (string)
- `gallery` (string[])
- `year` (string)
- `featured` (boolean)
- `order` (number)

Ràng buộc:
- Không đổi tên key.
- Không xóa key.
- Không đổi kiểu dữ liệu của key.
- Không tạo schema song song khác cho cùng dữ liệu project.

## 3) Category và slug rules

Category slug chuẩn:
- `commercial`
- `music-video`
- `film`
- `billboard`
- `tvshow`

Rule:
- Không dùng `all` làm category thật trong project data (`all` chỉ là virtual filter ở UI).
- `slug` phải lowercase, kebab-case, regex an toàn: `^[a-z0-9][a-z0-9-]*$`.
- Mỗi `slug` là duy nhất.
- Thư mục project phải khớp 1-1 với slug: `project/<slug>/`.

## 4) CSV contract (input cho bước 1)

CSV nên có các cột:
- `title`, `slug`, `category`, `client`, `scope`, `description`,
- `credits`, `awards`, `awardTag`,
- `thumbnail` hoặc `image`,
- `previewVideo`,
- `embedUrl` hoặc `video`,
- `gallery`,
- `year`, `featured`, `order`.

Quy ước parse:
- `credits`, `awards`, `gallery` dùng delimiter `|`.
- `featured`: chấp nhận `true/1/yes/y` => `true`, còn lại => `false`.
- `order`: parse int, nếu lỗi thì fallback theo thứ tự dòng.
- Ưu tiên UTF-8 cho CSV.

## 5) Media path rules

Chuẩn thư mục theo từng project:
- `project/<slug>/thumbnail/`
- `project/<slug>/previewVideo/`
- `project/<slug>/gallery/`

Chuẩn file output từ bước 3:
- Thumbnail: `project/<slug>/thumbnail/thumb.webp`
- Preview: `project/<slug>/previewVideo/preview.webm`

Fallback bắt buộc khi thiếu media:
- `thumbnail`: `/project/placehole_image.jpg`
- `previewVideo`: `/project/placehole_video.webm`

Mọi path lưu trong `projects.js` phải là web path dùng `/`, không dùng `\`.

## 6) Quy tắc an toàn khi cập nhật data

- Luôn để script tạo backup `.bak-*` trước khi ghi đè `data/projects.js`.
- Không chỉnh tay `data/projects.js` hàng loạt nếu dữ liệu nguồn là CSV.
- Nếu cần chỉnh tay 1 vài project, vẫn phải giữ nguyên contract schema và style wrapper:
  - `const projects = [...]`
  - `window.projects = projects ... sort by order ...`
- Không commit trạng thái nửa pipeline (ví dụ chỉ đổi CSV nhưng chưa sync media/path).

## 7) Chính sách orphan/mismatch

Khi bước 1 báo:
- `Missing folders`: slug có trong CSV nhưng chưa có thư mục project.
- `Orphan folders`: có thư mục project nhưng slug không còn trong CSV.

Rule:
- Chỉ chọn chế độ xóa orphan (`D`) khi đã xác nhận không còn dùng dữ liệu cũ.
- Mặc định an toàn: chạy với `Y` trước, review diff, rồi mới quyết định dọn orphan.

## 8) Pre-commit checklist cho data

Trước khi commit thay đổi dữ liệu:
1. Chạy đủ 3 bước pipeline (hoặc ghi rõ vì sao bỏ bước).
2. Kiểm tra `data/projects.js` còn đúng đủ key contract.
3. Kiểm tra `slug` unique, đúng chuẩn.
4. Kiểm tra `category` chỉ dùng bộ slug chuẩn.
5. Kiểm tra `thumbnail`, `previewVideo`, `gallery` path tồn tại hoặc fallback hợp lệ.
6. Mở nhanh trang `work/reel/project` để đảm bảo render không vỡ.

## 9) Tóm tắt trách nhiệm của 3 script

- `1__ApplyCsvToProjects.bat`: nguồn sự thật metadata (CSV -> JSON JS + scaffold project folder/page).
- `2__SyncProjectImagesToProjects.bat`: đồng bộ media local hiện có vào data paths.
- `3__GenerateThumbnailsAndPreviewFromEmbedUrl.bat`: tạo media tự động từ embed URL + patch path ngược lại vào data.

Nếu có xung đột dữ liệu giữa CSV và media scan:
- Ưu tiên chạy lại pipeline chuẩn theo thứ tự 1 -> 2 -> 3 để đưa data về trạng thái canonical.

---

## 10) Frontend performance & device compatibility rules

Mục tiêu:
- Website phải chạy mượt trên desktop Windows, MacBook Air/MacBook Pro, iPhone, iPad, Android và laptop cấu hình yếu.
- Trải nghiệm visual phải giữ tinh thần cinematic/premium giống bản Windows mạnh, nhưng được adaptive theo thiết bị để tránh giật, lag, nóng máy hoặc đứng trình duyệt.
- Không đánh đổi hiệu năng bằng cách ép tất cả thiết bị chạy cùng một lượng video, blur, filter, smooth-scroll và animation như desktop mạnh.

Nguyên tắc bắt buộc:
- Ưu tiên perceived experience giống nhau, không bắt buộc internal implementation giống nhau.
- Thiết bị yếu phải được nhận bản nhẹ hơn: ít autoplay hơn, ít blur hơn, ít filter animation hơn, native scroll nhiều hơn.
- Không thêm hiệu ứng mới nếu chưa đánh giá chi phí render trên MacBook Air và mobile.
- Mọi thay đổi animation/video/scroll phải có fallback cho `prefers-reduced-motion`.

## 11) Performance budget bắt buộc

Video:
- Hero video desktop: ưu tiên 1920x1080, H.264/WebM đã nén web, không dùng file master/render gốc.
- Hero video laptop yếu/mobile: ưu tiên 1280x720 hoặc poster/static fallback nếu cần.
- Project/reel preview video: ngắn 1–6 giây, file nhỏ, dùng `preload="metadata"`, không dùng `preload="auto"` cho grid/card preview.
- Mỗi viewport chỉ nên có tối đa 1 preview video tự play theo viewport. Trên desktop yếu, không autoplay theo viewport; chỉ play khi hover/focus.
- Video ngoài viewport hoặc khi không hover phải `pause()` và reset `currentTime = 0` nếu đó là preview loop.
- Mọi video phải có poster/thumbnail fallback.

Images:
- Ảnh dưới fold phải dùng `loading="lazy"` và `decoding="async"`.
- Ảnh hero/above-the-fold có thể `eager`, nhưng số lượng eager phải rất ít.
- Thumbnail nên dùng WebP/JPEG tối ưu, không dùng PNG lớn cho card nếu không cần alpha.
- Không đưa ảnh 4K/8K vào card/list view.

CSS effects:
- Không animate `filter`, `backdrop-filter`, `clip-path`, `mask-image`, `height`, `width`, `top`, `left` nếu không thật sự cần.
- Animation chính chỉ nên dùng `transform` và `opacity`.
- `filter: blur()` chỉ dùng rất hạn chế. Không dùng blur reveal hàng loạt cho nhiều element/card.
- `backdrop-filter` phải có mức blur nhẹ và fallback. Header blur nên giữ thấp, thường 4–8px.
- Overlay/modal có thể blur nhẹ, nhưng không blur toàn bộ page-shell ở mức cao trên laptop yếu.
- Không lạm dụng `will-change`; chỉ set cho phần tử đang animate thật sự và tránh đặt trên nhiều card cùng lúc.

Infinite animation:
- Marquee, award ticker, scroll cue, looping text chỉ được chạy khi cần.
- Trên laptop yếu/mobile hoặc `prefers-reduced-motion`, tắt hoặc giảm các animation infinite không quan trọng.
- Award ticker/card marquee không chạy mặc định trên toàn bộ grid; chỉ chạy khi hover/focus hoặc khi card đang active.

## 12) Adaptive performance mode

Khi chỉnh frontend, luôn cân nhắc tạo hoặc giữ một helper nhận diện thiết bị yếu.

Điều kiện gợi ý để bật performance mode:
- `prefers-reduced-motion: reduce`
- viewport width <= 1440px
- `navigator.hardwareConcurrency <= 8` nếu browser hỗ trợ
- `navigator.deviceMemory <= 8` nếu browser hỗ trợ
- touch/coarse pointer hoặc mobile viewport

Khi performance mode bật:
- Không khởi tạo smooth scroll custom như Lenis nếu không cần.
- Dùng native scroll thay vì requestAnimationFrame scroll loop.
- Không autoplay nhiều preview video.
- Reel/project preview chỉ play khi hover/focus hoặc chỉ 1 item active trên mobile.
- Giảm backdrop blur và bỏ page-wide blur.
- Tắt parallax/stacking animation quá nặng nếu gây lag.
- Không animate filter trên media.
- Giữ layout/content/brand feel gần giống bản desktop mạnh nhất có thể.

Ví dụ helper JS được khuyến nghị:

```js
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isLaptopOrBelow = window.matchMedia("(max-width: 1440px)").matches;
const isCoarsePointer = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
const lowCoreCount = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 8;
const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 8;
const isPerformanceMode = prefersReducedMotion || isLaptopOrBelow || isCoarsePointer || lowCoreCount || lowMemory;
```

## 13) Smooth scroll / Lenis rules

- Không mặc định bật Lenis cho mọi thiết bị.
- Không để `requestAnimationFrame` chạy vô hạn trên laptop yếu nếu native scroll đã đủ tốt.
- Lenis chỉ nên bật trên desktop mạnh, không bật khi `prefers-reduced-motion` hoặc performance mode.
- Khi modal/overlay/page transition mở, phải stop smooth scroll; khi đóng mới start lại.
- Nếu dùng Lenis cho scrollTo, phải có fallback native `scrollIntoView` hoặc `window.scrollTo`.

Rule gợi ý:
- Desktop mạnh: Lenis được phép bật.
- MacBook Air/laptop <= 1440px/mobile: ưu tiên native scroll.
- Timeline/horizontal section phải có nút `Continue`/`Skip` để người dùng không bị ép cuộn hết.

## 14) Horizontal timeline / sticky section UX rules

Với các section kiểu sticky, horizontal scroll, stacking section hoặc timeline:
- Không ép người dùng phải cuộn hết mới thoát section.
- Bắt buộc có nút bỏ qua như `Continue →`, `Skip Process →` hoặc tương đương.
- Nút skip phải scroll tới section kế tiếp bằng Lenis nếu có, hoặc native scroll fallback.
- Phải có progress/hint rõ ràng để người dùng biết đang ở đoạn nào.
- Trên mobile hoặc thiết bị yếu, cân nhắc chuyển horizontal interaction thành vertical static list.
- Không dùng sticky/horizontal animation quá dài nếu gây cảm giác mắc kẹt.

## 15) Media interaction rules cho Work/Reel cards

Project cards:
- Desktop: preview video chỉ play khi hover/focus.
- Mobile/touch: chỉ một preview video active trong viewport nếu cần; không play nhiều video cùng lúc.
- Khi mouseleave/focusout/out-of-viewport: pause và reset preview.

Reel cards:
- Không autoplay reel previews trên desktop yếu/laptop nếu gây lag.
- Nếu cần auto preview, chỉ cho một reel card active tại một thời điểm.
- Với performance mode, reel preview chỉ play khi hover/focus hoặc khi user chủ động click.

Modal/full player:
- Full reel/project video chỉ load khi modal/detail mở.
- Modal video có thể dùng `preload="auto"` chỉ khi user đã chủ động mở modal/player.
- Khi modal đóng phải remove `src`, clear children/source nếu cần, và gọi `load()` để giải phóng tài nguyên.

## 16) CSS performance rules

Bắt buộc tránh:
- `transition: filter ...` trên ảnh/video/card grid.
- `filter: blur(...)` cho reveal hàng loạt.
- `backdrop-filter` nhiều lớp chồng nhau.
- `will-change` trên hàng chục card cùng lúc.
- Animate layout properties như height/width/top/left trong scroll animation.

Khuyến nghị:
- Reveal dùng opacity + translateY.
- Hover card dùng transform scale nhẹ + opacity overlay.
- Giữ filter tĩnh nếu cần style, nhưng không animate filter.
- Dùng CSS media query cho thiết bị <= 1440px để giảm hiệu ứng.

Ví dụ CSS performance fallback:

```css
@media (max-width: 1440px), (prefers-reduced-motion: reduce) {
  .reveal {
    filter: none !important;
    transition-property: opacity, transform !important;
  }

  .project-frame img,
  .project-frame video,
  .reel-card__poster,
  .reel-card__video {
    transition-property: opacity, transform !important;
  }

  .work-overlay,
  .mobile-nav-overlay,
  .reel-modal__backdrop {
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }
}
```

## 17) Testing checklist cho mọi thiết bị

Trước khi merge hoặc deploy thay đổi UI/performance, phải test tối thiểu:

Desktop/laptop:
- Windows Chrome/Edge ở màn hình lớn.
- MacBook Air Safari hoặc Chrome.
- Màn hình khoảng 1366–1440px width.

Mobile/tablet:
- iPhone Safari.
- Android Chrome nếu có thể.
- iPad/tablet nếu layout có breakpoint riêng.

Checklist:
1. Trang không giật khi đứng yên.
2. Scroll không bị khựng, không đứng máy.
3. Header/menu vẫn đọc được và không gây blur quá nặng.
4. Work grid không autoplay nhiều video cùng lúc.
5. Reel section không autoplay nhiều video cùng lúc trên laptop yếu.
6. Modal mở/đóng không giữ video chạy ngầm.
7. Horizontal timeline có nút Continue/Skip.
8. `prefers-reduced-motion` hoạt động: giảm animation, không ép smooth-scroll.
9. Lighthouse/Performance hoặc DevTools Performance không báo long task liên tục khi idle.
10. Không phá visual chính trên Windows desktop mạnh.

## 18) Nguyên tắc khi giao task cho agent/code assistant

Khi agent chỉnh web/UI:
- Phải đọc `AGENTS.md` trước khi sửa.
- Nếu có `Design.md`, phải đọc thêm `Design.md` trước khi chỉnh layout/visual.
- Không được tối ưu bằng cách xóa bừa hiệu ứng làm mất tinh thần thiết kế.
- Mọi tối ưu phải là adaptive: máy mạnh giữ trải nghiệm đầy đủ, máy yếu nhận bản nhẹ hơn.
- Không refactor lớn nếu task chỉ yêu cầu performance fix nhỏ.
- Sau khi sửa phải liệt kê rõ file đã chỉnh, lý do chỉnh, và trade-off nếu có.
