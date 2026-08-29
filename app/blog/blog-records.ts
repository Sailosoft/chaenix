export type BlogRecord = {
  id: string;
  title: string;
  excerpt: string;
  category: "Operations" | "Growth" | "Product" | "Culture";
  author: string;
  publishedAt: string;
  readMinutes: number;
};

export const blogRecords: {
  hero: {
    badge: string;
    title: string;
    description: string;
  };
  records: BlogRecord[];
} = {
  hero: {
    badge: "Chaeni Journal",
    title: "Stories from the floor, the counter, and the control deck.",
    description:
      "A practical stream of ideas for operators and teams building faster, calmer cafe workflows.",
  },
  records: [
    {
      id: "ops-shift-handoff-checklist",
      title: "A 7-minute shift handoff that reduces service misses",
      excerpt:
        "Use one shared handoff ritual to align inventory, machine status, and role assignments before peak demand.",
      category: "Operations",
      author: "Mia Torres",
      publishedAt: "2026-08-04",
      readMinutes: 6,
    },
    {
      id: "growth-morning-rush-design",
      title: "Designing your morning rush around queue physics",
      excerpt:
        "Small lane adjustments and prep sequencing can cut visible wait times without adding headcount.",
      category: "Growth",
      author: "Kenji Park",
      publishedAt: "2026-07-26",
      readMinutes: 8,
    },
    {
      id: "product-role-aware-workspaces",
      title: "Why role-aware workspaces beat one-size dashboards",
      excerpt:
        "Baristas, shift leads, and managers need different defaults. Tailor the surface, not just permissions.",
      category: "Product",
      author: "Noah Patel",
      publishedAt: "2026-07-18",
      readMinutes: 7,
    },
    {
      id: "culture-calmer-service-patterns",
      title: "Calmer service starts with predictable patterns",
      excerpt:
        "A repeatable opening rhythm lowers stress and improves consistency during the first two operating hours.",
      category: "Culture",
      author: "Alina Cruz",
      publishedAt: "2026-07-09",
      readMinutes: 5,
    },
    {
      id: "ops-incident-retrospectives",
      title: "Incident retrospectives your team will actually use",
      excerpt:
        "Keep post-incident notes lean and actionable so process improvements happen this week, not next quarter.",
      category: "Operations",
      author: "Derek Yu",
      publishedAt: "2026-06-29",
      readMinutes: 9,
    },
    {
      id: "growth-menu-release-cadence",
      title: "Menu rollout cadence for multi-location launches",
      excerpt:
        "Ship seasonal menu updates in phased waves to protect quality while still keeping momentum.",
      category: "Growth",
      author: "Rina Flores",
      publishedAt: "2026-06-14",
      readMinutes: 10,
    },
  ],
};
