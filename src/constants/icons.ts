import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Heart,
  Menu,
  MoreHorizontal,
  Search,
  Star,
  User,
  X,
  type LucideIcon,
} from "lucide-react-native";

export const iconMap = {
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  check: Check,
  chevronDown: ChevronDown,
  close: X,
  heart: Heart,
  menu: Menu,
  more: MoreHorizontal,
  search: Search,
  star: Star,
  user: User,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof iconMap;
