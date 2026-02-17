import { supabase } from "@/integrations/supabase/client";

export const premiumApi = {
  listProducts: async () => {
    const { data, error } = await supabase.functions.invoke("premium-catalog", {
      body: { action: "list" },
    });
    if (error) throw error;
    return data;
  },
  upsertProduct: async (payload: unknown) => {
    const { data, error } = await supabase.functions.invoke("premium-catalog", {
      body: { action: "upsert", payload },
    });
    if (error) throw error;
    return data;
  },
  removeProduct: async (id: string) => {
    const { data, error } = await supabase.functions.invoke("premium-catalog", {
      body: { action: "delete", payload: { id } },
    });
    if (error) throw error;
    return data;
  },
  createOrder: async (payload: unknown) => {
    const { data, error } = await supabase.functions.invoke("premium-orders", {
      body: { action: "create-order", payload },
    });
    if (error) throw error;
    return data;
  },
  listMyOrders: async () => {
    const { data, error } = await supabase.functions.invoke("premium-orders", {
      body: { action: "list-my-orders" },
    });
    if (error) throw error;
    return data;
  },
  assignOrder: async (payload: unknown) => {
    const { data, error } = await supabase.functions.invoke("premium-delivery", {
      body: { action: "assign-order", payload },
    });
    if (error) throw error;
    return data;
  },
  updateDeliveryStatus: async (payload: unknown) => {
    const { data, error } = await supabase.functions.invoke("premium-delivery", {
      body: { action: "update-status", payload },
    });
    if (error) throw error;
    return data;
  },
};
