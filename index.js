// Importamos la librería de WhatsApp Web y OpenAI
const { Client, LocalAuth } = require('whatsapp-web.js');
const { OpenAI } = require('openai');
const qrcode = require('qrcode-terminal');

// Reemplaza con tu clave de OpenAI
const OPENAI_API_KEY = "TU_CLAVE_DE_OPENAI_AQUI"; 

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Inicializamos el cliente de OpenAI
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

// Base de conocimiento del chatbot
const knowledgeBase = `
Información sobre la empresa: Clínica Dental Smile.
- Nombre completo: Clínica Dental Smile
- Eslogan: Tu sonrisa, nuestra prioridad.
- Misión: Ofrecer servicios dentales de alta calidad con un enfoque humano y personalizado, utilizando tecnología avanzada para garantizar la salud y estética bucal de nuestros pacientes.
- Visión: Ser la clínica dental líder en Costa Rica, reconocida por nuestra excelencia en el cuidado del paciente y la innovación en tratamientos.
- Valores: Compromiso, Calidad, Integridad, Innovación y Empatía.
- Horario de atención: Lunes a Viernes, de 9:00 AM a 6:00 PM (hora de Costa Rica).
- Contacto: info@clinicadentalsmile.com o al número +506 8888-8888.
- Ubicación: Operamos en San José, Costa Rica. Para una dirección exacta o citas, por favor usa el enlace de agendamiento.

Servicios ofrecidos y sus precios:
- Limpieza Dental: Un procedimiento esencial para mantener la salud bucal, eliminando placa y sarro para prevenir caries y enfermedades de las encías. Incluye un examen bucal. Precio: ₡30,000.
- Blanqueamiento Dental: Un tratamiento estético seguro para aclarar el tono de tus dientes y mejorar la apariencia de tu sonrisa. Se realiza con tecnología LED y geles especiales. Precio: ₡70,000.
- Extracciones: Procedimiento para remover un diente dañado o que causa problemas. Se realiza con anestesia local para asegurar el confort del paciente. El proceso es rápido y se dan indicaciones detalladas para el cuidado post-extracción. Precio: ₡45,000.
- Ortodoncia: Ofrecemos soluciones de ortodoncia para corregir la alineación dental y mejorar la función masticatoria. Incluye una evaluación inicial y planes de tratamiento personalizados (brackets tradicionales, estéticos, alineadores invisibles). Precio inicial: ₡150,000 (el precio total varía según el caso y plan de tratamiento).
- Consulta General: Una revisión completa de tu salud bucal, donde se evalúa el estado de tus dientes y encías, y se discuten tus preocupaciones. Incluye un examen visual y recomendaciones personalizadas. Precio: ₡25,000.
- Urgencias Dentales: Atención inmediata para dolores agudos, fracturas dentales, infecciones o cualquier situación que requiera intervención rápida. El costo base es de ₡50,000, más el costo del procedimiento necesario. Para atención inmediata, puede llamar al +506 8888-8888.

Agendamiento de Citas:
- Puedes agendar una cita directamente a través de nuestro sistema en línea.
- Para agendar, selecciona el servicio deseado y un horario disponible.
- **Combinación de procedimientos:** Sí, en algunos casos se pueden realizar múltiples procedimientos en una sola cita, como una limpieza dental y una extracción, si el tiempo lo permite y es médicamente adecuado. Nuestro equipo te guiará en la mejor opción al momento de agendar. Siempre puedes agendar ambos y en la clínica te indicamos si es recomendable o posible en una sola sesión.
`;

const APPOINTMENT_LINK = "https://tidycal.com/emanuelquiros1014/consulta-clinica-smile";

// El bot genera el código QR
client.on('qr', qr => {
    console.log('Código QR recibido, escanéalo con tu teléfono');
    qrcode.generate(qr, { small: true });
});

// Evento de cuando el bot está listo
client.on('ready', () => {
    console.log('¡Cliente de WhatsApp listo!');
});

