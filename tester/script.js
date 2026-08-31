var configGlobal = {};
var productosGlobal = [];
var carrito = [];
var slideIndex = 0;
var sessionUser = null;
let scriptUrl = ""; // <--- PIEZA CLAVE: Se llenará automáticamente

const API_URL = "https://script.google.com/macros/s/AKfycbwpzm-n0UUwvEgYOCtPDE6Z5OJkq4jBracHGXE7i3XHmn9xaolZchSNt8Sy95mGONActA/exec";

async function ejecutarEnServidor(action, data = null) {
    const url = `${API_URL}?action=${action}`;
    const options = {
        method: data ? "POST" : "GET",
        mode: "cors"
    };
    if (data) {
        options.body = JSON.stringify(data);
        // Usamos text/plain para evitar problemas de CORS en navegadores
        options.headers = { "Content-Type": "text/plain;charset=utf-8" };
    }
    try {
        const response = await fetch(url, options);
        return await response.json();
    } catch (error) {
        console.error("Error en conexión con el servidor:", error);
        throw error;
    }
}
/**
 * INICIALIZACIÓN DEL SISTEMA
 */
document.addEventListener('DOMContentLoaded', async function() {
  console.log("Iniciando Secuencia de Despegue Escalonado...");

  try {
    // 1. CARGA MASIVA AL SERVIDOR
    const data = await ejecutarEnServidor("getInitialData");

    // 2. PRIORIDAD 1 (0 ms): Configuración, Anuncio y Redes
    configGlobal = data.config;
    aplicarEstilosDinamicos(configGlobal);
    renderSocialIcons(); // FOCUS: Conectamos la función evolucionada correcta
    if (typeof verificarAnuncio === "function") verificarAnuncio();

    // 3. PRIORIDAD 2 (400 ms): Slider y Auspiciadores (Estética)
    setTimeout(() => {
      const sectionAuspi = document.getElementById('auspiciadores-section');
      const contentAuspi = document.getElementById('marquee-content');
      if (data.auspiciadores && data.auspiciadores.length > 0 && sectionAuspi && contentAuspi) {
        sectionAuspi.style.display = 'block';
        let logosHtml = data.auspiciadores.map(a => `<img src="${a.logo}" alt="${a.nombre}" title="${a.nombre}" onerror="this.style.display='none'">`).join('');
        contentAuspi.innerHTML = (data.auspiciadores.length > 5) ? logosHtml + logosHtml : logosHtml;
        if (data.auspiciadores.length > 5) contentAuspi.classList.add('scrolling');
      }

      const containerSlider = document.getElementById('hero-slider');
      if (data.destacados && data.destacados.length > 0 && containerSlider) {
        containerSlider.innerHTML = data.destacados.map((s, i) => `
          <div class="slide ${i === 0 ? 'active' : ''}">
            <img src="${s.img}" class="img-slide" alt="${s.nombre}" onerror="this.src='https://i.postimg.cc/hj6mws46/Logoew.png'">
            <div class="slide-content">
              <h3 class="amber" style="margin: 0; font-size: 0.9rem; letter-spacing: 2px;">${s.titulo}</h3>
              <h2 style="font-family: var(--font-brand); font-size: 1.8rem; color: white; margin: 5px 0 15px 0; text-shadow: 0 0 10px rgba(255,255,255,0.3);">${s.nombre}</h2>
              <p>${s.desc}</p>
              <div class="price-display" style="color:var(--cian); font-weight:bold; font-size:1.3rem; margin-bottom:15px;">
                $${Number(s.precio).toLocaleString('es-CL')}
              </div>
              <button class="btn-banner-buy" onclick="abrirDetalle('${s.sku}')">
                VER DETALLES <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>
        `).join('') + '<button class="slider-prev" onclick="cambiarSlide(-1)">&#10094;</button><button class="slider-next" onclick="cambiarSlide(1)">&#10095;</button>';
        if (typeof iniciarAnimacionSlider === "function") iniciarAnimacionSlider();
      }
    }, 400);

    // 4. PRIORIDAD 3 (800 ms): Catálogo Completo y Filtros
    setTimeout(() => {
      productosGlobal = data.productos;
      const loadingMsg = document.getElementById('loading-msg');
      if(loadingMsg) loadingMsg.remove();
      if (typeof renderProductos === "function") renderProductos(productosGlobal);
      if (typeof generarMenuCategorias === "function") generarMenuCategorias(productosGlobal);

    // FOCUS: Sensor de enlaces desde la Link Page
      const params = new URLSearchParams(window.location.search);
      if (params.get('cat')) { filtrarPorCat(params.get('cat')); }
      if (params.get('modal') === 'ubicacion') {
          const modUbic = document.getElementById("modal-ubicacion");
          if (modUbic) modUbic.style.display = "flex";
      }
      
      console.log("Nave 100% Desplegada y Operativa.");
    }, 800);

  } catch (error) {
    console.error("Falla en la carga inicial:", error);
  }
});

/**
 * MOTOR DE BÚSQUEDA Y FILTRADO DINÁMICO
 */
function filtrar() {
  const term = document.getElementById('main-search').value.toLowerCase();
  const slider = document.getElementById('hero-slider');

  // Si el usuario empieza a buscar, el slider se va
  if (slider && term.length > 0) {
    slider.style.display = 'none';
  }

  const filtrados = productosGlobal.filter(function(p) {
    return (
      p.NOMBRE.toString().toLowerCase().includes(term) || 
      p.MARCA.toString().toLowerCase().includes(term) || 
      p.CATEGORIA.toString().toLowerCase().includes(term)
    );
  });
  renderProductos(filtrados);
}

/**
 * EVOLUCIÓN: Generación de Menú Desplegable (Dropdown)
 */
function generarMenuCategorias(productos) {
  // Extraemos categorías únicas del listado de productos
  const categorias = [...new Set(productos.map(function(p) { return p.CATEGORIA; }))];
  const dropdown = document.getElementById('category-list'); // Elemento dentro del li.dropdown
  
  if (!dropdown) return;

  // Link "VER TODO" para resetear filtros
  let html = '<a href="#" onclick="filtrarPorCat(\'TODOS\', event)">VER TODO</a>';
  
  // Generación dinámica de los links del dropdown
  html += categorias.map(function(cat) {
    return '<a href="#" onclick="filtrarPorCat(\'' + cat + '\', event)">' + cat.toUpperCase() + '</a>';
  }).join('');
  
  dropdown.innerHTML = html;
}

/**
 * EVOLUCIÓN: Lógica de Filtrado con ocultación de Slider
 */
function filtrarPorCat(cat, e) {
  if (e) e.preventDefault();
  const slider = document.getElementById('hero-slider');
  
  // Regla FOCUS: Cualquier filtro (incluyendo TODOS) oculta el slider
  if (slider) {
    slider.style.display = 'none'; 
  }

  if (cat === 'TODOS') {
    renderProductos(productosGlobal);
  } else {
    const filtrados = productosGlobal.filter(function(p) { return p.CATEGORIA === cat; });
    renderProductos(filtrados);
  }
  
  document.getElementById('grid-productos').scrollIntoView({ behavior: 'smooth' });
}

// Función auxiliar para móviles (clic en la palabra Categorías)
function abrirCategorias() {
  const dropdown = document.querySelector('.dropdown-content');
  if (dropdown) {
    dropdown.style.display = (dropdown.style.display === 'block') ? 'none' : 'block';
  }
}

/**
 * MOTOR DE VITRINA Y MODAL DE DETALLES
 */
