import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Cpu,
  FileText,
  FlaskConical,
  Globe2,
  MessageCircle,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserCog,
  Users,
} from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/50230012345?text=Hola%2C%20quiero%20una%20demo%20de%20Qontrolab';

const modules = [
  {
    icon: BarChart3,
    title: 'Dashboard',
    text: 'Visualiza órdenes, ingresos, resultados pendientes, pacientes y actividad del laboratorio en tiempo real.',
  },
  {
    icon: Users,
    title: 'Pacientes',
    text: 'Expedientes centralizados con historial, datos clínicos, órdenes previas y búsqueda rápida.',
  },
  {
    icon: CalendarDays,
    title: 'Citas y Agenda',
    text: 'Organiza citas, estados de atención y convierte una programación en orden de trabajo.',
  },
  {
    icon: ClipboardList,
    title: 'Órdenes de Trabajo',
    text: 'Crea órdenes clínicas con paciente, exámenes, pagos, estados y entrega de resultados.',
  },
  {
    icon: FlaskConical,
    title: 'Resultados',
    text: 'Captura, valida e imprime resultados con valores de referencia y formato profesional.',
  },
  {
    icon: BookOpen,
    title: 'Catálogo de Exámenes',
    text: 'Administra exámenes, perfiles, servicios, precios, áreas clínicas y valores de referencia.',
  },
  {
    icon: Receipt,
    title: 'Caja y Pagos',
    text: 'Registra cobros, saldos, comprobantes, pagos parciales y control financiero por orden.',
  },
  {
    icon: Package,
    title: 'Inventario',
    text: 'Control de insumos, lotes, vencimientos, proveedores y alertas de stock bajo.',
  },
  {
    icon: Stethoscope,
    title: 'Médicos y Comisiones',
    text: 'Gestiona médicos referentes, pacientes enviados, comisiones y seguimiento de rendimiento.',
  },
  {
    icon: FileText,
    title: 'Cotizaciones',
    text: 'Genera cotizaciones profesionales, conviértelas en órdenes y conserva trazabilidad comercial.',
  },
  {
    icon: ClipboardCheck,
    title: 'Bitácora Diaria',
    text: 'Registra temperatura, controles de calidad, observaciones e inicio de turno del laboratorio.',
  },
  {
    icon: BarChart3,
    title: 'Reportes',
    text: 'Reportes operativos, financieros, clínicos y exportables para administración.',
  },
  {
    icon: Cpu,
    title: 'Synapse',
    text: 'Conexión con equipos de laboratorio mediante ASTM, HL7 o archivos planos.',
  },
  {
    icon: UserCog,
    title: 'Portal Médico',
    text: 'Acceso externo para médicos referentes con consulta de pacientes, órdenes y comisiones.',
  },
  {
    icon: Building2,
    title: 'Multi-sucursal',
    text: 'Opera varias sedes o laboratorios desde una plataforma centralizada y separada por tenant.',
  },
  {
    icon: Settings,
    title: 'Configuración',
    text: 'Personaliza PDFs, permisos, roles, datos del laboratorio, comprobantes y parámetros generales.',
  },
];

const stats = [
  ['Web', 'Sin instalaciones'],
  ['Multi-sucursal', 'Operación centralizada'],
  ['24/7', 'Acceso continuo'],
  ['Q', 'Adaptado a Guatemala'],
];

const flow = [
  'Registro del paciente',
  'Creación de orden o cotización',
  'Toma y proceso de muestra',
  'Validación de resultados',
  'Entrega o envío de PDF',
];

