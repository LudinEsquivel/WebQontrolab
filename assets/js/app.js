const modules = [
  ['Dashboard','Vista general del laboratorio.','Ten a la vista lo más importante: órdenes del día, pendientes, ingresos y actividad general. Ideal para tomar decisiones rápidas sin revisar hojas o reportes separados.'],
  ['Pacientes','Expedientes ordenados.','Centraliza la información de cada paciente en un expediente ordenado. Evita duplicar datos y permite consultar historial, órdenes anteriores y seguimiento en segundos.'],
  ['Citas y Agenda','Atención mejor organizada.','Organiza la atención diaria con horarios, estados y seguimiento. Ayuda a evitar confusiones en recepción y convierte una cita en orden de trabajo cuando el paciente llega.'],
  ['Órdenes de Trabajo','Proceso clínico controlado.','Controla todo el proceso desde que entra el paciente: exámenes solicitados, pagos, muestra, estado de proceso y entrega final. Todo queda trazable.'],
  ['Resultados','Entrega profesional de PDFs.','Reduce errores al capturar, validar y entregar resultados con formato profesional. Permite manejar valores de referencia y generar PDFs listos para el paciente o médico.'],
  ['Catálogo de Exámenes','Exámenes y precios claros.','Mantén ordenados tus exámenes, perfiles, precios y áreas. Facilita cotizar, crear órdenes y estandarizar la forma en que trabaja el laboratorio.'],
  ['Caja y Pagos','Control real de ingresos.','Lleva control de cobros, saldos, pagos parciales y cortes de caja. Ayuda a saber qué está pagado, qué está pendiente y cuánto ingresó realmente.'],
  ['Inventario','Evita faltantes y pérdidas.','Controla insumos, reactivos, lotes y vencimientos. Evita quedarte sin materiales clave y ayuda a reducir pérdidas por productos vencidos o mal registrados.'],
  ['Médicos y Comisiones','Referencias bajo control.','Gestiona médicos referentes, órdenes enviadas y comisiones. Útil para laboratorios que trabajan con referencias y necesitan medir relaciones comerciales.'],
  ['Cotizaciones','Propuestas más profesionales.','Crea propuestas profesionales para pacientes, empresas o instituciones. Cuando el cliente acepta, puedes convertir la cotización en una orden sin volver a ingresar todo.'],
  ['Bitácora Diaria','Evidencia diaria del laboratorio.','Registra controles de inicio de turno, temperaturas, control de calidad y observaciones. Ayuda a mantener evidencia interna y orden en la operación diaria.'],
  ['Reportes','Decisiones con datos.','Consulta información clave sobre ingresos, órdenes, pacientes, médicos, exámenes e inventario. Ideal para administrar con datos y no solo con percepción.'],
  ['Synapse','Menos digitación manual.','Conecta equipos de laboratorio para reducir digitación manual. Ayuda a recibir resultados de analizadores mediante ASTM, HL7 o archivos planos, según el equipo.'],
  ['Portal Médico','Comunicación más ágil.','Permite que médicos referentes consulten información relacionada con sus pacientes, órdenes o comisiones. Mejora la comunicación sin saturar al personal administrativo.'],
  ['Multi-sucursal','Varias sedes en orden.','Opera varias sedes desde una misma plataforma. Mantiene la información organizada por sucursal y facilita una visión general de toda la operación.'],
  ['Configuración','Sistema adaptado a tu operación.','Adapta el sistema a la identidad y forma de trabajar de tu laboratorio: datos generales, usuarios, permisos, formatos de PDF y parámetros importantes.']
];

const rows = [
  ['OT-2026-00847','Ana Martínez','Entregada'],
  ['OT-2026-00846','Roberto Fuentes','Muestra tomada'],
  ['OT-2026-00845','Valeria Morales','En proceso']
];

const state = { activeModule: 0 };

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function setActiveModule(index) {
  state.activeModule = index;
  const module = modules[index];

  $('#moduleLabel').textContent = module[0];
  $('#mockTitle').textContent = index === 0 ? 'Órdenes recientes' : 'Vista del módulo';
  $('#mockNote').textContent = module[1];

  $('#mockRows').innerHTML = rows.map((row, rowIndex) => `
    <div class="row is-entering" style="animation-delay:${rowIndex * 65}ms">
      <span>${row[0]}</span>
      <strong>${row[1]}</strong>
      <em>${row[2]}</em>
    </div>
  `).join('');

  const preview = $('#mockPreview');
  preview.classList.remove('is-changing');
  void preview.offsetWidth;
  preview.classList.add('is-changing');

  renderSidebar();
}

function renderSidebar() {
  const sidebar = $('#moduleSidebar');
  sidebar.querySelectorAll('button').forEach((button) => button.remove());

  modules.forEach((module, index) => {
    const button = document.createElement('button');
    button.textContent = module[0];
    button.className = index === state.activeModule ? 'active' : '';
    button.addEventListener('click', () => setActiveModule(index));
    sidebar.appendChild(button);
  });
}

function renderModuleCards() {
  $('#moduleGrid').innerHTML = modules.map((module, index) => `
    <article class="module-card reveal" data-module-index="${index}">
      <div class="icon">${String(index + 1).padStart(2, '0')}</div>
      <h3>${module[0]}</h3>
      <p>${module[1]}</p>
      <button type="button">Ver detalle →</button>
    </article>
  `).join('');

  $$('.module-card').forEach((card) => {
    card.addEventListener('click', () => openModal(Number(card.dataset.moduleIndex)));
  });
}

function openModal(index) {
  const module = modules[index];
  $('#modalTitle').textContent = module[0];
  $('#modalText').textContent = module[2];
  $('#modalBullets').innerHTML = [
    'Ordena la información relacionada con este proceso.',
    'Reduce trabajo manual y mejora el seguimiento diario.',
    'Ayuda a que el equipo trabaje con procesos más claros y profesionales.'
  ].map((item) => `<li>${item}</li>`).join('');

  $('#moduleModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#moduleModal').classList.remove('open');
  document.body.style.overflow = '';
}

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  $$('.reveal').forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 35, 180)}ms`;
    observer.observe(element);
  });
}

function initTheme() {
  $('#themeToggle').addEventListener('click', () => {
    const root = document.documentElement;
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  });
}

function initNavigation() {
  window.addEventListener('scroll', () => {
    $('#nav').classList.toggle('is-scrolled', window.scrollY > 30);
  });
}

function initModal() {
  $('#modalClose').addEventListener('click', closeModal);
  $('#moduleModal').addEventListener('click', (event) => {
    if (event.target.id === 'moduleModal') closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });
}

renderModuleCards();
setActiveModule(0);
initReveal();
initTheme();
initNavigation();
initModal();
