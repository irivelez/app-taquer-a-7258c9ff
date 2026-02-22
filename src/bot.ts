import { getCustomerState, updateCustomerState, saveOrder, getMenu } from './db';
import { BUSINESS_CONFIG } from './config';
import { CustomerState, MenuItem, OrderItem } from './types';

// Estados de la conversación
const STATES = {
  WELCOME: 'welcome',
  MENU: 'menu',
  ORDERING: 'ordering',
  CONFIRMING: 'confirming',
  COMPLETED: 'completed'
} as const;

// Función principal para manejar mensajes
export async function handleIncomingMessage(
  phoneNumber: string, 
  message: string, 
  customerName: string
): Promise<string> {
  try {
    // Obtener estado actual del cliente
    let state = await getCustomerState(phoneNumber);
    
    // Si no existe, crear estado inicial
    if (!state) {
      state = {
        phone: phoneNumber,
        name: customerName,
        current_state: STATES.WELCOME,
        current_order: [],
        order_total: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await updateCustomerState(state);
    }

    const normalizedMessage = message.toLowerCase().trim();

    // Manejar comandos especiales en cualquier momento
    if (normalizedMessage.includes('hola') || normalizedMessage.includes('inicio')) {
      return await handleWelcome(phoneNumber, customerName);
    }

    if (normalizedMessage.includes('menu') || normalizedMessage.includes('menú') || normalizedMessage.includes('carta')) {
      return await showMenu(phoneNumber);
    }

    if (normalizedMessage.includes('horario') || normalizedMessage.includes('hora')) {
      return getBusinessHours();
    }

    if (normalizedMessage.includes('dirección') || normalizedMessage.includes('direccion') || normalizedMessage.includes('ubicación')) {
      return getBusinessAddress();
    }

    if (normalizedMessage.includes('tiempo') || normalizedMessage.includes('preparación')) {
      return getPreparationTime();
    }

    if (normalizedMessage === 'cancelar') {
      return await cancelOrder(phoneNumber);
    }

    // Procesar según el estado actual
    switch (state.current_state) {
      case STATES.WELCOME:
        return await handleWelcome(phoneNumber, customerName);
      
      case STATES.MENU:
        return await handleMenuSelection(phoneNumber, normalizedMessage);
      
      case STATES.ORDERING:
        return await handleOrdering(phoneNumber, normalizedMessage);
      
      case STATES.CONFIRMING:
        return await handleConfirmation(phoneNumber, normalizedMessage);
      
      default:
        return await handleWelcome(phoneNumber, customerName);
    }
    
  } catch (error) {
    console.error('Error en handleIncomingMessage:', error);
    return 'Disculpa, hubo un error. Por favor intenta de nuevo o escribe "hola" para reiniciar.';
  }
}

// Manejar bienvenida
async function handleWelcome(phoneNumber: string, customerName: string): Promise<string> {
  const state: CustomerState = {
    phone: phoneNumber,
    name: customerName,
    current_state: STATES.MENU,
    current_order: [],
    order_total: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  await updateCustomerState(state);
  
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const isOpen = currentHour >= 10 && currentHour < 22;
  
  let welcomeMessage = `¡Hola ${customerName}! 👋 Bienvenido a ${BUSINESS_CONFIG.name}\n\n`;
  
  if (isOpen) {
    welcomeMessage += '¡Estamos abiertos! 🌮\n\n';
    welcomeMessage += await showMenuInline();
    welcomeMessage += '\n\nPara hacer tu pedido, escribe el número del platillo que deseas.\n';
    welcomeMessage += 'Ejemplo: "1" para tacos de pastor\n\n';
    welcomeMessage += 'También puedes preguntar por:\n';
    welcomeMessage += '• "horarios" - Horarios de atención\n';
    welcomeMessage += '• "dirección" - Ubicación del local\n';
    welcomeMessage += '• "tiempo" - Tiempo de preparación';
  } else {
    welcomeMessage += `Lo siento, estamos cerrados. 😴\n\n`;
    welcomeMessage += `📍 Horarios: ${BUSINESS_CONFIG.hours}\n\n`;
    welcomeMessage += 'Puedes ver nuestro menú escribiendo "menú" y hacer tu pedido para cuando abramos.';
  }
  
  return welcomeMessage;
}

// Mostrar menú completo
async function showMenu(phoneNumber: string): Promise<string> {
  await updateCustomerState({ 
    phone: phoneNumber, 
    current_state: STATES.MENU,
    updated_at: new Date().toISOString()
  });
  
  const menuText = await showMenuInline();
  return `${menuText}\n\nPara ordenar, escribe el número del platillo.\nEjemplo: "1" para el primer platillo`;
}

// Mostrar menú inline
async function showMenuInline(): Promise<string> {
  const menu = await getMenu();
  let menuText = '🍽️ **NUESTRO MENÚ** 🍽️\n\n';
  
  menu.forEach((item, index) => {
    menuText += `${index + 1}. ${item.name}\n`;
    menuText += `   💰 $${item.price}\n`;
    if (item.description) {
      menuText += `   📝 ${item.description}\n`;
    }
    menuText += '\n';
  });
  
  return menuText;
}

// Manejar selección del menú
async function handleMenuSelection(phoneNumber: string, message: string): Promise<string> {
  const menu = await getMenu();
  const itemNumber = parseInt(message);
  
  if (isNaN(itemNumber) || itemNumber < 1 || itemNumber > menu.length) {
    return `Por favor selecciona un número válido del 1 al ${menu.length}.\n\nEscribe "menú" para ver las opciones nuevamente.`;
  }
  
  const selectedItem = menu[itemNumber - 1];
  
  await updateCustomerState({ 
    phone: phoneNumber, 
    current_state: STATES.ORDERING,
    selected_item: selectedItem,
    updated_at: new Date().toISOString()
  });
  
  return `¡Excelente elección! 🌮\n\n` +
         `Has seleccionado: **${selectedItem.name}**\n` +
         `Precio: $${selectedItem.price}\n\n` +
         `¿Cuántos quieres? Escribe la cantidad (ejemplo: "2")`;
}

// Manejar pedido (cantidad)
async function handleOrdering(phoneNumber: string, message: string): Promise<string> {
  const quantity = parseInt(message);
  
  if (isNaN(quantity) || quantity < 1 || quantity > 20) {
    return 'Por favor ingresa una cantidad válida entre 1 y 20.';
  }
  
  const state = await getCustomerState(phoneNumber);
  if (!state || !state.selected_item) {
    return 'Error: No hay item seleccionado. Escribe "menú" para empezar.';
  }
  
  const orderItem: OrderItem = {
    item_id: state.selected_item.id,
    name: state.selected_item.name,
    price: state.selected_item.price,
    quantity: quantity,
    subtotal: state.selected_item.price * quantity
  };
  
  const currentOrder = state.current_order || [];
  const existingIndex = currentOrder.findIndex(item => item.item_id === orderItem.item_id);
  
  if (existingIndex >= 0) {
    currentOrder[existingIndex].quantity += quantity;
    currentOrder[existingIndex].subtotal = currentOrder[existingIndex].price * currentOrder[existingIndex].quantity;
  } else {
    currentOrder.push(orderItem);
  }
  
  const total = currentOrder.reduce((sum, item) => sum + item.subtotal, 0);
  
  await updateCustomerState({ 
    phone: phoneNumber, 
    current_state: STATES.CONFIRMING,
    current_order: currentOrder,
    order_total: total,
    selected_item: undefined,
    updated_at: new Date().toISOString()
  });
  
  let orderSummary = `✅ Agregado a tu pedido:\n\n`;
  orderSummary += `${quantity}x ${orderItem.name} - $${orderItem.subtotal}\n\n`;
  orderSummary += `📋 **RESUMEN DE TU PEDIDO:**\n\n`;
  
  currentOrder.forEach(item => {
    orderSummary += `${item.quantity}x ${item.name} - $${item.subtotal}\n`;
  });
  
  orderSummary += `\n💰 **Total: $${total}**\n\n`;
  orderSummary += `¿Deseas agregar algo más?\n\n`;
  orderSummary += `• Escribe "confirmar" para finalizar tu pedido\n`;
  orderSummary += `• Escribe "menú" para agregar más platillos\n`;
  orderSummary += `• Escribe "cancelar" para cancelar el pedido`;
  
  return orderSummary;
}

// Manejar confirmación
async function handleConfirmation(phoneNumber: string, message: string): Promise<string> {
  const state = await getCustomerState(phoneNumber);
  
  if (!state || !state.current_order || state.current_order.length === 0) {
    return 'No tienes ningún pedido pendiente. Escribe "hola" para empezar.';
  }
  
  if (message === 'confirmar') {
    // Guardar pedido en la base de datos
    const orderId = await saveOrder({
      customer_phone: phoneNumber,
      customer_name: state.name,
      items: state.current_order,
      total: state.order_total,
      status: 'pending',
      created_at: new Date().toISOString()
    });
    
    // Limpiar estado del cliente
    await updateCustomerState({ 
      phone: phoneNumber, 
      current_state: STATES.COMPLETED,
      current_order: [],
      order_total: 0,
      updated_at: new Date().toISOString()
    });
    
    // Mensaje de confirmación personalizado
    let confirmationMessage = BUSINESS_CONFIG.confirmationMessage;
    
    // Reemplazar placeholders
    let orderDetails = '';
    state.current_order.forEach(item => {
      orderDetails += `${item.quantity}x ${item.name}, `;
    });
    orderDetails = orderDetails.slice(0, -2); // Remover última coma
    
    confirmationMessage = confirmationMessage
      .replace('[detalles del pedido]', orderDetails)
      .replace('[precio]', state.order_total.toString())
      .replace('[tiempo]', '15-20');
    
    confirmationMessage += `\n\n🧾 Número de pedido: #${orderId}`;
    confirmationMessage += `\n\n¡Gracias por tu preferencia! Para hacer otro pedido, escribe "hola".`;
    
    return confirmationMessage;
  }
  
  if (message === 'menú' || message === 'menu') {
    return await showMenu(phoneNumber);
  }
  
  if (message === 'cancelar') {
    return await cancelOrder(phoneNumber);
  }
  
  return 'Por favor responde:\n• "confirmar" para finalizar tu pedido\n• "menú" para agregar más platillos\n• "cancelar" para cancelar';
}

// Cancelar pedido
async function cancelOrder(phoneNumber: string): Promise<string> {
  await updateCustomerState({ 
    phone: phoneNumber, 
    current_state: STATES.WELCOME,
    current_order: [],
    order_total: 0,
    selected_item: undefined,
    updated_at: new Date().toISOString()
  });
  
  return '❌ Pedido cancelado.\n\nEscribe "hola" cuando quieras hacer un nuevo pedido.';
}

// Información del negocio
function getBusinessHours(): string {
  return `🕙 **HORARIOS DE ATENCIÓN**\n\n` +
         `📅 Todos los días: ${BUSINESS_CONFIG.hours}\n\n` +
         `¡Te esperamos! 🌮`;
}

function getBusinessAddress(): string {
  return `📍 **NUESTRA UBICACIÓN**\n\n` +
         `${BUSINESS_CONFIG.address}\n\n` +
         `¡Ven a visitarnos! 🏪`;
}

function getPreparationTime(): string {
  return `⏱️ **TIEMPO DE PREPARACIÓN**\n\n` +
         `🍽️ Tiempo estimado: 15-20 minutos\n\n` +
         `*Los tiempos pueden variar durante horas pico*`;
}