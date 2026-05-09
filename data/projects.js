// Replace image and video paths with final compressed media as the portfolio grows.
const projects = [
  {
    title: "Du Cho Tan The",
    slug: "du-cho-tan-the",
    category: "music-video",
    categoryLabel: "Music Video",
    client: "ERIK",
    scope: "VFX, CGI, Compositing",
    thumbnail: "/assets/videos/project/AddLightToLight_video1.jpg",
    image: "/assets/videos/project/AddLightToLight_video1.jpg",
    video: "/assets/videos/project/AddLightToLight_video1.webm",
    gallery: [
      "/assets/videos/project/AddLightToLight_video1.jpg"
    ],
    year: "2025",
    featured: true,
    order: 1
  },
  {
    title: "VIB Privilege",
    slug: "vib-privilege",
    category: "commercial",
    categoryLabel: "Commercial",
    client: "VIB",
    scope: "CGI, Glass Staircase, Compositing",
    thumbnail: "/assets/videos/project/CayDenThan_HoNgocHa_Full_00929.jpg",
    image: "/assets/videos/project/CayDenThan_HoNgocHa_Full_00929.jpg",
    video: "/assets/videos/project/Vietjet_Full.webm",
    gallery: [
      "/assets/videos/project/CayDenThan_HoNgocHa_Full_00929.jpg"
    ],
    year: "2025",
    featured: true,
    order: 2
  },
  {
    title: "The Opus",
    slug: "the-opus",
    category: "film",
    categoryLabel: "Film",
    client: "The Opus",
    scope: "Cinematic CGI, Environment, Compositing",
    thumbnail: "/assets/videos/project/EggGuy_VideoFull.jpg",
    image: "/assets/videos/project/EggGuy_VideoFull.jpg",
    video: "/assets/videos/project/EggGuy_VideoFull.webm",
    gallery: [
      "/assets/videos/project/EggGuy_VideoFull.jpg"
    ],
    year: "2025",
    featured: false,
    order: 3
  },
  {
    title: "Samsung 2025",
    slug: "samsung-2025",
    category: "commercial",
    categoryLabel: "Commercial",
    client: "Samsung",
    scope: "Compositing, Cleanup, Finishing",
    thumbnail: "/assets/videos/project/BE_video1.jpg",
    image: "/assets/videos/project/BE_video1.jpg",
    video: "/assets/videos/project/Samsung2025_video3.webm",
    gallery: [
      "/assets/videos/project/BE_video1.jpg"
    ],
    year: "2025",
    featured: true,
    order: 4
  },
  {
    title: "Canh Chim Phuong Hoang",
    slug: "canh-chim-phuong-hoang",
    category: "film",
    categoryLabel: "Film",
    client: "Confidential",
    scope: "Environment, Compositing, FX",
    thumbnail: "/assets/videos/project/CanhCHimPhuongHoang_BreakDown_Full.jpg",
    image: "/assets/videos/project/CanhCHimPhuongHoang_BreakDown_Full.jpg",
    video: "/assets/videos/project/CanhCHimPhuongHoang_BreakDown_Full.webm",
    gallery: [
      "/assets/videos/project/CanhCHimPhuongHoang_BreakDown_Full.jpg"
    ],
    year: "2025",
    featured: true,
    order: 5
  },
  {
    title: "Made In Viet Nam",
    slug: "made-in-viet-nam",
    category: "music-video",
    categoryLabel: "Music Video",
    client: "Various Artists",
    scope: "Cleanup, VFX, Final Composite",
    thumbnail: "/assets/videos/project/KhongRaGi_video2.jpg",
    image: "/assets/videos/project/KhongRaGi_video2.jpg",
    video: "/assets/videos/project/MadeInVietNam_Full.webm",
    gallery: [
      "/assets/videos/project/KhongRaGi_video2.jpg"
    ],
    year: "2025",
    featured: true,
    order: 6
  },
  {
    title: "KIXX",
    slug: "kixx",
    category: "commercial",
    categoryLabel: "Commercial",
    client: "KIXX",
    scope: "CGI Production, Motion Design",
    thumbnail: "/assets/videos/project/ThaiChieuTai_video2.jpg",
    image: "/assets/videos/project/ThaiChieuTai_video2.jpg",
    video: "/assets/videos/project/KIXX_video1.webm",
    gallery: [
      "/assets/videos/project/ThaiChieuTai_video2.jpg"
    ],
    year: "2025",
    featured: false,
    order: 7
  },
  {
    title: "Over",
    slug: "over",
    category: "music-video",
    categoryLabel: "Music Video",
    client: "Khoi Vu",
    scope: "VFX, Compositing, Look Development",
    thumbnail: "/assets/videos/project/Over_KhoiVu_Full.jpg",
    image: "/assets/videos/project/Over_KhoiVu_Full.jpg",
    video: "/assets/videos/project/Over_KhoiVu_Full.webm",
    gallery: [
      "/assets/videos/project/Over_KhoiVu_Full.jpg"
    ],
    year: "2025",
    featured: true,
    order: 8
  },
  {
    title: "Hoa Xuan Ca",
    slug: "hoa-xuan-ca",
    category: "music-video",
    categoryLabel: "Music Video",
    client: "Confidential",
    scope: "Cleanup, Beauty, Compositing",
    thumbnail: "/assets/videos/project/HoaXuanCa_video4.jpg",
    image: "/assets/videos/project/HoaXuanCa_video4.jpg",
    video: "/assets/videos/project/HoaXuanCa_video4.webm",
    gallery: [
      "/assets/videos/project/HoaXuanCa_video4.jpg"
    ],
    year: "2025",
    featured: false,
    order: 9
  },
  {
    title: "Be Trap",
    slug: "be-trap",
    category: "music-video",
    categoryLabel: "Music Video",
    client: "Confidential",
    scope: "Compositing, Cleanup, Finishing",
    thumbnail: "/assets/videos/project/BeTrap_video4.jpg",
    image: "/assets/videos/project/BeTrap_video4.jpg",
    video: "/assets/videos/project/BeTrap_video4.webm",
    gallery: [
      "/assets/videos/project/BeTrap_video4.jpg"
    ],
    year: "2025",
    featured: false,
    order: 10
  },
  {
    title: "BE",
    slug: "be",
    category: "commercial",
    categoryLabel: "Commercial",
    client: "BE",
    scope: "CGI, Compositing, Motion",
    thumbnail: "/assets/videos/project/BE_video1.jpg",
    image: "/assets/videos/project/BE_video1.jpg",
    video: "/assets/videos/project/BE_video1.webm",
    gallery: [
      "/assets/videos/project/BE_video1.jpg"
    ],
    year: "2025",
    featured: false,
    order: 11
  },
  {
    title: "Thai Chieu Tai",
    slug: "thai-chieu-tai",
    category: "film",
    categoryLabel: "Film",
    client: "Confidential",
    scope: "Cleanup, Environment, Compositing",
    thumbnail: "/assets/videos/project/ThaiChieuTai_video2.jpg",
    image: "/assets/videos/project/ThaiChieuTai_video2.jpg",
    video: "/assets/videos/project/ThaiChieuTai_video2.webm",
    gallery: [
      "/assets/videos/project/ThaiChieuTai_video2.jpg"
    ],
    year: "2025",
    featured: false,
    order: 12
  },
  {
    title: "Large Format Study",
    slug: "large-format-study",
    category: "billboard",
    categoryLabel: "Billboard",
    client: "Zodiac II Media",
    scope: "OOH, LED, Large-Format Visuals",
    thumbnail: "/assets/videos/project/EggGuy_VideoFull.jpg",
    image: "/assets/videos/project/EggGuy_VideoFull.jpg",
    video: "/assets/videos/project/EggGuy_VideoFull.webm",
    gallery: [
      "/assets/videos/project/EggGuy_VideoFull.jpg"
    ],
    year: "2025",
    featured: false,
    order: 13
  }
];

const getProjectOrder = (project) =>
  Number.isFinite(project.order) ? project.order : Number.POSITIVE_INFINITY;

window.projects = projects
  .map((project, index) => ({ project, index }))
  .sort((a, b) => getProjectOrder(a.project) - getProjectOrder(b.project) || a.index - b.index)
  .map(({ project }) => project);
