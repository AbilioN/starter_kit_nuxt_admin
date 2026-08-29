export interface menu {
  header?: string;
  title?: string;
  icon?: any;
  to?: string;
  chip?: string;
  BgColor?: string;
  chipBgColor?: string;
  chipColor?: string;
  chipVariant?: string;
  chipIcon?: string;
  children?: menu[];
  disabled?: boolean;
  type?: string;
  subCaption?: string;
  external?: boolean;
  permission?: string;
}

// title/header hold i18n keys (resolved via $t() in NavItem/NavGroup/NavCollapse),
// not literal display text — this array is a static module-level singleton,
// evaluated once, so it can't hold already-translated strings.
const sidebarItem: menu[] = [
  { header: "nav.home" },
  {
    title: "nav.dashboard",
    icon: "graph-new-linear",
    to: "/dashboard",
  },
  {
    title: "nav.myProfile",
    icon: "user-circle-bold",
    to: "/profile",
  },
  { header: "nav.management" },
  {
    title: "nav.users",
    icon: "users-group-rounded-line-duotone",
    to: "/users",
    permission: "user-read",
  },
  {
    title: "nav.administrators",
    icon: "shield-user-outline",
    to: "/admins",
    permission: "admin-read",
  },
  {
    title: "nav.roles",
    icon: "shield-keyhole-linear",
    to: "/roles",
    permission: "role-assign",
  },
  {
    title: "nav.auditLogs",
    icon: "clipboard-text-linear",
    to: "/audit",
    permission: "audit-read",
  },
  {
    title: "nav.agenda",
    icon: "calendar-linear",
    to: "/agenda",
    // Hidden from anyone who cannot read it. The feature flag is a separate
    // matter and is handled on the page: an admin whose workspace has the
    // agenda switched off should be told so, not silently shown nothing.
    permission: "appointment-read",
  },
  {
    title: "nav.chats",
    icon: "chat-round-line-duotone",
    to: "/chats",
    permission: "chat-manage",
  },
  {
    title: "nav.files",
    icon: "folder-with-files-line-duotone",
    to: "/files",
    permission: "file-read",
  },
  {
    title: "nav.templates",
    icon: "document-text-linear",
    to: "/templates",
    permission: "template-read",
  },
  {
    title: "nav.notifications",
    icon: "bell-outline",
    to: "/notifications",
  },
  {
    title: "nav.settings",
    icon: "settings-linear",
    to: "/settings",
    permission: "setting-read",
    children: [
      {
        title: "nav.settingsGeneral",
        to: "/settings",
      },
      {
        title: "nav.settingsFeatureFlags",
        to: "/settings/features",
      },
    ],
  },
];

export default sidebarItem;
