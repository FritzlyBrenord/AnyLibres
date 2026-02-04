// Service Creation Guidance Content
// All tooltips, examples, and best practices for the service creation form

/**
 * Get localized service guidance content
 * @param t Translation dictionary (provider namespace)
 */
export const getServiceGuidance = (t: any) => {
  const g = t?.serviceGuidance;

  if (!g) {
    return {
      title: { label: "", content: "", examples: [] },
      shortDescription: { label: "", content: "", examples: [] },
      description: { label: "", content: "", examples: [] },
      basePrice: { label: "", content: "", examples: [] },
      deliveryTime: { label: "", content: "", examples: [] },
      revisions: { label: "", content: "", examples: [] },
      categories: { label: "", content: "", examples: [] },
      tags: { label: "", content: "", examples: [] },
      requirements: { label: "", content: "", examples: [] },
      extras: { label: "", content: "", examples: [] },
      faq: { label: "", content: "", examples: [] },
      images: { label: "", content: "", examples: [] },
      location: { label: "", content: "", examples: [] },
    };
  }

  return {
    title: {
      label: g.title?.label || "",
      content: g.title?.content || "",
      examples: g.title?.examples || [],
    },


    shortDescription: {
      label: g.shortDescription?.label || "",
      content: g.shortDescription?.content || "",
      examples: g.shortDescription?.examples || [],
    },

    description: {
      label: g.description?.label || "",
      content: g.description?.content || "",
      examples: g.description?.examples || [],
    },

    basePrice: {
      label: g.basePrice?.label || "",
      content: g.basePrice?.content || "",
      examples: g.basePrice?.examples || [],
    },

    deliveryTime: {
      label: g.deliveryTime?.label || "",
      content: g.deliveryTime?.content || "",
      examples: g.deliveryTime?.examples || [],
    },

    revisions: {
      label: g.revisions?.label || "",
      content: g.revisions?.content || "",
      examples: g.revisions?.examples || [],
    },

    categories: {
      label: g.categories?.label || "",
      content: g.categories?.content || "",
      examples: g.categories?.examples || [],
    },

    tags: {
      label: g.tags?.label || "",
      content: g.tags?.content || "",
      examples: g.tags?.examples || [],
    },

    requirements: {
      label: g.requirements?.label || "",
      content: g.requirements?.content || "",
      examples: g.requirements?.examples || [],
    },

    extras: {
      label: g.extras?.label || "",
      content: g.extras?.content || "",
      examples: g.extras?.examples || [],
    },

    faq: {
      label: g.faq?.label || "",
      content: g.faq?.content || "",
      examples: g.faq?.examples || [],
    },

    images: {
      label: g.images?.label || "",
      content: g.images?.content || "",
      examples: g.images?.examples || [],
    },

    location: {
      label: g.location?.label || "",
      content: g.location?.content || "",
      examples: g.location?.examples || [],
    },
  };
};