function renderProductos(lista) {
  const grid = document.getElementById('grid-productos');
  if (!grid) return;

  if (lista.length === 0) {
    grid.innerHTML = '<p class="no-results" style="grid-column: 1/-1; text-align:center; padding:50px; opacity:0.5;">No hay productos en esta órbita...</p>';
    return;
  }

  grid.innerHTML = lista.map(function(p) {
    const stockBajo = (Number(p.STOCK) < 5);
    const imgUrl = p.IMAGEN_URL || 'https://i.postimg.cc/hj6mws46/Logoew.png';
    // FOCUS: Lógica de etiquetas de promoción
    let promoLabel = '';
    if (p.TIPO_PROMO === 'Descuento') {
        promoLabel = `<div class="scarcity-label" style="background:var(--amber); color:black; top:45px;">OFERTA</div>`;
    } else if (p.TIPO_PROMO === 'Regalo') {
        promoLabel = `<div class="scarcity-label" style="background:var(--cian); color:black; top:45px;">+ REGALO</div>`;
    }
   // FOCUS UX: Calculamos el precio real a mostrar
    let precioMostrar = (p.TIPO_PROMO === 'Descuento' && p.DETALLE_PROMO) ? (Number(p.PRECIO) - Number(p.DETALLE_PROMO)) : Number(p.PRECIO);

    return `
      <div class="product-card" onclick="abrirDetalle('${p.SKU}')">
        ${stockBajo ? '<div class="scarcity-label">STOCK CRÍTICO</div>' : ''}
        ${promoLabel}
        <div style="position: relative;">
          <img src="${imgUrl}" loading="lazy" alt="${p.NOMBRE}" onerror="this.src='https://i.postimg.cc/hj6mws46/Logoew.png'">
          <button class="btn-quick-add" onclick="event.stopPropagation(); agregarAlCarrito('${p.SKU}')" title="Añadir rápido">
            <i class="fas fa-cart-plus"></i>
          </button>
        </div>
        <div class="more-info-btn">MÁS INFO</div>
        <div style="padding:15px; text-align:center;">
          <small style="color:var(--amber); font-weight:bold; letter-spacing: 1px;">${p.MARCA}</small>
          <div style="font-family: var(--font-brand); font-size: 1.2rem; color: var(--neon-green); font-weight: bold; margin: 8px 0;">
            $${precioMostrar.toLocaleString('es-CL')}
          </div>
          <div style="font-size:0.85rem; font-weight:600; color:white; line-height: 1.3;">${p.NOMBRE}</div>
        </div>
      </div>
    `;
  }).join('');
}

let currentImgIndex = 0;
let currentImages = [];

function abrirDetalle(sku) {
    const p = productosGlobal.find(item => String(item.SKU).trim() === String(sku).trim());
    if (!p) return;

    registrarInteresRadar(sku); // Activamos radar de favoritos
    
    // Preparar imágenes
    currentImages = Array.isArray(p.IMAGEN_URL) ? p.IMAGEN_URL : [p.IMAGEN_URL];
    currentImgIndex = 0;

    const detalleBody = document.getElementById('detalle-body');
    const modal = document.getElementById('modal-detalle');

    // Construcción del cuerpo (Scrollable)
    detalleBody.innerHTML = `
        <div class="carousel-container">
            <img src="${currentImages[0]}" id="img-main-detail" class="carousel-img">
            ${currentImages.length > 1 ? `
                <button class="nav-btn prev" onclick="changeImg(-1)">&#10094;</button>
                <button class="nav-btn next" onclick="changeImg(1)">&#10095;</button>
            ` : ''}
        </div>

        <h2 class="cian" style="margin-bottom:5px;">${p.NOMBRE}</h2>
<p style="color:var(--amber); font-weight:bold; font-size:1.2rem; margin-bottom:15px;">
${(p.TIPO_PROMO === 'Descuento' && p.DETALLE_PROMO) ? 
    `<span class="precio-old" style="text-decoration:line-through; color:#888; font-size:0.9rem; margin-right:10px;">$${Number(p.PRECIO).toLocaleString('es-CL')}</span>
     <span class="precio-promo">$${(Number(p.PRECIO) - Number(p.DETALLE_PROMO)).toLocaleString('es-CL')}</span>` : 
    `<span class="precio-promo">$${Number(p.PRECIO).toLocaleString('es-CL')}</span>`
}
</p>
${p.TIPO_PROMO === 'Regalo' ? `<p style="color:var(--cian); font-size:0.8rem; margin-top:-10px; margin-bottom:15px;"><i class="fas fa-gift"></i> Incluye regalo por tu compra</p>` : ''}

        <div class="variantes-container" style="margin-bottom:20px;">
            ${crearSelectorVariante('SABOR', p.SABOR)}
            ${crearSelectorVariante('COLOR', p.COLOR)}
            ${crearSelectorVariante('TAMAÑO', p.TAMANO)}
        </div>

        <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 10px; border-left: 3px solid var(--cian); margin-top: 15px; margin-bottom: 20px;">
            <p class="nave-text" style="text-align:left; line-height:1.6; font-size:0.85rem; white-space: pre-line; margin: 0; color: #ddd;">
                ${p.DESCRIPCION}
            </p>
        </div>
    `;

    // Inyección del Footer Fijo (Donde está el botón)
    // Borramos cualquier footer previo para no duplicar
    const oldFooter = modal.querySelector('.modal-footer-fixed');
    if (oldFooter) oldFooter.remove();

    const footer = document.createElement('div');
    footer.className = 'modal-footer-fixed';
    footer.innerHTML = `
        <button class="btn-checkout" onclick="agregarConVariantes('${p.SKU}')" style="width:100%; margin:0;">
            AÑADIR A CARRO
        </button>
    `;
    modal.querySelector('.modal-content').appendChild(footer);

    modal.style.display = "flex";
}

// Función auxiliar para crear los Selects
function crearSelectorVariante(label, datos) {
    if (!datos || datos.trim() === "") return "";
    const opciones = datos.split(',');
    return `
        <div style="margin-bottom:12px;">
            <label style="font-size:0.65rem; color:#888; display:block; margin-bottom:6px; font-weight:bold;">${label}</label>
            <select id="var-${label.toLowerCase()}" class="nave-input" style="margin-bottom:0; font-size:0.9rem; height:auto; padding: 12px 35px 12px 15px; cursor:pointer;">
                ${opciones.map(opt => `<option value="${opt.trim()}">${opt.trim()}</option>`).join('')}
            </select>
        </div>
    `;
}

// Navegación de imágenes
function changeImg(dir) {
    currentImgIndex += dir;
    if (currentImgIndex < 0) currentImgIndex = currentImages.length - 1;
    if (currentImgIndex >= currentImages.length) currentImgIndex = 0;
    document.getElementById('img-main-detail').src = currentImages[currentImgIndex];
}

function generarHTMLVariante(data, id) {
  if(!data || !data.includes(':')) return '';
  const [titulo, opciones] = data.split(':');
  const lista = opciones.split(',');
  return `
    <label style="font-size:0.7rem; color:#888;">${titulo.toUpperCase()}:</label>
    <select class="variant-select" id="var-${id}">
      ${lista.map(opt => `<option value="${opt.trim()}">${opt.trim()}</option>`).join('')}
    </select>
  `;
}

function registrarInteresRadar(sku) {
  let radar = JSON.parse(localStorage.getItem('weed_radar') || '[]');
  // Guardamos solo los últimos 5 SKUs vistos, sin repetir
  radar = [sku, ...radar.filter(s => s !== sku)].slice(0, 5);
  localStorage.setItem('weed_radar', JSON.stringify(radar));
}

/**
 * MOTOR DE CARRITO DE COMPRAS
 */
function toggleCart(e) {
  
  // 1. EL FRENO: Detiene la navegación hacia la página blanca (#)
  if (e && e.preventDefault) e.preventDefault();
  
  const drawer = document.getElementById('cart-drawer');
  if (drawer) {
    drawer.classList.toggle('active');
    console.log("Carrito activado/desactivado");
  } else {
    console.error("Error: No se encontró el contenedor cart-drawer");
  }
}

