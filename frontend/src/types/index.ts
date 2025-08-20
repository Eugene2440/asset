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
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Asset {
  id: number;
  asset_tag: string;
  name: string;
  category: AssetCategory;
  brand?: string;
  model?: string;
  serial_number?: string;
  status: AssetStatus;
  purchase_date?: string;
  warranty_expiry?: string;
  description?: string;
  specifications?: string;
  assigned_user_id?: number;
  location_id?: number;
  created_at: string;
  updated_at: string;
  assigned_user?: User;
  location?: Location;
}

export interface Location {
  id: number;
  name: string;
  address?: string;
  description?: string;
  created_at: string;
}

export interface Transfer {
  id: number;
  status: TransferStatus;
  reason: string;
  notes?: string;
  requested_at: string;
  approved_at?: string;
  completed_at?: string;
  asset_id: number;
  requester_id: number;
  approver_id?: number;
  from_user_id?: number;
  to_user_id?: number;
  from_location_id?: number;
  to_location_id?: number;
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
  location_id: number;
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
  assigned_user_id?: number;
  location_id?: number;
}

export interface CreateTransferRequest {
  asset_id: number;
  reason: string;
  notes?: string;
  to_user_id?: number;
  to_location_id?: number;
}

export interface UpdateTransferRequest {
  status: TransferStatus;
  notes?: string;
}

export interface PaginatedAssetResponse {
  total_count: number;
  assets: Asset[];
}
