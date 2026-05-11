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