function agregarAlCarrito(sku, variantes = "") {
  const p = productosGlobal.find(function(x) { return x.SKU == sku; });
  
  // Seguro FOCUS: si no encuentra el producto, aborta para no romper la web
  if (!p) return;

  // FOCUS: Buscamos si ya existe el mismo producto CON LA MISMA VARIANTE exacta
  const itemExistente = carrito.find(function(item) { 
      return item.sku === sku && item.variantes === variantes; 
  });

  if (itemExistente) {
    itemExistente.cantidad++;
  } else {
    // Cálculo de precio real
    let precioFinal = (p.PRECIO_PROMO && Number(p.PRECIO_PROMO) > 0) ? Number(p.PRECIO_PROMO) : Number(p.PRECIO);
    if (p.TIPO_PROMO === 'Descuento' && p.DETALLE_PROMO) {
        precioFinal = Number(p.PRECIO) - Number(p.DETALLE_PROMO);
    }
    
    carrito.push({
      sku: p.SKU,
      nombre: p.NOMBRE + (variantes ? " [" + variantes + "]" : ""),
      variantes: variantes, 
      precio: precioFinal,
      cantidad: 1
    });

    // LÓGICA DE REGALO (Faltaba en tu función)
    // Busca el producto regalado y lo añade a precio $0
    if (p.TIPO_PROMO === 'Regalo' && p.DETALLE_PROMO) {
      const regalo = productosGlobal.find(function(it) { return it.SKU === p.DETALLE_PROMO; });
      if (regalo) {
        carrito.push({
          sku: regalo.SKU + "-REGALO",
          nombre: "REGALO: " + regalo.NOMBRE,
          variantes: "",
          precio: 0,
          cantidad: 1
        });
      }
    }
  }

  actualizarUI();
  cerrarModal();
  mostrarToast("+1 " + p.NOMBRE + " en el carro");
}

function actualizarUI() {
  const totalItems = carrito.reduce(function(sum, item) { return sum + item.cantidad; }, 0);
  
  // 1. Actualiza contador del menú superior
  document.getElementById('cart-count').innerText = totalItems;
  
  // 2. Sincroniza burbuja flotante (Novedad FOCUS)
  const countBubble = document.getElementById('cart-count-bubble');
  if(countBubble) {
    countBubble.innerText = totalItems;
    // Ocultar si está vacío para no generar "ruido visual" innecesario
    countBubble.style.display = totalItems > 0 ? 'flex' : 'none';
  }
  
  renderCarrito();
  actualizarTotalCarrito();
}

