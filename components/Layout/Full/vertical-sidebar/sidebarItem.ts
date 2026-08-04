import {
  LayoutDashboardIcon,
  BorderAllIcon,
  AlertCircleIcon,
  CircleDotIcon,
  BoxMultiple1Icon,
  LoginIcon,
  MoodHappyIcon,
  ApertureIcon,
  UserPlusIcon,
} from "vue-tabler-icons";

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

const sidebarItem: menu[] = [
  { header: "Home" },
  {
    title: "Dashboard",
    icon: "graph-new-linear",
    to: "/dashboard",
  },
  {
    title: "My Profile",
    icon: "user-circle-bold",
    to: "/profile",
  },
  { header: "Management" },
  {
    title: "Users",
    icon: "users-group-rounded-line-duotone",
    to: "/users",
    permission: "user-read",
  },
  {
    title: "Administrators",
    icon: "shield-user-outline",
    to: "/admins",
    permission: "admin-read",
  },
  {
    title: "Roles",
    icon: "shield-keyhole-linear",
    to: "/roles",
    permission: "role-assign",
  },
  {
    title: "Audit Logs",
    icon: "clipboard-text-linear",
    to: "/audit",
    permission: "audit-read",
  },
  {
    title: "Chats",
    icon: "chat-round-line-duotone",
    to: "/chats",
    permission: "chat-manage",
  },
  {
    title: "Files",
    icon: "folder-with-files-line-duotone",
    to: "/files",
    permission: "file-read",
  },
  {
    title: "Notifications",
    icon: "bell-outline",
    to: "/notifications",
  },
  {
    title: "Settings",
    icon: "settings-linear",
    to: "/settings",
    permission: "setting-read",
    children: [
      {
        title: "General",
        to: "/settings",
      },
      {
        title: "Feature Flags",
        to: "/settings/features",
      },
    ],
  },
];

export default sidebarItem;
