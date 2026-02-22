import express from 'express';
import cors from 'cors';
import { Webhook } from 'twilio/lib/webhooks/Webhooks';
import { handleIncomingMessage } from './bot';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Endpoint de salud
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Bot de WhatsApp para Taquería funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Webhook de Twilio para WhatsApp
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const { From, Body, ProfileName } = req.body;
    
    // Validar que el mensaje venga de WhatsApp
    if (!From || !From.startsWith('whatsapp:')) {
      return res.status(400).json({ error: 'Mensaje no válido' });
    }

    const phoneNumber = From.replace('whatsapp:', '');
    const message = Body || '';
    const customerName = ProfileName || 'Cliente';

    console.log(`Mensaje recibido de ${phoneNumber} (${customerName}): ${message}`);

    // Procesar mensaje
    const response = await handleIncomingMessage(phoneNumber, message, customerName);
    
    // Responder a Twilio
    res.set('Content-Type', 'text/xml');
    res.send(`
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Message>${response}</Message>
      </Response>
    `);
    
  } catch (error) {
    console.error('Error procesando mensaje:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para verificar estado de pedidos
app.get('/orders/:phone', async (req, res) => {
  try {
    const { getCustomerOrders } = await import('./db');
    const orders = await getCustomerOrders(req.params.phone);
    res.json(orders);
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({ error: 'Error obteniendo pedidos' });
  }
});

app.listen(PORT, () => {
  console.log(`🤖 Bot de Taquería ejecutándose en puerto ${PORT}`);
  console.log(`📱 Webhook URL: ${process.env.BASE_URL}/webhook/whatsapp`);
});