function renderCarrito() {
  const container = document.getElementById('cart-items');
  if (carrito.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:40px; opacity:0.4;">Tu carro está vacío...</p>';
    return;
  }

  container.innerHTML = carrito.map(function(item, index) {
    return `
      <div class="cart-item">
        <div style="flex:1;">
          <div style="font-weight:600; font-size:0.85rem; color:white;">${item.nombre}</div>
          <small style="color:var(--cian);">$${item.precio.toLocaleString('es-CL')}</small>
        </div>
        <div class="cart-item-actions" style="display:flex; align-items:center; gap:8px;">
          <button class="btn-qty" onclick="cambiarCantidad(${index}, -1)">-</button>
          <span style="font-size:0.8rem; font-weight:bold; min-width:15px; text-align:center; color:white;">${item.cantidad}</span>
          <button class="btn-qty" onclick="cambiarCantidad(${index}, 1)">+</button>
          <button class="btn-del" onclick="eliminarDelCarrito(${index})"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

function cambiarCantidad(index, delta) {
  carrito[index].cantidad += delta;
  if (carrito[index].cantidad <= 0) {
    eliminarDelCarrito(index);
  } else {
    actualizarUI();
  }
}

function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  actualizarUI();
}

function actualizarTotalCarrito() {
  let subtotal = carrito.reduce(function(sum, item) { return sum + (item.precio * item.cantidad); }, 0);
  
  // FOCUS: MOTOR DE DESCUENTO
  if (miCuponValidado && miCuponValidado.pct > 0) {
      let descuento = 0;
      if (miCuponValidado.sku === "TODOS" || !miCuponValidado.sku) {
          // Descuento a todo el carro
          descuento = subtotal * (miCuponValidado.pct / 100);
      } else {
          // Descuento solo a productos de un SKU específico
          carrito.forEach(item => {
              if (item.sku.startsWith(miCuponValidado.sku)) {
                  descuento += (item.precio * item.cantidad) * (miCuponValidado.pct / 100);
              }
          });
      }
      subtotal = subtotal - Math.round(descuento);
  }

  const necesitaEnvio = document.getElementById('chk-envio').checked;
  const costoEnvio = necesitaEnvio ? Number(configGlobal['COSTO_ENVIO'] || 3500) : 0;
  
  const direccionInput = document.getElementById('direccion-envio');
  if(direccionInput) direccionInput.style.display = necesitaEnvio ? 'block' : 'none';
  
  document.getElementById('cart-total-value').innerText = '$' + (subtotal + costoEnvio).toLocaleString('es-CL');
}

function vaciarCarrito() {
    carrito = [];
    actualizarUI();
    console.log("Órbita despejada: Carrito vaciado con éxito.");
}

async function procesarCompra() {
  if (carrito.length === 0) return;

  const metodoInput = document.querySelector('input[name="metodo-pago"]:checked');
  if (!metodoInput) return mostrarToast("Por favor, selecciona un método de pago.");
  const metodo = metodoInput.value;

  const btn = document.querySelector('.btn-checkout');
  const originalText = btn.innerHTML;
  btn.innerText = "PREPARANDO DESPEGUE...";
  btn.disabled = true;

  const necesitaEnvio = document.getElementById('chk-envio').checked;
  const subtotal = calcularSubtotal(); 
  const envioVal = necesitaEnvio ? 3500 : 0;
  const direccion = document.getElementById('direccion-envio').value;

  if (necesitaEnvio && !direccion) {
    alert("Por favor, ingresa tu dirección para el envío.");
    btn.innerHTML = originalText;
    btn.disabled = false;
    return;
  }

  const pedido = {
    nombreCliente: sessionUser ? sessionUser.nombre : "Cliente Web",
    email: sessionUser ? sessionUser.email : "N/A",
    resumenProductos: carrito.map(i => i.nombre + " (x" + i.cantidad + ")").join(', '),
    items: carrito,
    subtotal: subtotal,
    necesitaEnvio: necesitaEnvio,
    totalFinal: subtotal + envioVal,
    direccion: necesitaEnvio ? direccion : "Retiro en Local",
    metodoPago: metodo,
    cuponActivo: miCuponValidado ? miCuponValidado.codigo : null
  };

  try {
    if (metodo === 'mercadopago') {
      const res = await ejecutarEnServidor("pagar", pedido);
      if(res.success) {
        mostrarToast("Redirigiendo a pago seguro...");
        window.location.href = res.init_point;
      } else {
        mostrarToast("Error MP: " + res.msg);
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    } 
    else {
      // --- NUEVO FLUJO UX PARA TRANSFERENCIAS ---
      const res = await ejecutarEnServidor("registrarPedido", pedido);
      
      if(res.success || res.id) {
        const num = (configGlobal['WHATSAPP_ADMIN'] || '569').toString().replace(/\D/g, '');
        const msg = `🚀 *NUEVO PEDIDO ESPACIO WEED*\n📌 *ID:* ${res.id || 'N/A'}\n---\n🛒 *Productos:* ${pedido.resumenProductos}\n💰 *Total a Transferir:* $${pedido.totalFinal.toLocaleString('es-CL')}\n🚚 *Envío:* ${pedido.direccion}\n\n*Hola, aquí está el comprobante de mi transferencia.*`;
        
        // 1. Llenamos los datos del modal dinámicamente desde la Configuración
        document.getElementById('mt-id-pedido').innerText = res.id || 'N/A';
        document.getElementById('mt-total').innerText = "$" + pedido.totalFinal.toLocaleString('es-CL');
        
        const bancoCompleto = (configGlobal['BANCO_NOMBRE'] || '---') + " (" + (configGlobal['BANCO_TIPO'] || '---') + ")";
        document.getElementById('mt-banco').innerText = bancoCompleto;
        document.getElementById('mt-rut').innerText = configGlobal['BANCO_RUT'] || '---';
        document.getElementById('mt-numero').innerText = configGlobal['BANCO_NUMERO'] || '---';
        document.getElementById('mt-email').innerText = configGlobal['BANCO_CORREO'] || '---';
        
        // 2. Preparamos el link de WhatsApp en el botón verde
        document.getElementById('mt-btn-wa').href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg);

        // 3. Vaciamos el carrito y ocultamos la barra lateral silenciosamente
        vaciarCarrito(); 
        document.getElementById('cart-drawer').classList.remove('active');
        
        // 4. Mostramos la obra de arte (El nuevo Modal)
        document.getElementById('modal-transferencia-checkout').style.display = 'flex';
        
        btn.innerHTML = originalText;
        btn.disabled = false;
      } else {
        mostrarToast("Error BD: " + (res.mensaje || "Falla al registrar."));
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    }
  } catch(err) {
    mostrarToast("Falla de conexión con el servidor.");
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Controladores del nuevo Modal de Transferencia
function cerrarModalTransferenciaCheckout() {
    document.getElementById('modal-transferencia-checkout').style.display = 'none';
    location.reload(); // Recarga limpia al cerrar
}

function cerrarModalTransferenciaCheckoutYRecargar() {
    // Le da 1 segundo al navegador para abrir la pestaña de WhatsApp antes de recargar la tienda
    setTimeout(() => { location.reload(); }, 1000);
}

function irWhatsApp() {
  const num = (configGlobal['WHATSAPP_ADMIN'] || '56984569569').toString().replace(/\D/g, '');
  const url = 'https://wa.me/' + num + '?text=' + encodeURIComponent('Hola Espacio Weed, necesito información sobre un productos.');
  window.open(url, '_blank');
}

// CONTROL DEL SLIDER (Navegación y Automático)
var sliderInterval; // Variable para detener el auto-play al hacer clic

function iniciarAnimacionSlider() {
  const slides = document.querySelectorAll('.slide');
  if (slides.length <= 1) return;
  
  // Reiniciamos el auto-play
  if(sliderInterval) clearInterval(sliderInterval);
  sliderInterval = setInterval(function() {
    cambiarSlide(1); // Avanzar automáticamente cada 5 seg
  }, 5000);
}

function cambiarSlide(delta) {
  const slides = document.querySelectorAll('.slide');
  if (slides.length <= 1) return;

  // Ocultamos la slide actual
  slides[slideIndex].classList.remove('active');
  
  // Calculamos el nuevo índice (cíclico: si llega al final, vuelve al inicio)
  slideIndex = (slideIndex + delta + slides.length) % slides.length;
  
  // Mostramos la nueva slide
  slides[slideIndex].classList.add('active');
  
  // Neuro-Marketing: Si el usuario interactúa, reiniciamos el temporizador para no interrumpir su lectura.
  reiniciarTemporizadorSlider();
}

function reiniciarTemporizadorSlider() {
  clearInterval(sliderInterval);
  sliderInterval = setInterval(function() {
    cambiarSlide(1);
  }, 8000); // Damos un poco más de tiempo (8s) tras la interacción.
}

function mostrarToast(msj) {
  const t = document.getElementById('toast');
  if(!t) return;
  t.innerText = msj;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 3000);
}

function cerrarModal() { document.getElementById('modal-detalle').style.display = 'none'; }
/**
 * MOTOR DE LA COMUNIDAD: CONTROL DE ACCESO
 * Evolución: Gestión de vistas de Login, Registro y Recuperación.
 */
/**
 * FUNCIÓN: MOSTRAR ACCESO INTELIGENTE
 * Decide si mostrar el Login o el Dashboard según el estado de la sesión.
 */
function mostrarAcceso(e) {
    if (e) e.preventDefault();
    
    const portal = document.getElementById('comunidad-portal');
    if (!portal) return console.error("Error: Portal de comunidad no encontrado.");

    portal.style.display = 'flex';

    // EL SENSOR: Si ya hay sesión, saltamos directo al Dashboard
    if (sessionUser) {
        console.log("Usuario detectado. Abriendo Dashboard directamente...");
        cargarDashboard(); 
    } else {
        console.log("Navegante anónimo. Abriendo Login...");
        cambiarVistaComunidad('login');
    }
}

function cerrarComunidad() {
    const portal = document.getElementById('comunidad-portal');
    if(portal) portal.style.display = 'none';
}

// Cierre táctil: si el usuario hace clic fuera de la tarjeta, vuelve a la expedición
window.onclick = function(event) {
    const portal = document.getElementById('comunidad-portal');
    const modal = document.getElementById('modal-detalle');
    
    if (event.target == portal) cerrarComunidad();
    if (event.target == modal) cerrarModal();
}

/**
 * FUNCIÓN QUIRÚRGICA: VOLVER AL INICIO
 * Propósito: Limpiar filtros, buscador y restaurar el Hero-Slider.
 */
function volverInicio(e) {
    // 1. Freno de seguridad: evita que el enlace '#' intente navegar
    if (e) e.preventDefault();

    console.log("Reseteando órbita: Volviendo al estado inicial...");

    // 2. Restaurar el Hero-Slider (Destacados)
    const slider = document.getElementById('hero-slider');
    if (slider) {
        slider.style.display = 'flex';
        // Reiniciamos la animación por si estaba pausada
        iniciarAnimacionSlider();
    }

    // 3. Limpiar el cuadro de búsqueda
    const searchInput = document.getElementById('main-search');
    if (searchInput) {
        searchInput.value = '';
    }

    // 4. Renderizar la vitrina completa con todos los productos
    if (productosGlobal && productosGlobal.length > 0) {
        renderProductos(productosGlobal);
    }

    // 5. Feedback visual: subida suave a la cima de la expedición
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    // 6. Notificación sutil al usuario
    mostrarToast("¡De vuelta a la base!");
}

async function ejecutarLogin() {
  // FOCUS: Escudo Anti-Bot
  if (document.getElementById('trampa-bot-login').value !== "") return;

  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-pass').value;

  if (!email || !pass) return mostrarToast("Ingresa tus coordenadas de acceso.");

  mostrarToast("Verificando coordenadas...");

  try {
    const res = await ejecutarEnServidor("login", { email: email, pass: pass });
    if(res.success) {
      sessionUser = res.user;
      localStorage.setItem('weed_session', JSON.stringify(res.user));
      cargarDashboard();
    } else {
      mostrarToast(res.msg);
    }
  } catch(e) {
    mostrarToast("Error de conexión al ingresar.");
  }
}

async function ejecutarRegistro() {
  // FOCUS: Escudo Anti-Bot
  if (document.getElementById('trampa-bot-registro').value !== "") return;

  // FOCUS: Validación de Consentimiento Expreso (Ley 21.719)
  if (!document.getElementById('reg-acepto-terminos').checked) {
      mostrarToast("Debes aceptar las políticas de privacidad para unirte.");
      return;
  }

  const datos = {
    nombre: document.getElementById('reg-nombre').value,
    email: document.getElementById('reg-email').value,
    pass: document.getElementById('reg-pass').value,
    passConf: document.getElementById('reg-pass-conf').value,
    pregunta: document.getElementById('reg-pregunta').value,
    respuesta: document.getElementById('reg-respuesta').value
  };

  if (!datos.nombre || !datos.email || !datos.pass) {
    return mostrarToast("Faltan datos en el radar.");
  }

  if(datos.pass !== datos.passConf) {
    return mostrarToast("Las claves no coinciden.");
  }

  mostrarToast("Inyectando datos a la Comunidad...");

  try {
    const res = await ejecutarEnServidor("registrarUsuario", datos);
    mostrarToast(res.msg);
    if(res.success) {
      cambiarVistaComunidad('login');
    }
  } catch(e) {
    mostrarToast("Error de conexión al registrarte.");
  }
}

var sugIndex = 0;

async function cargarDashboard() {
  cambiarVistaComunidad('dashboard');

  // Sincronización de Identidad
  const linkAvatar = (sessionUser && sessionUser.avatar) ? sessionUser.avatar : 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Space1';
  if (document.getElementById('user-avatar')) document.getElementById('user-avatar').src = linkAvatar;
  document.getElementById('user-name-display').innerText = sessionUser.nombre;

  // --- ESCÁNER DE RANGO ---
  const toolsGrid = document.querySelector('.tools-grid');
  if (sessionUser && sessionUser.rol === "Admin") {
    console.log("¡Rango Admin Detectado!");
    let btnAdmin = document.getElementById('btn-admin-portal');
    if(!btnAdmin) {
      btnAdmin = document.createElement('button');
      btnAdmin.id = 'btn-admin-portal';
      btnAdmin.className = 'tool-btn';
      btnAdmin.style.borderColor = 'var(--amber)';
      btnAdmin.style.color = 'var(--amber)';
      btnAdmin.innerHTML = '<i class="fas fa-user-shield"></i> PANEL ADMIN';
      btnAdmin.onclick = function() {
        // CORRECCIÓN GITHUB: Ahora abre tu archivo admin.html físico
        window.open("admin.html", "_blank"); 
      };
      toolsGrid.appendChild(btnAdmin);
    }
  }

  // --- LÓGICA DE RADAR VS SUGERENCIAS (MANTENIDA) ---
  const radarSkus = JSON.parse(localStorage.getItem('weed_radar') || '[]');
  const titulo = document.getElementById('titulo-sugerencias');

  try {
    if (radarSkus.length > 0) {
      if(titulo) titulo.innerText = "CONTINUAR VIENDO...";
      const productosRadar = await ejecutarEnServidor("obtenerProductosPorLista", { skus: radarSkus });
      renderRadar(productosRadar);
    } else {
      if(titulo) titulo.innerText = "SUGERENCIAS PARA TI";
      const dataDash = await ejecutarEnServidor("getDashboardData", { email: sessionUser.email });
      renderSugerenciasDinamicas(dataDash);
    }
  } catch (err) {
    console.error("Falla de radar/sugerencias:", err);
  }
}

function iniciarAutoSugerencias(total) {
    setInterval(() => {
        sugIndex = (sugIndex + 1) % total;
        irASugerencia(sugIndex);
    }, 4000);
}

function irASugerencia(index) {
    sugIndex = index;
    document.querySelectorAll('.sugerencia-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.dot').forEach(el => el.classList.remove('active'));
    
    document.getElementById('sug-' + index).classList.add('active');
    document.querySelectorAll('.dot')[index].classList.add('active');
}

function cambiarVistaComunidad(vista, e) {
    if (e) e.preventDefault();

    // 1. APAGÓN TOTAL: Ocultamos todas las secciones posibles
    const secciones = ['login-section', 'registro-section', 'recuperar-section', 'dashboard-section', 'perfil-section', 'pagos-section', 'historial-section', 'buzon-section'];
    secciones.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // 2. ENCENDIDO ÚNICO: Mostramos solo la solicitada
    const destino = document.getElementById(vista + '-section');
    if (destino) {
        destino.style.display = 'block';
        console.log("Cambiando vista a: " + vista);
    } else {
        console.error("Error: No se encontró la sección " + vista + "-section");
    }

    if (vista === 'perfil') generarListaAvatares();
}

function generarListaAvatares() {
    const container = document.getElementById('avatar-list');
    if(!container) return;
    let html = '';
    for(let i=1; i<=20; i++) {
        const url = 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Space' + i;
        html += '<img src="' + url + '" class="avatar-opt" onclick="seleccionarAvatar(\'' + url + '\')">';
    }
    container.innerHTML = html;
}

function logout() {
    localStorage.removeItem('weed_session');
    sessionUser = null;
    cambiarVistaComunidad('login');
    actualizarInterfazSesion();
}

/**
 * LÓGICA DE RECUPERACIÓN DE CONTRASEÑA
 */
async function buscarPregunta() {
  const email = document.getElementById('recover-email').value;
  if (!email) return mostrarToast("Ingresa un email para rastrear.");

  mostrarToast("Buscando explorador...");

  try {
    const res = await ejecutarEnServidor("obtenerPreguntaSeguridad", { email: email });
    if (res.success) {
      // Mostramos la pregunta y pasamos al paso 2
      document.getElementById('display-pregunta').innerText = "PREGUNTA: " + res.pregunta;
      document.getElementById('recover-step-1').style.display = 'none';
      document.getElementById('recover-step-2').style.display = 'block';
      mostrarToast("Pregunta encontrada.");
    } else {
      mostrarToast(res.msg);
    }
  } catch (err) {
    mostrarToast("Falla de conexión con la base de datos.");
  }
}

async function validarRespuesta() {
  const email = document.getElementById('recover-email').value;
  const respuesta = document.getElementById('recover-respuesta').value;

  if (!respuesta) return mostrarToast("Escribe la respuesta.");

  mostrarToast("Generando nuevas coordenadas...");

  try {
    const res = await ejecutarEnServidor("validarRespuestaSeguridad", { email: email, respuesta: respuesta });
    if (res.success) {
      // FEEDBACK MODERNO: Sin alerts feos
      mostrarToast("🚀 ¡Clave enviada con éxito! Revisa tu correo.");

      // Esperamos 3 segundos para que lea el mensaje y volvemos al login
      setTimeout(function() {
        cambiarVistaComunidad('login');
        // Limpiamos todo
        document.getElementById('recover-step-1').style.display = 'block';
        document.getElementById('recover-step-2').style.display = 'none';
        document.getElementById('recover-email').value = '';
        document.getElementById('recover-respuesta').value = '';
      }, 3000);
    } else {
      mostrarToast(res.msg);
    }
  } catch (err) {
    mostrarToast("Falla de validación en red.");
  }
}

/**
 * MOTOR DE PERFIL: CARGA Y AVATARES
 */
function abrirPerfil() {
    // Reemplaza dashboard por perfil
    cambiarVistaComunidad('perfil');
    
    if(sessionUser) {
        document.getElementById('edit-nombre').value = sessionUser.nombre;
        document.getElementById('edit-email').value = sessionUser.email;
        document.getElementById('edit-pregunta').value = sessionUser.pregunta || "¿Nombre de tu mascota?";
        document.getElementById('edit-respuesta').value = sessionUser.respuesta || "";
    }
}

function generarListaAvatares() {
    const container = document.getElementById('avatar-list');
    if (!container) return;
    
    let html = '';
    for (let i = 1; i <= 20; i++) {
        const url = 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Space' + i;
        // Si es el que ya tiene el usuario, le ponemos borde neón
        const clase = (sessionUser.avatar === url) ? 'avatar-opt seleccionado' : 'avatar-opt';
        html += '<img src="' + url + '" class="' + clase + '" onclick="seleccionarAvatar(\'' + url + '\', event)">';
    }
    container.innerHTML = html;
}

function seleccionarAvatar(url) {
    // Feedback visual inmediato
    const todos = document.querySelectorAll('.avatar-opt');
    todos.forEach(img => img.style.borderColor = 'transparent');
    event.target.style.borderColor = 'var(--neon-green)';
    
    // Guardamos temporalmente la elección
    avatarTemporal = url; 
    mostrarToast("Identidad visual seleccionada.");
}

var avatarTemporal = "";

async function guardarCambiosPerfil() {
  // Verificamos que tengamos al usuario en memoria
  if (!sessionUser) return mostrarToast("Error: Sesión no encontrada.");

  const datos = {
    email: sessionUser.email,
    nombre: document.getElementById('edit-nombre').value,
    pregunta: document.getElementById('edit-pregunta').value,
    respuesta: document.getElementById('edit-respuesta').value,
    avatar: avatarTemporal || sessionUser.avatar
  };

  mostrarToast("Sincronizando coordenadas...");

  try {
    // FOCUS: Reemplazo exacto del motor manteniendo tu objeto 'datos'
    const res = await ejecutarEnServidor("actualizarDatosPerfil", datos);
    
    if (res.success) {
      // Actualizamos los datos en el navegador para que el cambio sea instantáneo
      sessionUser.nombre = datos.nombre;
      sessionUser.avatar = datos.avatar;
      
      // Persistencia en memoria local
      localStorage.setItem('weed_session', JSON.stringify(sessionUser));

      mostrarToast("¡Perfil actualizado con éxito!");

      // Volvemos automáticamente al dashboard para ver el cambio
      setTimeout(function() {
        cambiarVistaComunidad('dashboard');
        document.getElementById('user-avatar').src = sessionUser.avatar;
        document.getElementById('user-name-display').innerText = sessionUser.nombre;
      }, 1500);
    } else {
      mostrarToast("Error en el servidor: " + res.msg);
    }
  } catch (err) {
    mostrarToast("Falla de conexión: " + err);
  }
}
    
function mostrarPagos(e) {
  if (e && e.preventDefault) e.preventDefault();
  const modal = document.getElementById('modal-pagos-unique');

  if (modal) {
    // Unimos el Nombre del Banco y el Tipo de Cuenta en una sola línea
    const bancoCompleto = (configGlobal['BANCO_NOMBRE'] || '---') + " (" + (configGlobal['BANCO_TIPO'] || '---') + ")";
    
    document.getElementById('ind-pago-banco').innerText = bancoCompleto;
    document.getElementById('ind-pago-rut').innerText = configGlobal['BANCO_RUT'] || '---';
    document.getElementById('ind-pago-numero').innerText = configGlobal['BANCO_NUMERO'] || '---';
    document.getElementById('ind-pago-email').innerText = configGlobal['BANCO_CORREO'] || '---';

    modal.style.display = 'flex';
  }
}

function cerrarModalPagos() {
    document.getElementById('modal-pagos-unique').style.display = 'none';
}

/**
 * FUNCIÓN: VOLVER AL INICIO DESDE DASHBOARD
 * Cierra la Nave y actualiza el saludo en la pantalla principal.
 */
function volverInicioDesdeDashboard(e) {
    if (e) e.preventDefault();
    
    // 1. Cerramos el portal de comunidad
    cerrarComunidad();
    
    // 2. Ejecutamos la actualización de la interfaz principal
    actualizarInterfazSesion();
    
    // 3. Feedback visual
    mostrarToast("¡Bienvenido de vuelta a la expedición, " + sessionUser.nombre.split(' ')[0] + "!");
}

/**
 * FUNCIÓN: ACTUALIZAR INTERFAZ SESIÓN
 * Muestra u oculta el nombre del usuario en la barra superior de la web.
 */
function actualizarInterfazSesion() {
    const welcomeCard = document.getElementById('user-welcome-card');
    const nameSpan = document.getElementById('main-user-name');
    
    // Buscamos el enlace del menú por su función onclick
    const accesoLink = document.querySelector('a[onclick="mostrarAcceso(event)"]');
    
    if (sessionUser) {
        // 1. Mostrar cápsula de bienvenida en el TopBar
        if (welcomeCard) welcomeCard.style.display = 'flex';
        if (nameSpan) nameSpan.innerText = "EXPLORADOR: " + sessionUser.nombre.toUpperCase();
        
        // 2. Cambiar etiqueta del Menú a MI PANEL
        if (accesoLink) accesoLink.innerHTML = 'MI PANEL <i class="fas fa-user-check" style="font-size:0.6rem; margin-left:5px;"></i>';
    } else {
        // 3. Resetear si no hay sesión
        if (welcomeCard) welcomeCard.style.display = 'none';
        if (accesoLink) accesoLink.innerText = "ACCESO";
    }
}

/**
 * MOTOR DE HISTORIAL DE EXPEDICIONES
 * Renderiza los últimos 10 carritos con lógica de estados y re-compra.
 */
async function mostrarHistorial() {
  if (!sessionUser) return;
  
  // 1. CORRECCIÓN FOCUS: Cambiamos la vista para que el cliente VEA la pantalla
  cambiarVistaComunidad('historial');
  
  // 2. CORRECCIÓN FOCUS: El ID exacto que tienes en tu HTML (Línea 1267)
  const container = document.getElementById('lista-historial');
  if (!container) return;

  container.innerHTML = "<div class='loading-spinner-small'></div><p style='text-align:center; font-size:0.8rem;'>Rastreando registros pasados...</p>";

  try {
    const res = await ejecutarEnServidor("obtenerHistorial", { email: sessionUser.email });

    if (res && res.length > 0) {
      // 3. CORRECCIÓN FOCUS: Usar las variables exactas que devuelve tu Codigo.gs (Líneas 4824-4828)
      container.innerHTML = res.map(v => `
        <div class="historial-item" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; border: 1px solid var(--glass);">
          <div class="h-info" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span class="h-id" style="color:var(--cian); font-weight:bold; font-size: 0.85rem;">${v.skuMaestro}</span>
            <span class="h-date" style="color:#888; font-size: 0.7rem;">${v.fecha}</span>
          </div>
          <div class="h-details" style="display: flex; justify-content: space-between; align-items: center;">
            <div class="h-total" style="font-family:var(--font-brand); font-size: 1.1rem; color:var(--amber);">$${Number(v.total).toLocaleString('es-CL')}</div>
            <div class="h-status" style="font-size: 0.75rem; font-weight: bold; background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 4px;">${v.estado}</div>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = `
        <div style="text-align:center; padding:30px; color:#555;">
          <i class="fas fa-box-open" style="font-size:2rem; margin-bottom:10px; opacity:0.3;"></i>
          <p>Aún no has realizado compras en esta dimensión.</p>
        </div>`;
    }
  } catch (e) {
    console.error("Falla en el historial:", e);
    container.innerHTML = "<p style='color:var(--amber); text-align:center;'>Error al conectar con la base de datos.</p>";
  }
}

