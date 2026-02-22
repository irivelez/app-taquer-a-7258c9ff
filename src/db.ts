import { createClient } from '@supabase/supabase-js';
import { CustomerState, MenuItem, Order } from './types';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Faltan variables de entorno de Supabase');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Obtener estado del cliente
export async function getCustomerState(phoneNumber: string): Promise<CustomerState | null> {
  try {
    const { data, error } = await supabase
      .from('customer_states')
      .select('*')
      .eq('phone', phoneNumber)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error obteniendo estado del cliente:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error en getCustomerState:', error);
    return null;
  }
}

// Actualizar estado del cliente
export async function updateCustomerState(state: Partial<CustomerState>): Promise<void> {
  try {
    const { error } = await supabase
      .from('customer_states')
      .upsert({
        ...state,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error actualizando estado del cliente:', error);
    }
  } catch (error) {
    console.error('Error en updateCustomerState:', error);
  }
}

// Obtener menú
export async function getMenu(): Promise<MenuItem[]> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('available', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error obteniendo menú:', error);
      return getDefaultMenu();
    }
    
    return data || getDefaultMenu();
  } catch (error) {
    console.error('Error en getMenu:', error);
    return getDefaultMenu();
  }
}

// Menú por defecto si no hay datos en la BD
function getDefaultMenu(): MenuItem[] {
  return [
    {
      id: 1,
      name: 'Tacos de Pastor',
      description: '3 tacos con carne al pastor, piña, cebolla y cilantro',
      price: 45,
      category: 'tacos',
      available: true
    },
    {
      id: 2,
      name: 'Tacos de Bistec',
      description: '3 tacos con carne de res, cebolla y cilantro',
      price: 50,
      category: 'tacos',
      available: true
    },
    {
      id: 3,
      name: 'Tacos de Pollo',
      description: '3 tacos con pollo marinado, cebolla y cilantro',
      price: 40,
      category: 'tacos',
      available: true
    },
    {
      id: 4,
      name: 'Quesadilla de Queso',
      description: 'Tortilla de maíz con queso Oaxaca derretido',
      price: 25,
      category: 'quesadillas',
      available: true
    },
    {
      id: 5,
      name: 'Quesadilla con Pastor',
      description: 'Tortilla con queso y carne al pastor',
      price: 35,
      category: 'quesadillas',
      available: true
    },
    {
      id: 6,
      name: 'Quesadilla con Bistec',
      description: 'Tortilla con queso y carne de res',
      price: 40,
      category: 'quesadillas',
      available: true
    },
    {
      id: 7,
      name: 'Coca-Cola',
      description: 'Refresco de cola 355ml',
      price: 15,
      category: 'bebidas',
      available: true
    },
    {
      id: 8,
      name: 'Agua de Horchata',
      description: 'Agua fresca de horchata 500ml',
      price: 20,
      category: 'bebidas',
      available: true
    },
    {
      id: 9,
      name: 'Agua de Jamaica',
      description: 'Agua fresca de jamaica 500ml',
      price: 18,
      category: 'bebidas',
      available: true
    }
  ];
}

// Guardar pedido
export async function saveOrder(order: Omit<Order, 'id'>): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select('id')
      .single();
    
    if (error) {
      console.error('Error guardando pedido:', error);
      // Generar ID temporal si falla la BD
      return Math.floor(Math.random() * 10000) + 1000;
    }
    
    return data.id;
  } catch (error) {
    console.error('Error en saveOrder:', error);
    return Math.floor(Math.random() * 10000) + 1000;
  }
}

// Obtener pedidos de un cliente
export async function getCustomerOrders(phoneNumber: string): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_phone', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error obteniendo pedidos del cliente:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error en getCustomerOrders:', error);
    return [];
  }
}

// Actualizar estado de pedido
export async function updateOrderStatus(orderId: number, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    if (error) {
      console.error('Error actualizando estado de pedido:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error en updateOrderStatus:', error);
    return false;
  }
}