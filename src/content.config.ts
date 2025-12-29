import { defineCollection, z } from 'astro:content';

const siteCollection = defineCollection({
  type: 'data',
  schema: z.object({
    site: z.object({
      name: z.string(),
      tagline: z.string(),
      url: z.string(),
      email: z.string(),
      location: z.string(),
      telephone_display: z.string(),
      telephone_href: z.string(),
      linkedin: z.string()
    }),
    seo: z.object({
      home: z.object({
        title: z.string(),
        description: z.string(),
        path: z.string(),
        og_image: z.string()
      }),
      home_fr: z.object({
        path: z.string()
      }).optional(),
      projects_index: z.object({
        title: z.string(),
        description: z.string(),
        path: z.string(),
        og_image: z.string()
      }),
      project_detail: z.object({
        title_template: z.string(),
        description_template: z.string(),
        og_image: z.string()
      }),
      cv: z.object({
        title: z.string(),
        description: z.string(),
        path: z.string(),
        og_image: z.string()
      })
    }),
    navigation: z.array(z.object({
      id: z.string(),
      label: z.string()
    })),
    hero: z.object({
      eyebrow: z.string(),
      headline: z.string().optional(),
      headline_dynamic: z.object({
        prefix: z.string(),
        default: z.string()
      }).optional(),
      lead: z.string(),
      ctas: z.array(z.object({
        label: z.string(),
        href: z.string(),
        variant: z.string()
      })),
      bullets: z.array(z.string()),
      highlights: z.array(z.object({
        label: z.string(),
        value: z.string(),
        href: z.string().optional()
      }))
    }),
    skills: z.object({
      title: z.string(),
      intro: z.string(),
      categories: z.array(z.object({
        title: z.string(),
        description: z.string(),
        items: z.array(z.string())
      }))
    }),
    projects_section: z.object({
      title: z.string(),
      intro: z.string(),
      featured_ids: z.array(z.string()),
      view_all_label: z.string(),
      view_all_href: z.string()
    }),
    experience: z.object({
      title: z.string(),
      intro: z.string(),
      items: z.array(z.object({
        period: z.string(),
        location: z.string(),
        role: z.string(),
        company: z.string(),
        details: z.array(z.string())
      }))
    }),
    about: z.object({
      title: z.string(),
      tagline: z.string(),
      body: z.string(),
      stats: z.array(z.object({
        value: z.string(),
        label: z.string()
      }))
    }),
    cv_downloads: z.object({
      title: z.string(),
      intro: z.string(),
      buttons: z.array(z.object({
        label: z.string(),
        href: z.string(),
        download: z.boolean().optional()
      }))
    }),
    contact: z.object({
      title: z.string(),
      intro: z.string(),
      channels: z.array(z.object({
        label: z.string(),
        value: z.string(),
        href: z.string()
      })),
      form: z.object({
        title: z.string(),
        description: z.string(),
        mailto: z.string(),
        fields: z.array(z.object({
          id: z.string(),
          label: z.string(),
          type: z.string(),
          placeholder: z.string()
        })),
        privacy: z.string(),
        cta_label: z.string()
      })
    }),
    theme_switcher: z.object({
      label: z.string(),
      options: z.object({
        light: z.string(),
        dark: z.string(),
        system: z.string()
      }),
      descriptions: z.object({
        light: z.string(),
        dark: z.string(),
        system: z.string()
      })
    }),
    language_switcher: z.object({
      label: z.string(),
      options: z.object({
        en: z.string(),
        fr: z.string()
      })
    }),
    projects_page: z.object({
      title: z.string(),
      intro: z.string(),
      count_label: z.string(),
      view_home_label: z.string(),
      filter_group_labels: z.object({
        stack: z.string(),
        tag: z.string(),
        year: z.string()
      }),
      filter_defaults: z.object({
        stack: z.string(),
        tag: z.string(),
        year: z.string()
      }),
      status_messages: z.object({
        loading: z.string(),
        empty: z.string(),
        count: z.string(),
        filtered: z.string(),
        error: z.string()
      })
    }),
    project_detail: z.object({
      overview_label: z.string(),
      period_label: z.string(),
      role_label: z.string(),
      client_label: z.string(),
      stack_label: z.string(),
      highlights_label: z.string(),
      metrics_label: z.string(),
      cta_contact: z.string(),
      cta_projects: z.string(),
      error_message: z.string().optional(),
      loading_message: z.string().optional()
    }),
    cv_page: z.object({
      download_button: z.string(),
      summary: z.string(),
      sections: z.object({
        summary: z.string(),
        competencies: z.string(),
        experience: z.string(),
        education: z.string(),
        certifications: z.string(),
        languages: z.string(),
        tools: z.string()
      }),
      competencies: z.array(z.object({
        title: z.string(),
        body: z.string()
      })),
      experience: z.array(z.object({
        title: z.string(),
        period: z.string(),
        items: z.array(z.string())
      })),
      education: z.array(z.object({
        title: z.string(),
        subtitle: z.string()
      })),
      certifications: z.array(z.string()),
      languages: z.array(z.object({
        title: z.string(),
        level: z.string()
      })),
      tools: z.array(z.string())
    }),
    shared: z.object({
      skip_to_content: z.string(),
      back_to_top: z.string(),
      theme_status_light: z.string(),
      theme_status_dark: z.string(),
      theme_status_system: z.string(),
      reduce_motion: z.string().optional(),
      view_fr: z.string().optional()
    }),
    structured_data: z.object({
      person: z.object({
        "@context": z.literal("https://schema.org"),
        "@type": z.literal("Person"),
        name: z.string(),
        jobTitle: z.string(),
        url: z.string().url(),
        telephone: z.string(),
        email: z.string().email(),
        image: z.string().url(),
        sameAs: z.array(z.string().url()),
        worksFor: z.object({
          "@type": z.literal("Organization"),
          name: z.string()
        })
      }),
      website: z.object({
        "@context": z.literal("https://schema.org"),
        "@type": z.literal("WebSite"),
        name: z.string(),
        url: z.string().url()
      })
    })
  })
});

const projectsCollection = defineCollection({
  type: 'data',
  schema: z.array(z.object({
    id: z.string(),
    title_en: z.string(),
    title_fr: z.string(),
    summary_en: z.string(),
    summary_fr: z.string(),
    client_or_brand: z.string(),
    period: z.string(),
    role: z.string(),
    cover: z.string(),
    cover_alt_en: z.string(),
    cover_alt_fr: z.string(),
    stack: z.array(z.string()),
    tags: z.array(z.string()).optional(),
    highlights_en: z.array(z.string()),
    highlights_fr: z.array(z.string()),
    metrics_en: z.array(z.string()),
    metrics_fr: z.array(z.string()),
    gallery: z.array(z.string())
  }))
});

export const collections = {
  'site': siteCollection,
  'projects': projectsCollection,
};
