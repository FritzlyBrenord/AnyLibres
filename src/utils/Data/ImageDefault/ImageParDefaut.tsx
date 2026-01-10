// ==================== utils/getDefaultServiceImage.js ====================

/**
 * Images par défaut par sous-catégorie
 */
const DEFAULT_IMAGES_BY_SUBCATEGORY = {
  // Programmation et Tech
  "dev-web-frontend":
    "https://images.unsplash.com/photo-1593720219276-0b1eacd0aef4?w=800&h=600&fit=crop",
  "dev-web-backend":
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop",
  "dev-web-fullstack":
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop",
  "dev-wordpress":
    "https://images.unsplash.com/photo-1504542167506-4139c1ba3e14?w=800&h=600&fit=crop",
  "dev-ecommerce":
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
  "dev-mobile":
    "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop",

  // Design Graphique
  "logo-design":
    "https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?w=800&h=600&fit=crop",
  "brand-identity":
    "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
  "web-design":
    "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&h=600&fit=crop",
  "uiux-design":
    "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=800&h=600&fit=crop",
  illustration:
    "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&h=600&fit=crop",
  "packaging-design":
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
  "motion-graphics":
    "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=600&fit=crop",

  // Rédaction et Traduction
  "content-writing":
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=600&fit=crop",
  copywriting:
    "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&h=600&fit=crop",
  "technical-writing":
    "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&h=600&fit=crop",
  translation:
    "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=600&fit=crop",
  "blog-writing":
    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=600&fit=crop",
  "seo-writing":
    "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&h=600&fit=crop",
  ghostwriting:
    "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=800&h=600&fit=crop",

  // Audiovisuel
  "video-editing":
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=600&fit=crop",
  "audio-production":
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=600&fit=crop",
  animation:
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop",
  photography:
    "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=600&fit=crop",
  "voice-over":
    "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&h=600&fit=crop",
  "music-production":
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=600&fit=crop",
  "sound-design":
    "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=800&h=600&fit=crop",

  // Marketing Digital
  "affiliate-marketing":
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
  "email-marketing":
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop",
  seo: "https://images.unsplash.com/photo-1571721795195-a2ca0ff06e0f?w=800&h=600&fit=crop",
  "social-media-marketing":
    "https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=800&h=600&fit=crop",
  "content-marketing":
    "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=600&fit=crop",
  "ppc-advertising":
    "https://images.unsplash.com/photo-1557838923-2985c318be48?w=800&h=600&fit=crop",
  "marketing-strategy":
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",

  // Consultation
  "business-consulting":
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop",
  "hr-consulting":
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=600&fit=crop",
  "financial-consulting":
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop",
  "it-consulting":
    "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop",
  "marketing-consulting":
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop",
  "strategy-consulting":
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=600&fit=crop",
};

/**
 * Images par défaut par catégorie (fallback si sous-catégorie introuvable)
 */
const DEFAULT_IMAGES_BY_CATEGORY = {
  "programmation-tech":
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop",
  "design-graphique":
    "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
  "redaction-traduction":
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=600&fit=crop",
  audiovisuel:
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=600&fit=crop",
  "marketing-digital":
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
  consultation:
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop",
};

/**
 * Image par défaut générique (fallback final)
 */
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop";

/**
 * Récupère l'image par défaut pour un service
 * @param {string} category - La catégorie du service
 * @param {string} subcategory - La sous-catégorie du service
 * @returns {string} URL de l'image par défaut
 */
export const getDefaultServiceImage = (category: any, subcategory: any) => {
  // Priorité 1: Image spécifique à la sous-catégorie
  if (
    subcategory &&
    DEFAULT_IMAGES_BY_SUBCATEGORY[
      subcategory as keyof typeof DEFAULT_IMAGES_BY_SUBCATEGORY
    ]
  ) {
    return DEFAULT_IMAGES_BY_SUBCATEGORY[
      subcategory as keyof typeof DEFAULT_IMAGES_BY_SUBCATEGORY
    ];
  }

  // Priorité 2: Image de la catégorie
  if (
    category &&
    DEFAULT_IMAGES_BY_CATEGORY[
      category as keyof typeof DEFAULT_IMAGES_BY_CATEGORY
    ]
  ) {
    return DEFAULT_IMAGES_BY_CATEGORY[
      category as keyof typeof DEFAULT_IMAGES_BY_CATEGORY
    ];
  }

  // Priorité 3: Image par défaut générique
  return DEFAULT_IMAGE;
};

export default getDefaultServiceImage;
