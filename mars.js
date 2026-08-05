// ==========================================
// CEREBRO ELITE "MARS" - ESPACIO WEED
// ==========================================
// Formato matriz: [ID_NODO, Texto_Boton_Usuario, Respuesta_Mars, Opciones_Botones_Siguientes]

const cerebroMars = [
    // 1. INICIO Y LORE
    ["inicio", "", "¡Saludos terrícola! 👽 Soy Mars. Aterricé en Cauquenes porque detecté que su tierra es perfecta para el cultivo universal. ¿En qué fase de tu expedición te puedo asesorar hoy?", "Quiero conocer la Tienda, Dudas de Cultivo y Consumo, ¿Quién eres tú Mars?, Hablar con el Mando Central"],
    
    ["¿Quién eres tú Mars?", "¿Quién eres tú Mars?", "Vengo de una galaxia donde la conexión con la naturaleza es tecnología avanzada. Mi nave detectó en Cauquenes una energía única, ideal para expandir la cultura. Decidí quedarme y fundar Espacio Weed para equipar a los terrícolas con parafernalia estelar. 🛸", "Ver Parafernalia, Dudas de Cultivo y Consumo, Volver al inicio"],
    
    // 2. EMBUDO DE EDUCACIÓN Y VENTAS (CROSS-SELLING)
    ["Dudas de Cultivo y Consumo", "Dudas de Cultivo y Consumo", "Excelente elección. El conocimiento es el mejor fertilizante. ¿Sobre qué tecnología terrestre quieres aprender?", "Vaporización vs Combustión, Filtrado en Agua (Bongs), Papelillos y Filtros, Volver al inicio"],
    
    // 2.1 VAPORIZADORES
    ["Vaporización vs Combustión", "Vaporización vs Combustión", "La combustión destruye hasta el 40% de los terpenos por el exceso de calor. La vaporización calienta la materia sin quemarla: es más sano para tus pulmones, ahorras material y el sabor es de otro planeta. 💨 ¿Vemos nuestra flota de vaporizadores?", "Ver Vaporizadores, Ver Parafernalia, Volver al inicio"],
    
    // 2.2 BONGS (AGUA)
    ["Filtrado en Agua (Bongs)", "Filtrado en Agua (Bongs)", "El agua enfría el humo y atrapa cenizas pesadas y toxinas antes de que lleguen a tu sistema. Un hit en Bong es mucho más suave y potente. 🌊 ¿Activamos los escudos y vemos la colección?", "Ver Bongs, Ver Parafernalia, Volver al inicio"],
    
    // 2.3 PAPELILLOS
    ["Papelillos y Filtros", "Papelillos y Filtros", "No todos los papeles son iguales. Los de cáñamo o arroz (sin blanquear) garantizan un quemado lento y puro. Usar boquillas de vidrio o filtros de carbón activo enfría el humo y retiene la resina. 🔥", "Ver Papelillos y Filtros, Ver Parafernalia, Volver al inicio"],
    
    // 3. ENRUTAMIENTO HACIA LA TIENDA
    ["Quiero conocer la Tienda", "Quiero conocer la Tienda", "¡Abriendo compuertas al hangar principal! ¿A qué sección nos dirigimos?", "Ver Vaporizadores, Ver Bongs, Ver Papelillos y Filtros, Ver Parafernalia"],
    
    ["Ver Parafernalia", "Ver Parafernalia", "Preparando motores de salto...", "[REDIRECCION_TIENDA]"],
    ["Ver Vaporizadores", "Ver Vaporizadores", "Preparando motores de salto hacia Vaporizadores...", "[REDIRECCION_TIENDA]"],
    ["Ver Bongs", "Ver Bongs", "Preparando motores de salto hacia Pipas y Bongs...", "[REDIRECCION_TIENDA]"],
    ["Ver Papelillos y Filtros", "Ver Papelillos y Filtros", "Preparando motores de salto hacia la zona de Enrolado...", "[REDIRECCION_TIENDA]"],
    
    ["Ir a la Tienda", "Ir a la Tienda", "Redirigiendo a la base principal...", "[REDIRECCION_TIENDA]"],

    // 4. MANDO CENTRAL (WHATSAPP Y ENVIOS)
    ["Hablar con el Mando Central", "Hablar con el Mando Central", "Abriendo canal directo con nuestros operadores en Cauquenes. Escribe tu duda y la transmitiremos vía WhatsApp:", "[ESPERAR_TEXTO]"],
    
    ["Volver al inicio", "Volver al inicio", "Volviendo al menú principal. ¿En qué te ayudo?", "Quiero conocer la Tienda, Dudas de Cultivo y Consumo, ¿Quién eres tú Mars?, Hablar con el Mando Central"],
    
    // NODO DEFAULT PARA CAPTURAR TEXTO LIBRE A WHATSAPP
    ["default", "", "Entendido. Transfiriendo tus coordenadas al Mando Central...", "[ESPERAR_TEXTO]"]
];