// Evento de cuando llega un mensaje
client.on('message', async message => {
    let finalResponseToUser = '';
    const messageBodyLower = message.body.toLowerCase();
    const schedulingKeywords = ["agendar", "cita", "agendar cita", "citas", "horario para cita"];

    if (schedulingKeywords.some(keyword => messageBodyLower.includes(keyword))) {
        finalResponseToUser = `¡Perfecto! 😄 Puedes agendar tu cita directamente a través de nuestro sistema en línea. Aquí tienes el enlace para agendar tu cita: ${APPOINTMENT_LINK}`;
    } else {
        const systemPromptContent = `
        Eres un asistente de chatbot para WhatsApp de Clínica Dental Smile.
        Tu objetivo principal es responder a las consultas de los usuarios de forma concisa, natural, amigable y humana, evitando extenderte innecesariamente. **Utiliza emojis de forma moderada y relevante para hacer las interacciones más cálidas y amigables (ej. un ✨ al inicio, un 😄 al final de una respuesta útil, un 🦷 al hablar de servicios dentales, un 🗓️ al hablar de citas). No exageres con ellos.**
        Siempre debes apegarte estrictamente a la siguiente Base de Conocimiento. Si una pregunta no puede ser respondida con esta información, indica claramente que no tienes esa información y ofrece ayuda con algo relacionado a los servicios de la clínica. No inventes respuestas.

        Base de Conocimiento:
        ${knowledgeBase}

        Instrucciones Adicionales sobre Saludos, Agendamiento y Precios:
        - **Saludos:**
            - Si el usuario simplemente dice "Hola", "Buenos días", "Qué tal", "Saludos" o un saludo similar sin hacer una pregunta explícita sobre un servicio o precio (es decir, el mensaje es predominantemente un saludo), responde con un saludo completo y amigable como: "¡Hola! ✨ Bienvenido/a a Clínica Dental Smile. Es un gusto poder atenderte hoy. ¿En qué puedo ayudarte? 😄"
            - Si el usuario hace una pregunta directa (ej. "Precios", "¿Cuánto cuesta la limpieza?"), incluye un saludo breve y amigable al inicio de tu respuesta, como: "¡Hola! 😄 Somos Clínica Dental Smile, es un gusto atenderte. Nuestros precios son:" o "¡Claro! 😊 El blanqueamiento dental tiene un precio de...". Luego procede con la respuesta solicitada.
        - **Agendamiento y Precios (manteniendo las reglas existentes):**
            - Si el usuario pregunta por "precios" en general ("cuánto cuesta", "lista de precios"), proporciona una lista clara y concisa de TODOS los servicios disponibles y sus precios, incluyendo Limpieza Dental, Blanqueamiento Dental, Extracciones, Ortodoncia, Consulta General y Urgencias Dentales. Formatea esta lista hacia abajo. Después de dar esta lista (y solo en esta ocasión si es la primera vez que se da la lista de precios en la conversación actual), puedes preguntar algo como: "¿Te gustaría agendar alguno de estos servicios o necesitas más información en particular? Podemos ayudarte a reservar tu cita. 🗓️"
            - Si el usuario pregunta por el precio de UN servicio específico (ej. "Cuánto cuesta el blanqueamiento?"), proporciona el precio de ese servicio. Después de dar ese primer precio (y solo en esta ocasión si es la primera vez que se da un precio de un servicio específico en la conversación y no se ha ofrecido antes), puedes preguntar "¿Desea agendar este procedimiento o necesita más detalles? 😊"
            - **IMPORTANTE:** Para consultas de agendamiento, el sistema manejará la respuesta directamente con el enlace. El modelo NO debe generar el enlace para agendar.
            - Si ya se proporcionó una lista general de precios o el precio de un servicio específico, y el usuario pide más información sobre ESE MISMO servicio (ej. "más info sobre el blanqueamiento"), responde sin repetir el precio.
            - El único momento donde debes mencionar el precio de nuevo (aunque ya se haya dicho) es si la persona pregunta explícitamente el precio de nuevo (ej. "Me podrías recordar el precio del blanqueamiento?").
        `;

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemPromptContent },
                    { role: "user", content: message.body }
                ],
            });
            finalResponseToUser = completion.choices[0].message.content;
        } catch (error) {
            console.error("Error al llamar a la API de OpenAI:", error);
            finalResponseToUser = "Lo siento, tengo problemas para procesar tu solicitud en este momento.";
        }
    }

    if (finalResponseToUser) {
        client.sendMessage(message.from, finalResponseToUser);
    }
});

// Iniciamos el bot
client.initialize();
