export enum AssetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  DECOMMISSIONED = 'decommissioned',
  REPAIR = 'repair'
}

export enum AssetCategory {
  LAPTOP = 'laptop',
  DESKTOP = 'desktop',
  MONITOR = 'monitor',
  PRINTER = 'printer',
  PHONE = 'phone',
  TABLET = 'tablet',
  KEYBOARD = 'keyboard',
  MOUSE = 'mouse',
  OTHER = 'other'
}

export enum TransferStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export interface User {
  id: string;
  name: string;
  username?: string;
  email?: string;
  role?: UserRole;
  is_active?: boolean;
  created_at?: string;
}

export interface Asset {
  id: string;
  asset_model?: string;
  asset_type?: string;
  asset_make?: string;
  model?: string;
  asset_status?: string;
  status?: string;
  location?: Location;
  serial_number?: string;
  tag_no?: string;
  assigned_user?: User;
  user?: string;
  os_version?: string;
  created_at?: string;
  updated_at?: string;
  asset_tag?: string;
  name?: string;
  brand?: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  description?: string;
  created_at?: string;
}

export interface Transfer {
  id: string;
  asset_id?: string;
  assigned_to_id?: string;
  damage_report?: string;
  from_location_id?: string;
  from_user_id?: string;
  photo_url?: string;
  reason?: string;
  requested_at?: string;
  requester_id?: string;
  status?: string;
  to_location_id?: string;
  to_user_id?: string;
  asset?: Asset;
  requester?: User;
  approver?: User;
  from_user?: User;
  to_user?: User;
  from_location?: Location;
  to_location?: Location;
  approved_at?: string;
  completed_at?: string;
}

export interface DashboardStats {
  total_assets: number;
  active_assets: number;
  inactive_assets: number;
  pending_transfers: number;
  total_users: number;
  total_locations: number;
}

export interface AssetStatusReport {
  status: AssetStatus;
  count: number;
}

export interface AssetCategoryReport {
  category: AssetCategory;
  count: number;
}

export interface LocationAssetReport {
  location_id: string;
  location_name: string;
  asset_count: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface CreateAssetRequest {
  asset_tag: string;
  name: string;
  category: AssetCategory;
  brand?: string;
  model?: string;
  serial_number?: string;
  status?: AssetStatus;
  purchase_date?: string;
  warranty_expiry?: string;
  description?: string;
  specifications?: string;
  assigned_user_id?: string;
  location_id?: string;
}

export interface CreateTransferRequest {
  asset_id: string;
  reason: string;
  notes?: string;
  to_user_id?: string;
  to_location_id?: string;
}

export interface UpdateTransferRequest {
  status: TransferStatus;
  notes?: string;
}

export interface PaginatedAssetResponse {
  total_count: number;
  assets: Asset[];
}
