import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    "intro",
    {
      type: "category",
      label: "Getting Started",
      collapsed: false,
      items: [
        "setup/raspberry-pi",
        "setup/quick-start",
        "setup/beginners-guide",
        "setup/first-10-minutes",
        "setup/home-assistant-addon",
        "setup/api-keys",
        "setup/home-assistant-mqtt",
      ],
    },
    {
      type: "category",
      label: "Displays",
      collapsed: false,
      link: { type: "doc", id: "displays/index" },
      items: ["displays/split-flap", "setup/note-arrays", "displays/led-matrix", "displays/tv", "features/fiestapanel"],
    },
    {
      type: "category",
      label: "Using FiestaBoard",
      collapsed: false,
      items: [
        "features/page-editor",
        "features/transitions",
        "setup/ai-providers",
        "features/schedule",
        "features/silence-schedule",
        "features/home-assistant-control",
        "features/updating",
      ],
    },
    {
      type: "category",
      label: "Deployment",
      collapsed: true,
      items: [
        "deployment/production",
        "deployment/raspberry-pi",
        "deployment/fiestaupdater",
        "setup/docker-setup",
        "setup/cloud-api",
      ],
    },
    {
      type: "category",
      label: "Reference",
      collapsed: true,
      items: [
        "reference/api-endpoints",
        "reference/environment-variables",
        "reference/character-codes",
        "reference/color-guide",
        "reference/accessibility",
      ],
    },
    {
      type: "category",
      label: "Development",
      collapsed: true,
      items: [
        "development/contributing",
        "development/plugin-guide",
        "development/output-plugins",
        "development/output-stream-api",
        "development/testing",
        "setup/local-development",
        "setup/local-home-assistant",
      ],
    },
    "setup/v2-migration",
    "troubleshooting",
  ],
};

export default sidebars;