// LA FUNCIÓN MÁGICA: Desglosa el SKU Maestro y llena el carrito real
function recomprarDesdeSKUMaestro(receta) {
    if(!receta || receta.length === 0) return;
    
    mostrarToast("Inyectando suministros al carrito...");
    
    receta.forEach(item => {
        // Buscamos el producto por su SKU original ('s') e insertamos según cantidad ('q')
        for(let i = 0; i < item.q; i++) {
            agregarAlCarrito(item.s);
        }
    });

    cerrarComunidad();
    toggleCart();
    mostrarToast("¡Carrito reconstruido con éxito!");
}

function mostrarBuzon() {
    cambiarVistaComunidad('buzon');
    // FOCUS: Cargamos los mensajes inmediatamente al entrar
    cargarChat();
    
    // Contador de caracteres dinámico (Línea 2262)
    setTimeout(() => {
        const input = document.getElementById('msg-input');
        if(input) {
            input.oninput = function() {
                document.getElementById('char-count').innerText = this.value.length + "/250";
            };
        }
    }, 50);
}

async function cargarChat() {
  if (!sessionUser) return;
  const container = document.getElementById('chat-messages');
  if (!container) return;

  try {
    // FOCUS: Petición al servidor mediante el nuevo motor fetch
    const res = await ejecutarEnServidor("obtenerMensajes", { email: sessionUser.email });
    
    if (res && res.length > 0) {
      container.innerHTML = res.map(m => `
        <div class="message ${m.EMISOR === 'ADMIN' ? 'admin' : 'user'}">
          <div class="msg-bubble">${m.MENSAJE}</div>
          <div class="msg-time">${m.FECHA}</div>
        </div>
      `).join('');
      // FOCUS: Micro-pausa para asegurar que el HTML se dibujó antes de bajar
      setTimeout(() => { container.scrollTop = container.scrollHeight; }, 100);
    } else {
      container.innerHTML = '<p style="text-align:center; color:#666; font-size:0.8rem; margin-top:20px;">No hay transmisiones aún. ¡Inicia el contacto!</p>';
    }
  } catch (e) {
    console.error("Error en el sensor de mensajes:", e);
  }
}

