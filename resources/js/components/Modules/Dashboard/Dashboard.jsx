import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import styles from './Dashboard.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler, ChartDataLabels);

// --- 🎨 PALETA DE COLORES ACTUALIZADA ---
const CHART_THEME = {
    textLight: '#ffffff',
    textDark:  '#546e7a',
    gridColor: '#eeeeee',
    fontFamily: "'Segoe UI', Roboto, sans-serif",
    colors: {
        primary:   '#005461', // Verde Oscuro Corporativo
        secondary: '#00d49f', // Verde Claro Cyan
        blue:      '#03ebcc', // Azul/Cyan brillante (Gradiente)
        teal:      '#1a9e8d', // Verde Teal oscuro (Gradiente)
        yellow:    '#ffca28',
        red:       '#ef5350',
        orange:    '#ffa726',
        dark:      '#37474f',
    }
};

const initialData = {
    kpi: { files: 0, size: '0 B', downloads_today: 0, users: 0, import_files: 0 },
    charts: { campaigns: { labels: [], data: [] }, distribution: { labels: [], data: [] } },
    activity: []
};

const Dashboard = () => {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('month');
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); setError(null);
            const token = localStorage.getItem('auth_token');
            try {
                const res = await fetch(`/api/dashboard/stats?range=${timeRange}&t=${new Date().getTime()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error(`Error ${res.status}`);
                const result = await res.json();
                
                setData({
                    kpi: result.kpi || initialData.kpi,
                    charts: {
                        campaigns: result.charts?.campaigns || initialData.charts.campaigns,
                        distribution: result.charts?.distribution || initialData.charts.distribution
                    },
                    activity: result.activity || []
                });
            } catch (err) {
                console.error("Fetch error:", err);
                setError("Error al cargar los datos estadísticos.");
            } finally { setLoading(false); }
        };
        fetchData();
    }, [timeRange]);

    const labelsCount = data.charts.campaigns.labels?.length || 0;
    // Hacemos el contenedor un poco más bajo por defecto ya que ahora ocupa todo el ancho
    const chartHeight = labelsCount > 5 ? 280 + ((labelsCount - 5) * 35) : 280;

    // --- 1. GRÁFICA DE BARRAS (DEMANDA) - AHORA OCUPA TODO EL ANCHO ---
    const barData = {
        labels: data.charts.campaigns.labels || [],
        datasets: [{
            label: 'Descargas',
            data: data.charts.campaigns.data || [],
            backgroundColor: (context) => {
                const {chart} = context;
                const { ctx, chartArea } = chart;
                if (!chartArea) return CHART_THEME.colors.primary; 
                
                const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                gradient.addColorStop(0, CHART_THEME.colors.blue); 
                gradient.addColorStop(1, CHART_THEME.colors.teal); 
                return gradient;
            },
            borderRadius: 2,
            barPercentage: Math.min(0.6, 1.0 - (labelsCount * 0.05)), // Barras más delgadas para que se vean elegantes a lo ancho
        }]
    };

    const barOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0, 84, 97, 0.9)', // Fondo tooltip con color corporativo
                titleFont: { family: CHART_THEME.fontFamily, size: 13 },
                bodyFont: { family: CHART_THEME.fontFamily, size: 14, weight: 'bold' },
                padding: 10, cornerRadius: 4, displayColors: false
            },
            datalabels: {
                color: CHART_THEME.textLight, 
                anchor: 'end', align: 'start', offset: 8, 
                font: { weight: 'bold', size: 12, family: CHART_THEME.fontFamily },
                formatter: (val) => val > 0 ? val : ''
            }
        },
        scales: {
            x: { 
                grid: { color: CHART_THEME.gridColor, drawBorder: false }, 
                ticks: { 
                    color: CHART_THEME.textDark, 
                    font: {size: 11},
                    // PASO IMPORTANTE: Forzamos a que solo muestre números enteros (1, 2, 3...)
                    stepSize: 1,
                    precision: 0
                } 
            },
            y: { 
                grid: { display: false }, 
                ticks: { font: { size: 12, weight: '600', family: CHART_THEME.fontFamily }, color: CHART_THEME.textDark } 
            }
        }
    };

    // --- 2. GRÁFICA DONA (DISTRIBUCIÓN) ---
    const doughData = {
        labels: data.charts.distribution.labels || [],
        datasets: [{
            data: data.charts.distribution.data || [],
            backgroundColor: [
                CHART_THEME.colors.primary, CHART_THEME.colors.yellow, 
                CHART_THEME.colors.secondary, CHART_THEME.colors.red, CHART_THEME.colors.dark
            ],
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 6
        }]
    };

    const doughOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: 'rgba(0, 84, 97, 0.9)', padding: 10, cornerRadius: 4 },
            datalabels: { 
                color: '#ffffff',
                font: { weight: 'bold', size: 12, family: CHART_THEME.fontFamily },
                formatter: (value, context) => {
                    if (!value) return '';
                    const dataset = context.chart.data.datasets[0].data;
                    const total = dataset.reduce((acc, curr) => acc + Number(curr), 0);
                    if (total === 0) return '';
                    return Math.round((value / total) * 100) + '%';
                }
            }
        },
        cutout: '65%',
    };

    // --- 3. NUEVA GRÁFICA: BANDEJA DE ENTRADA ---
    const totalFilesNum = Number(data.kpi.files) || 0;
    const importFilesNum = Number(data.kpi.import_files) || 0;
    const classifiedFiles = Math.max(0, totalFilesNum - importFilesNum); 
    
    const inboxData = {
        labels: ['Clasificadas', 'En Bandeja'],
        datasets: [{
            data: [classifiedFiles, importFilesNum],
            backgroundColor: [CHART_THEME.colors.primary, CHART_THEME.colors.orange],
            borderWidth: 2,
            hoverOffset: 4
        }]
    };

    return (
        <div className={styles.dashboardGrid}>
            <div className={`d-flex justify-content-between align-items-center mb-4 ${styles.fadeIn}`}>
                <div>
                    <h2 className={styles.headerTitle}>Dashboard</h2>
                    <p className={styles.headerSubtitle}>Vista general de estadísticas y métricas</p>
                </div>
                {loading && <div className="spinner-border text-info" role="status" style={{width: '1.5rem', height: '1.5rem'}}></div>}
            </div>

            {error && <div className="alert alert-danger shadow-sm border-0"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</div>}

            {/* FILA 1: TARJETAS KPI */}
            <div className="row g-3 mb-4">
                <KpiCard title="Total Archivos" value={totalFilesNum.toLocaleString()} icon="bi-music-note-list" colorClass={styles.kpiSolidBlue} />
                <KpiCard title="Almacenamiento" value={data.kpi.size} icon="bi-tags-fill" colorClass={styles.kpiSolidGray} />
                <KpiCard title="Usuarios" value={data.kpi.users} icon="bi-people-fill" colorClass={styles.kpiSolidPurple} />
                <KpiCard title="Descargas Hoy" value={data.kpi.downloads_today} icon="bi-cloud-arrow-down-fill" colorClass={styles.kpiSolidDark} />
            </div>

            {/* FILA 2: GRÁFICA DEMANDA (A TODO LO ANCHO) */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className={styles.cardPremium}>
                        <div className={styles.cardHeader}>
                            <h5 className={styles.cardTitle}>Demanda por Campaña</h5>
                            <div className={styles.filterGroup}>
                                {['day', 'week', 'month'].map(range => (
                                    <button 
                                        key={range}
                                        className={`${styles.filterBtn} ${timeRange === range ? styles.filterBtnActive : ''}`}
                                        onClick={() => setTimeRange(range)} disabled={loading}
                                    >
                                        {range === 'day' ? 'Hoy' : range === 'week' ? 'Semana' : 'Mes'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.chartContainer}>
                                {labelsCount > 0 ? (
                                    <div style={{ height: `${chartHeight}px`, minHeight: '280px' }}>
                                        <Bar data={barData} options={barOptions} />
                                    </div>
                                ) : (
                                    <EmptyState icon="bi-bar-chart" text="Sin descargas en este periodo" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FILA 3: DISTRIBUCIÓN (3) | BANDEJA (3) | ACTIVIDAD (6) */}
            <div className="row g-4 mb-4">
                
                {/* 1. DISTRIBUCIÓN (Col 3) */}
                <div className="col-lg-3 col-md-6">
                    <div className={styles.cardPremium}>
                        <div className={styles.cardHeader}>
                            <h5 className={styles.cardTitle}>Distribución</h5>
                        </div>
                        <div className={styles.cardBody}>
                            {data.charts.distribution.labels.length > 0 ? (
                                <div className="d-flex flex-column h-100 justify-content-center">
                                    <div className={styles.doughnutWrapper} style={{height: '200px'}}>
                                        <Doughnut data={doughData} options={doughOptions} />
                                    </div>
                                    <div className="mt-3 d-flex flex-wrap justify-content-center gap-2">
                                        {data.charts.distribution.labels.map((label, idx) => (
                                            <div key={idx} className="d-flex align-items-center" style={{fontSize: '0.75rem', color: CHART_THEME.textDark, fontWeight: '600'}}>
                                                <span style={{display: 'inline-block', width: '10px', height: '10px', backgroundColor: doughData.datasets[0].backgroundColor[idx % 5], borderRadius: '50%', marginRight: '5px'}}></span>
                                                {label} ({data.charts.distribution.data[idx]})
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <EmptyState icon="bi-pie-chart" text="Sin campañas" />
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. ESTADO DE CLASIFICACIÓN (Col 3) */}
                <div className="col-lg-3 col-md-6">
                    <div className={styles.cardPremium}>
                        <div className={styles.cardHeader}>
                            <h5 className={styles.cardTitle} style={{color: CHART_THEME.colors.orange}}>Clasificación</h5>
                        </div>
                        <div className={styles.cardBody}>
                            <div className="d-flex flex-column h-100 justify-content-center align-items-center">
                                <div className={styles.doughnutWrapper} style={{height: '200px'}}>
                                    <Doughnut data={inboxData} options={{...doughOptions, cutout: '70%'}} />
                                    <div className="position-absolute text-center" style={{pointerEvents: 'none'}}>
                                        <h3 className="m-0 fw-bold" style={{color: CHART_THEME.colors.orange}}>{importFilesNum.toLocaleString()}</h3>
                                        <small className="text-muted fw-bold" style={{fontSize: '0.7rem'}}>EN BANDEJA</small>
                                    </div>
                                </div>
                                <p className="text-center text-muted mt-3 mb-0" style={{fontSize: '0.8rem'}}>
                                    Archivos sin asignar.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. ACTIVIDAD RECIENTE (Col 6 - COMPACTA CON SCROLL) */}
                <div className="col-lg-6">
                    <div className={styles.cardPremium}>
                        <div className={styles.cardHeader}>
                            <h5 className={styles.cardTitle}>Actividad Reciente</h5>
                        </div>
                        {/* APLICAMOS LA NUEVA CLASE DE SCROLL INTERNO */}
                        <div className={styles.tableScrollContainer}>
                            <table className={styles.customTable}>
                                <thead>
                                    <tr>
                                        <th style={{width: '25%'}}>Usuario</th>
                                        <th style={{width: '15%'}}>Acción</th>
                                        <th style={{width: '40%'}}>Detalle</th>
                                        <th className="text-end" style={{width: '20%'}}>Tiempo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.activity.length > 0 ? (
                                        data.activity.map(log => (
                                            <tr key={log.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className={styles.userAvatar}>{log.user ? log.user.charAt(0).toUpperCase() : '?'}</div>
                                                        <span className={styles.userName}>{log.user || 'Sist.'}</span>
                                                    </div>
                                                </td>
                                                <td><BadgeAction action={log.action} /></td>
                                                <td style={{maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={log.details}>
                                                    {log.details}
                                                </td>
                                                <td className="text-end text-muted" style={{fontSize: '0.75rem'}}>{log.time}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="4" className="text-center py-4 text-muted fw-semibold">No hay actividad reciente.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

// --- COMPONENTES AUXILIARES ---

const KpiCard = ({ title, value, icon, colorClass }) => (
    <div className="col-lg-3 col-md-6 col-sm-6">
        <div className={`${styles.kpiCard} ${colorClass}`}>
            <div className={styles.kpiIconBox}>
                <i className={`bi ${icon}`}></i>
            </div>
            <div className={styles.kpiContent}>
                <h2 className={styles.kpiValue}>{value}</h2>
                <div className={styles.kpiTitle}>{title}</div>
            </div>
            <i className={`bi ${icon} ${styles.kpiIconBg}`}></i>
        </div>
    </div>
);

const BadgeAction = ({ action }) => {
    let badgeClass = styles.badgeSecondary;
    const act = action ? action.toUpperCase() : '';
    
    if (act.includes('DESCARGA')) badgeClass = styles.badgeSuccess;
    else if (act.includes('ELIMINAR') || act.includes('ERROR')) badgeClass = styles.badgeDanger;
    else if (act.includes('CREAR') || act.includes('LOGIN')) badgeClass = styles.badgeInfo;
    else if (act.includes('MOVER') || act.includes('INDEX')) badgeClass = styles.badgeWarning;

    return <span className={`${styles.badge} ${badgeClass}`}>{action || 'N/A'}</span>;
};

const EmptyState = ({ icon, text }) => (
    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted" style={{minHeight: '200px'}}>
        <i className={`bi ${icon} fs-1 mb-2`} style={{opacity: 0.2}}></i>
        <p className="mb-0 fw-semibold">{text}</p>
    </div>
);

export default Dashboard;