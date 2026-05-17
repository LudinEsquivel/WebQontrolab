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

const modalBenefits = {
  Dashboard: ['Visión rápida para gerencia y administración.', 'Evita revisar reportes separados para saber qué ocurre.', 'Prioriza pendientes y decisiones del día.'],
  Pacientes: ['Historial ordenado por paciente.', 'Reduce duplicados y búsquedas manuales.', 'Permite seguimiento más rápido en recepción.'],
  'Citas y Agenda': ['Organiza horarios y carga diaria.', 'Reduce confusiones en recepción.', 'Convierte citas en órdenes sin repetir trabajo.'],
  'Órdenes de Trabajo': ['Centraliza el proceso clínico.', 'Reduce pérdidas de información entre áreas.', 'Mejora trazabilidad desde ingreso hasta entrega.'],
  Resultados: ['Entrega PDFs consistentes y profesionales.', 'Reduce errores de captura y validación.', 'Mejora la presentación frente a pacientes y médicos.'],
  'Catálogo de Exámenes': ['Estandariza exámenes, perfiles y precios.', 'Agiliza cotizaciones y órdenes.', 'Evita diferencias internas en nombres o valores.'],
  'Caja y Pagos': ['Controla pagos, saldos y cortes.', 'Reduce dudas sobre ingresos reales.', 'Mejora la administración diaria.'],
  Inventario: ['Controla reactivos e insumos críticos.', 'Reduce pérdidas por vencimiento.', 'Ayuda a prevenir faltantes operativos.'],
  'Médicos y Comisiones': ['Ordena referencias médicas.', 'Facilita cálculo de comisiones.', 'Mide relaciones comerciales con claridad.'],
  Cotizaciones: ['Crea propuestas profesionales.', 'Evita reingresar información al vender.', 'Mejora atención a empresas e instituciones.'],
  'Bitácora Diaria': ['Registra evidencia de turno.', 'Ordena controles internos.', 'Mejora disciplina operativa y calidad.'],
  Reportes: ['Convierte operación en datos claros.', 'Apoya decisiones administrativas.', 'Facilita revisión de ingresos y productividad.'],
  Synapse: ['Reduce digitación manual.', 'Mejora flujo desde analizadores.', 'Disminuye errores por transcripción.'],
  'Portal Médico': ['Mejora comunicación con referentes.', 'Reduce consultas administrativas repetitivas.', 'Da seguimiento externo más ordenado.'],
  'Multi-sucursal': ['Centraliza sedes sin mezclar operación.', 'Facilita control por sucursal.', 'Da visión general a gerencia.'],
  Configuración: ['Adapta formatos e identidad.', 'Controla usuarios y permisos.', 'Alinea el sistema a tu forma de operar.']
};

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
      <span>${row[0]}</span><strong>${row[1]}</strong><em>${row[2]}</em>
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
  $$('.module-card').forEach((card) => card.addEventListener('click', () => openModal(Number(card.dataset.moduleIndex))));
}

function openModal(index) {
  const module = modules[index];
  const benefits = modalBenefits[module[0]] || ['Información centralizada para el equipo.', 'Menos pasos manuales y menos errores.', 'Seguimiento claro para la operación diaria.'];
  $('#modalTitle').textContent = module[0];
  $('#modalText').textContent = module[2];
  $('#modalMiniLabel').textContent = `Módulo ${String(index + 1).padStart(2, '0')}`;
  $('#modalVisualTitle').textContent = module[0];
  $('#modalChipTop').textContent = module[1];
  $('#modalChipBottom').textContent = benefits[0];
  $('#modalBenefitOne').textContent = benefits[0];
  $('#modalBenefitTwo').textContent = benefits[1];
  $('#modalBenefitThree').textContent = benefits[2];
  $('#moduleModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#moduleModal').classList.remove('open');
  document.body.style.overflow = '';
}

function splitKineticTitles() {
  $$('.hero h1, .section-head h2, .experience-copy h2, .cta h2').forEach((title) => {
    if (title.dataset.kinetic === 'true') return;
    const text = title.textContent.replace(/\s+/g, ' ').trim();
    title.dataset.kinetic = 'true';
    title.innerHTML = text.split(' ').map((word, index) => `<span class="kinetic-word" style="--w:${index}">${word}</span>`).join(' ');
    requestAnimationFrame(() => title.classList.add('kinetic-ready'));
  });
}

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        entry.target.querySelectorAll('.kinetic-word').forEach((word) => word.classList.add('is-visible'));
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
    const flash = $('#themeFlash');
    if (flash) {
      flash.classList.remove('run');
      void flash.offsetWidth;
      flash.classList.add('run');
    }
    const root = document.documentElement;
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  });
}

function updateScrollExperience() {
  const nav = $('#nav');
  const y = window.scrollY;
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  nav.classList.toggle('is-scrolled', y > 30);
  const progress = $('#scrollProgress');
  if (progress) progress.style.transform = `scaleX(${Math.min(1, y / max)})`;
  $$('.nav__links a').forEach((link) => {
    const section = document.querySelector(link.getAttribute('href'));
    if (!section) return;
    const active = y + 120 >= section.offsetTop && y + 120 < section.offsetTop + section.offsetHeight;
    link.classList.toggle('is-active', active);
  });
}

function initNavigation() {
  window.addEventListener('scroll', updateScrollExperience, { passive: true });
  updateScrollExperience();
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
splitKineticTitles();
initReveal();
initTheme();
initNavigation();
initModal();