async function ejecutarEnvioMensaje() {
  const input = document.getElementById('msg-input');
  if(!input) return;
  const msg = input.value.trim();
  if(!msg || !sessionUser) return;

  // FOCUS: Bloqueo visual para evitar doble envío
  input.disabled = true;
  input.placeholder = "Transmitiendo...";

  try {
    const res = await ejecutarEnServidor("enviarMensaje", { emisor: sessionUser.email, mensaje: msg });
    if(res.success) {
      input.value = '';
      input.disabled = false;
      input.placeholder = "Escribe tu mensaje...";
      document.getElementById('char-count').innerText = "0/250";
      // FOCUS: Recargamos el chat para ver nuestro propio mensaje enviado
      cargarChat();
    }
  } catch(e) {
    console.error("Error al enviar msj:", e);
    input.disabled = false;
    input.placeholder = "Error. Intenta de nuevo.";
  }
}

function calcularSubtotal() {
    return carrito.reduce((sum, item) => sum + (Number(item.precio) * item.cantidad), 0);
}

/**
 * SENSOR DE RETORNO DE MERCADO PAGO (SENSOR FOCUS)
 */
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const paymentId = urlParams.get('payment_id');
    const externalRef = urlParams.get('external_reference');

    if (status === 'approved' && paymentId && externalRef) {
        // Esta función llama al WhatsApp con el link del comprobante
        enviarWhatsAppPostPago(externalRef, paymentId);
    }
});