function App() {
  return (
    <main>
      <header className="nav">
        <a className="brand" href="#top" aria-label="Qontrolab inicio">
          <span>Qontro</span><strong>lab</strong>
        </a>
        <nav>
          <a href="#modulos">Módulos</a>
          <a href="#flujo">Flujo</a>
          <a href="#contacto">Demo</a>
        </nav>
        <a className="navCta" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
          Contactar
        </a>
      </header>

      <section className="hero" id="top">
        <div className="heroText">
          <div className="pill"><Activity size={16} /> Sistema para laboratorios clínicos</div>
          <h1>Gestiona tu laboratorio con precisión total.</h1>
          <p>
            Qontrolab centraliza pacientes, órdenes, resultados, inventario, reportes, cotizaciones, agenda, caja y conexión con equipos en una plataforma web profesional para laboratorios clínicos.
          </p>
          <div className="heroActions">
            <a className="primary" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              Solicitar demo <ArrowRight size={18} />
            </a>
            <a className="secondary" href="#modulos">Ver módulos</a>
          </div>
          <div className="trust">
            <CheckCircle2 size={18} /> Sin instalaciones complejas · Acceso desde computadora, tablet o celular
          </div>
        </div>

        <div className="heroPanel" aria-label="Vista previa del sistema">
          <div className="windowBar"><span></span><span></span><span></span></div>
          <div className="dashboardMock">
            <div className="mockHeader">
              <div>
                <small>Dashboard</small>
                <h2>Órdenes recientes</h2>
              </div>
              <span>Hoy</span>
            </div>
            <div className="kpis">
              <div><strong>24</strong><span>Órdenes</span></div>
              <div><strong>7</strong><span>Pendientes</span></div>
              <div><strong>142</strong><span>Pacientes</span></div>
            </div>
            <div className="tableMock">
              {['Ana Martínez', 'Roberto Fuentes', 'Valeria Morales', 'Diego Castillo'].map((name, index) => (
                <div className="row" key={name}>
                  <span>OT-2026-00{index + 41}</span>
                  <strong>{name}</strong>
                  <em>{index === 0 ? 'Entregada' : index === 1 ? 'Muestra tomada' : 'En proceso'}</em>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="stats">
        {stats.map(([value, label]) => (
          <article key={value}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      <section className="section" id="modulos">
        <div className="sectionHead">
          <span>Módulos principales</span>
          <h2>Todo lo que necesita tu laboratorio en un solo lugar.</h2>
          <p>Diseñado para ordenar el flujo real de trabajo: recepción, procesamiento, validación, entrega, administración y crecimiento multi-sucursal.</p>
        </div>
        <div className="grid">
          {modules.map(({ icon: Icon, title, text }) => (
            <article className="card" key={title}>
              <div className="iconBox"><Icon size={24} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="split" id="flujo">
        <div>
          <span className="eyebrow">Flujo clínico</span>
          <h2>Desde que entra el paciente hasta que recibe sus resultados.</h2>
          <p>
            Qontrolab ayuda a reducir desorden operativo, duplicidad de datos y errores en la entrega de resultados, manteniendo control financiero, clínico y administrativo.
          </p>
          <a className="primary compact" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            Hablar por WhatsApp <MessageCircle size={18} />
          </a>
        </div>
        <div className="flowCard">
          {flow.map((item, index) => (
            <div className="flowItem" key={item}>
              <span>{index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="benefits">
        <article>
          <ShieldCheck size={28} />
          <h3>Roles y permisos</h3>
          <p>Controla qué puede ver o hacer cada usuario dentro del laboratorio.</p>
        </article>
        <article>
          <Stethoscope size={28} />
          <h3>Médicos referentes</h3>
          <p>Gestiona médicos, comisiones y seguimiento de órdenes referidas.</p>
        </article>
        <article>
          <CalendarDays size={28} />
          <h3>Citas y agenda</h3>
          <p>Organiza la atención y convierte citas en órdenes de trabajo.</p>
        </article>
        <article>
          <Globe2 size={28} />
          <h3>100% web</h3>
          <p>Funciona desde navegador, sin instalaciones pesadas en cada equipo.</p>
        </article>
      </section>

      <section className="cta" id="contacto">
        <div>
          <span>Demo gratuita</span>
          <h2>¿Listo para presentar Qontrolab a un laboratorio?</h2>
          <p>Agenda una demostración y muestra una plataforma seria, moderna y preparada para crecer.</p>
        </div>
        <a className="primary light" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
          Solicitar demo <ArrowRight size={18} />
        </a>
      </section>

      <footer>
        <strong>Qontrolab</strong>
        <span>Sistema de Gestión de Laboratorio · © 2026</span>
      </footer>
    </main>
  );
}

export default App;
