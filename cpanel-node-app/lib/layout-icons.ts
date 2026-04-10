import type { ComponentType } from 'react';
import {
  BookOpen,
  Bird,
  Calendar,
  Camera,
  FolderOpen,
  Leaf,
  MapPin,
  Mountain,
  Newspaper,
  Pickaxe,
  TreePine,
  Users,
} from 'lucide-react';
import type { LayoutIconName } from '@/types';

export const layoutIconMap: Record<LayoutIconName, ComponentType<{ className?: string }>> = {
  Mountain,
  TreePine,
  Bird,
  Pickaxe,
  Users,
  Calendar,
  Newspaper,
  FolderOpen,
  BookOpen,
  Camera,
  Leaf,
  MapPin,
};