function enviarWhatsAppPostPago(idPedido, idTransaccion) {
    const num = (configGlobal['WHATSAPP_ADMIN'] || '569').toString().replace(/\D/g, '');
    const comprobanteUrl = "https://www.mercadopago.cl/payments/" + idTransaccion + "/receipt";
    const msg = "🚀 *¡PAGO CONFIRMADO ESPACIO WEED!*\n\n📌 *ID Pedido:* " + idPedido + "\n🧾 *Comprobante:* " + comprobanteUrl + "\n\n*Hola, acabo de pagar. Coordinemos el retiro/envío.*";
    
    mostrarToast("¡Pago detectado! Abriendo WhatsApp...");
    setTimeout(() => {
        window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(msg), '_blank');
        window.history.replaceState({}, document.title, window.location.pathname);
    }, 2000);
}

// --- LÓGICA MÓDULO SOPORTE EVOLUCIONADO ---
function abrirSoporte() { document.getElementById('modal-soporte').style.display = 'flex'; }
function cerrarSoporte() { document.getElementById('modal-soporte').style.display = 'none'; }

function actualizarLabelSoporte(input) {
    const label = document.getElementById('lbl-sp-foto');
    if (input.files && input.files.length > 0) {
        label.innerHTML = '<i class="fas fa-check"></i> IMAGEN LISTA: ' + input.files[0].name;
        label.style.borderColor = 'var(--neon-green)';
        label.style.color = 'var(--neon-green)';
    } else {
        label.innerHTML = '<i class="fas fa-camera"></i> ADJUNTAR IMAGEN (MÁX 4MB)';
        label.style.borderColor = 'var(--cian)';
        label.style.color = 'var(--cian)';
    }
}

function enviarSolicitudSoporte() {
  const nombre = document.getElementById('sp-nombre').value.trim();
  const correo = document.getElementById('sp-correo').value.trim();
  const mensaje = document.getElementById('sp-mensaje').value.trim();
  const fileInput = document.getElementById('sp-adjunto');
  const btn = document.getElementById('btn-envio-soporte');

  if (!nombre || !correo || !mensaje) return mostrarToast("Rellena nombre, correo y mensaje.");

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> TRANSMITIENDO...';

  let fotoBase64 = "";
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    if (file.size > 4 * 1024 * 1024) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> ENVIAR AL MANDO CENTRAL';
      return mostrarToast("La imagen es muy pesada (Máx 4MB)");
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      fotoBase64 = e.target.result; // Se envía el Base64 completo con el mime-type
      dispararSoporteAlServidor({ nombre, correo, mensaje, fotoBase64 });
    };
    reader.readAsDataURL(file);
  } else {
    dispararSoporteAlServidor({ nombre, correo, mensaje, fotoBase64 });
  }
}

async function dispararSoporteAlServidor(payload) {
  try {
    // LLAMA A LA FUNCIÓN DE CORREO QUE CREAMOS EN GOOGLE APPS SCRIPT
    const res = await ejecutarEnServidor("registrarTicketSoporte", payload);
    mostrarToast("🚀 ¡Mensaje enviado a tu correo exitosamente!");
    cerrarSoporte();
    
    // Limpieza
    document.getElementById('sp-nombre').value = "";
    document.getElementById('sp-correo').value = "";
    document.getElementById('sp-mensaje').value = "";
    document.getElementById('sp-adjunto').value = "";
    actualizarLabelSoporte({files:[]});
    
  } catch (err) {
    mostrarToast("Falla de conexión al enviar la solicitud.");
  } finally {
    document.getElementById('btn-envio-soporte').disabled = false;
    document.getElementById('btn-envio-soporte').innerHTML = '<i class="fas fa-paper-plane"></i> ENVIAR AL MANDO CENTRAL';
  }
}
    
async function renderRadar(productos) {
  const wrapper = document.getElementById('wrapper-sugerencias');
  if (!wrapper) return;

  // Si no hay productos en el radar, cargamos las sugerencias generales
  if (!productos || productos.length === 0) {
    try {
      // CORRECCIÓN FOCUS: Cambio a ejecutarEnServidor
      const dataDash = await ejecutarEnServidor("getDashboardData", { email: sessionUser.email });
      renderSugerenciasDinamicas(dataDash);
    } catch (err) {
      console.error("Error al cargar sugerencias:", err);
    }
    return;
  }

  document.getElementById('titulo-sugerencias').innerText = "CONTINUAR VIENDO...";

  wrapper.innerHTML = productos.map((p, i) => `
  <div class="sugerencia-item ${i === 0 ? 'active' : ''}" id="sug-${i}">
    <img src="${p.IMAGEN_URL}" class="img-sug">
    <div class="info-sug">
      <span class="badge-desc">VISTO RECIENTEMENTE</span>
      <div style="font-size:0.8rem; font-weight:bold; color:white; margin:5px 0;">${p.NOMBRE}</div>
      <div class="cian" style="font-weight:bold; margin-top:5px;">$${Number(p.PRECIO).toLocaleString('es-CL')}</div>
      <button class="btn-buy-now" style="font-size:0.5rem; padding:5px 10px; margin-top:5px;"
      onclick="agregarAlCarrito('${p.SKU}')">AÑADIR</button>
    </div>
  </div>
  `).join('');
}

/**
 * FUNCIÓN: cargarChatAdmin
 * Esta función es solo para Diego. Carga TODOS los mensajes de la hoja BUZON.
 */
async function cargarChatAdmin() {
  try {
    // CORRECCIÓN FOCUS: Cambio a ejecutarEnServidor
    const todosLosMensajes = await ejecutarEnServidor("obtenerTodosLosMensajes");
    
    const chatBox = document.getElementById('chat-box');
    if(!chatBox) return;

    chatBox.innerHTML = todosLosMensajes.map(m => `
    <div style="margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:5px;">
      <small style="color:var(--amber);">${m.emisor} -> ${m.receptor}</small>
      <p style="font-size:0.75rem; margin:2px 0;">${m.mensaje}</p>
      <button onclick="prepararRespuesta('${m.emisor}')" style="font-size:0.5rem; background:var(--cian); border:none; padding:2px 5px; cursor:pointer;">RESPONDER</button>
    </div>
    `).join('');
  } catch (err) {
    console.error("Error al cargar chat admin", err);
  }
}
    
function prepararRespuesta(clienteEmail) {
    document.getElementById('msg-input').value = "@" + clienteEmail + " ";
    document.getElementById('msg-input').focus();
}


