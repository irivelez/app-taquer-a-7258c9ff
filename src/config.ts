export const BUSINESS_CONFIG = {
  name: 'Taquería El Sabor',
  type: 'restaurante/taquería',
  hours: '10:00 AM - 10:00 PM',
  address: 'Consulta nuestra ubicación por WhatsApp',
  phone: process.env.BUSINESS_PHONE || '',
  
  // Mensaje de confirmación personalizable
  confirmationMessage: '¡Pedido recibido! Te confirmamos: [detalles del pedido] - Total: $[precio] - Estará listo en [tiempo] minutos. ¡Gracias por elegir nuestra taquería!',
  
  // Configuración del bot
  bot: {
    maxOrderItems: 20,
    maxOrderValue: 2000,
    preparationTimeMin: 15,
    preparationTimeMax: 20,
    
    // Respuestas automáticas
    responses: {
      welcome: '¡Bienvenido a nuestra taquería! 🌮',
      error: 'Disculpa, hubo un error. Por favor intenta de nuevo.',
      invalidOption: 'Opción no válida. Por favor selecciona una opción del menú.',
      closed: 'Estamos cerrados en este momento.',
      orderLimit: 'Has alcanzado el límite de items por pedido.',
    }
  },
  
  // Palabras clave para reconocimiento
  keywords: {
    greeting: ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'saludos'],
    menu: ['menu', 'menú', 'carta', 'que tienen', 'platillos'],
    hours: ['horario', 'horarios', 'que hora', 'abren', 'cierran', 'abierto'],
    location: ['dirección', 'direccion', 'ubicación', 'ubicacion', 'donde están'],
    time: ['tiempo', 'cuanto tardan', 'preparación', 'listo'],
    cancel: ['cancelar', 'cancelar pedido', 'no quiero'],
    confirm: ['confirmar', 'si', 'está bien', 'ok', 'confirmo']
  },
  
  // Categorías del menú
  categories: {
    tacos: 'Tacos',
    quesadillas: 'Quesadillas', 
    bebidas: 'Bebidas'
  }
};