// Closed catalog of tools. Users (candidates and employers) cannot add, remove or edit names.
// Tool IDs are stable identifiers stored in the database; labels are display-only.

export type ToolLevel = "basic" | "intermediate" | "advanced" | "expert";

export const TOOL_LEVELS: ToolLevel[] = ["basic", "intermediate", "advanced", "expert"];

export const toolLevelLabels: Record<"pl" | "en", Record<ToolLevel, string>> = {
  pl: {
    basic: "Podstawowy",
    intermediate: "Średniozaawansowany",
    advanced: "Zaawansowany",
    expert: "Ekspert",
  },
  en: {
    basic: "Basic",
    intermediate: "Intermediate",
    advanced: "Advanced",
    expert: "Expert",
  },
};

export const toolLevelOrder: Record<ToolLevel, number> = {
  basic: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

export interface ToolEntry {
  tool_id: string;
  level: ToolLevel;
}

export interface ToolDefinition {
  id: string;
  name: string;
}

export interface ToolCategory {
  id: string;
  labelPl: string;
  labelEn: string;
  tools: ToolDefinition[];
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: "project_management",
    labelPl: "Zarządzanie projektami",
    labelEn: "Project management",
    tools: [
      { id: "jira", name: "Jira" },
      { id: "clickup", name: "ClickUp" },
      { id: "trello", name: "Trello" },
      { id: "asana", name: "Asana" },
      { id: "monday", name: "Monday.com" },
      { id: "azure_devops", name: "Azure DevOps" },
    ],
  },
  {
    id: "api_testing",
    labelPl: "Testowanie API",
    labelEn: "API testing",
    tools: [
      { id: "postman", name: "Postman" },
      { id: "soapui", name: "SoapUI" },
      { id: "insomnia", name: "Insomnia" },
    ],
  },
  {
    id: "browsers",
    labelPl: "Przeglądarki (środowiska testowe web)",
    labelEn: "Browsers (web testing environments)",
    tools: [
      { id: "chrome", name: "Google Chrome" },
      { id: "firefox", name: "Mozilla Firefox" },
      { id: "edge", name: "Microsoft Edge" },
      { id: "safari", name: "Safari" },
      { id: "opera", name: "Opera" },
    ],
  },
  {
    id: "cross_browser",
    labelPl: "Platformy testów cross-browser",
    labelEn: "Cross-browser platforms",
    tools: [
      { id: "browserstack", name: "BrowserStack" },
      { id: "lambdatest", name: "LambdaTest" },
    ],
  },
  {
    id: "mobile_testing",
    labelPl: "Testowanie aplikacji mobilnych",
    labelEn: "Mobile app testing",
    tools: [
      { id: "appium", name: "Appium" },
      { id: "android_studio", name: "Android Studio" },
      { id: "xcode", name: "Xcode" },
    ],
  },
  {
    id: "automation",
    labelPl: "Automatyzacja testów",
    labelEn: "Test automation",
    tools: [
      { id: "selenium", name: "Selenium" },
      { id: "cypress", name: "Cypress" },
      { id: "playwright", name: "Playwright" },
    ],
  },
  {
    id: "test_management",
    labelPl: "Zarządzanie testami",
    labelEn: "Test management",
    tools: [
      { id: "testrail", name: "TestRail" },
      { id: "xray", name: "Xray" },
      { id: "zephyr", name: "Zephyr" },
      { id: "qtest", name: "qTest" },
      { id: "testlink", name: "TestLink" },
    ],
  },
  {
    id: "version_control",
    labelPl: "Kontrola wersji",
    labelEn: "Version control",
    tools: [
      { id: "git", name: "Git" },
      { id: "github", name: "GitHub" },
      { id: "gitlab", name: "GitLab" },
      { id: "bitbucket", name: "Bitbucket" },
    ],
  },
  {
    id: "docs_collab",
    labelPl: "Dokumentacja i współpraca",
    labelEn: "Documentation & collaboration",
    tools: [
      { id: "confluence", name: "Confluence" },
      { id: "notion", name: "Notion" },
      { id: "miro", name: "Miro" },
      { id: "figma", name: "Figma" },
    ],
  },
  {
    id: "databases",
    labelPl: "Bazy danych",
    labelEn: "Databases",
    tools: [
      { id: "mysql", name: "MySQL" },
      { id: "postgresql", name: "PostgreSQL" },
      { id: "mssql", name: "Microsoft SQL Server" },
      { id: "oracle", name: "Oracle Database" },
      { id: "mongodb", name: "MongoDB" },
    ],
  },
  {
    id: "ecommerce",
    labelPl: "E-commerce",
    labelEn: "E-commerce",
    tools: [
      { id: "shopify", name: "Shopify" },
      { id: "shoper", name: "Shoper" },
      { id: "woocommerce", name: "WooCommerce" },
      { id: "magento", name: "Magento" },
      { id: "prestashop", name: "PrestaShop" },
    ],
  },
  {
    id: "analytics",
    labelPl: "Analityka",
    labelEn: "Analytics",
    tools: [
      { id: "ga4", name: "Google Analytics 4" },
      { id: "gtm", name: "Google Tag Manager" },
      { id: "hotjar", name: "Hotjar" },
      { id: "clarity", name: "Microsoft Clarity" },
    ],
  },
  {
    id: "ab_testing",
    labelPl: "Testy A/B i optymalizacja",
    labelEn: "A/B testing & optimization",
    tools: [
      { id: "ab_tests_generic", name: "Testy A/B" },
      { id: "optimizely", name: "Optimizely" },
      { id: "vwo", name: "VWO" },
      { id: "ab_tasty", name: "AB Tasty" },
    ],
  },
  {
    id: "communication",
    labelPl: "Komunikacja",
    labelEn: "Communication",
    tools: [
      { id: "slack", name: "Slack" },
      { id: "ms_teams", name: "Microsoft Teams" },
      { id: "discord", name: "Discord" },
    ],
  },
  {
    id: "ci_cd",
    labelPl: "CI/CD",
    labelEn: "CI/CD",
    tools: [
      { id: "jenkins", name: "Jenkins" },
      { id: "github_actions", name: "GitHub Actions" },
      { id: "gitlab_ci", name: "GitLab CI/CD" },
      { id: "azure_pipelines", name: "Azure Pipelines" },
    ],
  },
];

const TOOL_INDEX = new Map<string, { name: string; categoryId: string }>();
for (const cat of TOOL_CATEGORIES) {
  for (const tool of cat.tools) {
    TOOL_INDEX.set(tool.id, { name: tool.name, categoryId: cat.id });
  }
}

export const getToolName = (toolId: string): string =>
  TOOL_INDEX.get(toolId)?.name ?? toolId;

export const isKnownToolId = (toolId: string): boolean => TOOL_INDEX.has(toolId);

// Normalize incoming arrays from the DB: filter out unknown ids and invalid levels.
export const normalizeTools = (raw: unknown): ToolEntry[] => {
  if (!Array.isArray(raw)) return [];
  const out: ToolEntry[] = [];
  for (const item of raw as Array<Record<string, unknown>>) {
    const id = String(item?.tool_id ?? "");
    const level = String(item?.level ?? "") as ToolLevel;
    if (!isKnownToolId(id)) continue;
    if (!TOOL_LEVELS.includes(level)) continue;
    out.push({ tool_id: id, level });
  }
  return out;
};
