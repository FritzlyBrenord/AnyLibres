// ============================================================================
// TYPES: Category
// ============================================================================

import { MultiLangText } from './service';

export interface Category {
  id: string;
  key: string;
  name: MultiLangText;
  description?: MultiLangText;
  image_url?: string;
  icon?: string;
  services_count: number;
  created_at: string;
  updated_at?: string;
}