function renderSugerenciasDinamicas(res) {
    const wrapper = document.getElementById('wrapper-sugerencias');
    const dots = document.getElementById('dots-sugerencias');
    
    if (!wrapper || !res || !res.sugerencias) {
        console.error("Falla en la señal: No hay datos de sugerencias.");
        return;
    }

    // 1. Renderizar los productos sugeridos
    wrapper.innerHTML = res.sugerencias.map((s, i) => `
        <div class="sugerencia-item ${i === 0 ? 'active' : ''}" id="sug-${i}">
            <img src="${s.img}" class="img-sug">
            <div class="info-sug">
                <span class="badge-desc">${s.descuentoEtiqueta || 'DESTACADO'}</span>
                <div style="font-size:0.8rem; font-weight:bold; color:white; margin:5px 0;">${s.nombre}</div>
                <div class="cian" style="font-weight:bold; margin-top:5px;">$${Number(s.precioEspecial).toLocaleString('es-CL')}</div>
                <button class="btn-buy-now" style="font-size:0.5rem; padding:5px 10px; margin-top:5px;" 
                        onclick="agregarAlCarrito('${s.sku}')">AÑADIR</button>
            </div>
        </div>
    `).join('');

    // 2. Renderizar los indicadores (dots)
    if (dots) {
        dots.innerHTML = res.sugerencias.map((_, i) => `
            <div class="dot ${i === 0 ? 'active' : ''}" onclick="irASugerencia(${i})"></div>
        `).join('');
    }

    // 3. Iniciar el movimiento automático (Si tienes la función definida)
    if (typeof iniciarAutoSugerencias === "function") {
        iniciarAutoSugerencias(res.sugerencias.length);
    }
}

function agregarConVariantes(sku) {
    const sabor = document.getElementById('var-sabor') ? document.getElementById('var-sabor').value : '';
    const color = document.getElementById('var-color') ? document.getElementById('var-color').value : '';
    const tamano = document.getElementById('var-tamaño') ? document.getElementById('var-tamaño').value : '';

    // Creamos una nota con las variantes
    let variantesStr = [sabor, color, tamano].filter(v => v !== "").join(' | ');
    
    // Llamamos a tu función original de agregar al carrito
    // Pero le pasamos el SKU y las variantes (puedes ajustar tu función para recibir esto)
    agregarAlCarrito(sku, variantesStr); 
    
    cerrarModal();
    mostrarToast("PRODUCTO AÑADIDO CON ÉXITO");
}

function renderSocialIcons() {
    const container = document.getElementById('social-icons-container');
    if (!container) return;

    const redes = [
        { key: 'LINK_INSTAGRAM', icon: 'fab fa-instagram' },
        { key: 'LINK_FACEBOOK', icon: 'fab fa-facebook' },
        { key: 'LINK_YOUTUBE', icon: 'fab fa-youtube' },
        { key: 'LINK_TIKTOK', icon: 'fab fa-tiktok' }
    ];

    container.innerHTML = redes.map(red => {
        let link = configGlobal[red.key];
        
        // Si hay un link guardado en la base de datos
        if (link && link.trim() !== "") {
            link = link.trim();
            
            // --- NEURO-FILTRO DE CORRECCIÓN ---
            // 1. Corrige el error común de las 3 't'
            if (link.startsWith('htttps')) {
                link = link.replace('htttps', 'https');
            } 
            // 2. Si escriben solo "www.instagram...", le inyecta el protocolo seguro
            else if (!link.startsWith('http')) {
                link = 'https://' + link;
            }
            
            // Inyectamos el botón blindado con z-index para asegurar el clic
            return `<a href="${link}" target="_blank" style="color:white; margin-left:15px; font-size:1.2rem; transition:0.3s; position:relative; z-index:10000;" onmouseover="this.style.color='var(--cian)'" onmouseout="this.style.color='white'"><i class="${red.icon}"></i></a>`;
        }
        return '';
    }).join('');
}

/**
 * SENSOR DE ANUNCIO EMERGENTE (FOCUS)
 * Dispara instantáneamente para cubrir el tiempo de carga del catálogo.
 */
function verificarAnuncio() {
    const txt = configGlobal['ANUNCIO_TEXTO'];
    const img = configGlobal['ANUNCIO_IMAGEN'];

    // Si hay datos en el Excel (Config), armamos y disparamos
    if ((txt && txt.trim() !== "") || (img && img.trim() !== "")) {
        const modal = document.getElementById('modal-anuncio');
        const pTxt = document.getElementById('anuncio-texto');
        const pImg = document.getElementById('anuncio-img');

        if (txt && txt.trim() !== "") {
            pTxt.innerText = txt;
            pTxt.style.display = 'block';
        }

        if (img && img.trim() !== "") {
            pImg.src = img;
            pImg.style.display = 'block';
        }

        // Ejecución inmediata, sin esperas.
        modal.style.display = 'flex';
    }
}

// ==========================================
// MOTOR FOCUS: EL CONMUTADOR DE ATMÓSFERAS
// ==========================================
function encenderAtmosfera(tipo) {
    const canvas = document.getElementById('star-canvas');
    if (!canvas) return;

    // Reiniciamos estilos previos del fondo
    canvas.className = ''; 
    canvas.style.background = 'var(--bg-space)';
    
    // Si el usuario subió una imagen fija de fondo, no la pisamos con animaciones
    if (configGlobal['BG_IMG'] && configGlobal['BG_IMG'].trim() !== "") return;

    if (tipo === 'espacial') {
        // Tu hermoso fondo actual de estrellas aceleradas por tarjeta gráfica
        canvas.style.background = 'radial-gradient(circle at center, #1B2735 0%, #020204 100%)';
        canvas.classList.add('scrolling'); // Usa tu regla CSS existente para mover las estrellas
    } 
    else if (tipo === 'matrix') {
        // Atmósfera Cyberpunk / Verde hacker
        canvas.style.background = '#000';
        canvas.style.backgroundImage = 'radial-gradient(rgba(0, 40, 0, 0.4), #000)';
    } 
    else if (tipo === 'bokeh') {
        // Brisa Dorada / Elegante
        canvas.style.background = 'radial-gradient(circle at bottom, #2c1a04 0%, #020204 100%)';
    } 
    else if (tipo === 'vaporwave') {
        // Estética ochentera de Neón
        canvas.style.background = 'linear-gradient(to bottom, #140526, #020204)';
    } 
    else if (tipo === 'naturaleza') {
        // Verde orgánico / CBD relajante
        canvas.style.background = 'radial-gradient(circle at top, #061f10 0%, #020204 100%)';
    } 
    else if (tipo === 'ondas') {
        // Minimalismo institucional corporativo
        canvas.style.background = 'linear-gradient(135s, #0f172a, #020204)';
    } 
    else {
        // Ninguno (Fondo limpio de alto rendimiento)
        canvas.style.background = 'var(--bg-space)';
        canvas.style.backgroundImage = 'none';
    }
}

async function dispararComponenteLegal(accionServidor, e) {
  if (e) e.preventDefault();
  const modal = document.getElementById('modal-legal-dinamico');
  const contenedor = document.getElementById('cuerpo-legal-contenido');
  
  if(!modal || !contenedor) return;
  
  contenedor.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin cian" style="font-size:1.5rem;"></i><p style="font-size:0.75rem; margin-top:10px; opacity:0.5;">Verificando credenciales con el servidor...</p></div>';
  modal.style.display = 'flex';
  
  try {
    const res = await ejecutarEnServidor(accionServidor);
    if (res.success) {
      contenedor.innerHTML = res.html;
    } else {
      contenedor.innerHTML = '<p style="color:red; text-align:center; font-size:0.8rem;">Error al compilar el contrato legal.</p>';
    }
  } catch(err) {
    contenedor.innerHTML = '<p style="color:var(--amber); text-align:center; font-size:0.8rem;">Falla de conexión de red.</p>';
  }
}
