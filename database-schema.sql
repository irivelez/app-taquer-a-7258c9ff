-- Esquema de base de datos para Taquería WhatsApp Bot
-- Ejecutar en Supabase SQL Editor

-- Tabla de items del menú
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de estados de clientes (para manejar conversaciones)
CREATE TABLE IF NOT EXISTS customer_states (
  phone VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255),
  current_state VARCHAR(50) NOT NULL DEFAULT 'welcome',
  current_order JSONB DEFAULT '[]',
  order_total DECIMAL(10,2) DEFAULT 0,
  selected_item JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_phone VARCHAR(20) NOT NULL,
  customer_name VARCHAR(255),
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de métricas (para seguimiento de KPIs)
CREATE TABLE IF NOT EXISTS metrics (
  id SERIAL PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL, -- 'order', 'response_time', 'revenue'
  metric_value DECIMAL(10,2),
  metric_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_customer_states_phone ON customer_states(phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);
CREATE INDEX IF NOT EXISTS idx_metrics_type_date ON metrics(metric_type, created_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE OR REPLACE TRIGGER update_customer_states_updated_at
    BEFORE UPDATE ON customer_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos del menú por defecto
INSERT INTO menu_items (name, description, price, category) VALUES
  ('Tacos de Pastor', '3 tacos con carne al pastor, piña, cebolla y cilantro', 45.00, 'tacos'),
  ('Tacos de Bistec', '3 tacos con carne de res, cebolla y cilantro', 50.00, 'tacos'),
  ('Tacos de Pollo', '3 tacos con pollo marinado, cebolla y cilantro', 40.00, 'tacos'),
  ('Tacos de Carnitas', '3 tacos con carnitas de cerdo, cebolla y cilantro', 48.00, 'tacos'),
  ('Quesadilla de Queso', 'Tortilla de maíz con queso Oaxaca derretido', 25.00, 'quesadillas'),
  ('Quesadilla con Pastor', 'Tortilla con queso y carne al pastor', 35.00, 'quesadillas'),
  ('Quesadilla con Bistec', 'Tortilla con queso y carne de res', 40.00, 'quesadillas'),
  ('Quesadilla con Pollo', 'Tortilla con queso y pollo marinado', 35.00, 'quesadillas'),
  ('Coca-Cola', 'Refresco de cola 355ml', 15.00, 'bebidas'),
  ('Agua de Horchata', 'Agua fresca de horchata 500ml', 20.00, 'bebidas'),
  ('Agua de Jamaica', 'Agua fresca de jamaica 500ml', 18.00, 'bebidas'),
  ('Agua de Tamarindo', 'Agua fresca de tamarindo 500ml', 18.00, 'bebidas')
ON CONFLICT DO NOTHING;

-- Vista para estadísticas rápidas
CREATE OR REPLACE VIEW order_stats AS
SELECT 
  DATE(created_at) as order_date,
  COUNT(*) as total_orders,
  SUM(total) as total_revenue,
  AVG(total) as avg_order_value,
  status
FROM orders 
GROUP BY DATE(created_at), status
ORDER BY order_date DESC;

-- Vista para items más vendidos
CREATE OR REPLACE VIEW popular_items AS
SELECT 
  item->>'name' as item_name,
  SUM((item->>'quantity')::int) as total_quantity,
  SUM((item->>'subtotal')::decimal) as total_revenue
FROM orders,
  jsonb_array_elements(items) as item
WHERE status != 'cancelled'
GROUP BY item->>'name'
ORDER BY total_quantity DESC;