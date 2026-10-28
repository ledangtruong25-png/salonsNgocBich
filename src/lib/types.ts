export type Role = 'owner' | 'cashier';
export type Salon = { id: string; name: string; phone: string; address: string; timezone: string };
export type Customer = { id: string; full_name: string; phone: string | null; visits: number; last_visit: string; is_demo: boolean };
export type Service = { id: string; name: string; category: string; price: number; duration_minutes: number; active: boolean; is_demo: boolean };
export type SampleOrder = { id: string; code: string; customer_name: string; service_name: string; check_in: string; check_out: string | null; total: number; status: 'completed' | 'serving' | 'cancelled'; is_demo: boolean };
export type Member = { user_id: string; role: Role; active: boolean; full_name: string };
export type WorkspaceData = {
  salon: Salon; role: Role; userName: string; email: string;
  customers: Customer[]; services: Service[]; orders: SampleOrder[]; members: Member[];
};
export type ActionState = { error?: string; success?: string };
