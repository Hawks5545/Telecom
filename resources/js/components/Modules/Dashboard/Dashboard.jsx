import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
// 1. IMPORTAMOS EL PLUGIN DE ETIQUETAS
import ChartDataLabels from 'chartjs-plugin-datalabels'; 
import styles from './Dashboard.module.css'; 

// 2. REGISTRAMOS EL PLUGIN
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, ChartDataLabels);

// --- ESTRUCTURA INICIAL VACÍA ---
const initialData = {
    kpi: { files: 0, size: '0 MB', downloads_today: 0, users: 0 },
    charts: {
        campaigns: { labels: [], data: [] },
        distribution: { labels: [], data: [] }
    },
    activity: []
};

const Dashboard = () => {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('month'); 

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); 
            const token = localStorage.getItem('auth_token');
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/dashboard/stats?range=${timeRange}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Error dashboard", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [timeRange]); 

    // --- LÓGICA DE SCROLL DINÁMICO PARA BARRAS ---
    const campaignsCount = data.charts?.campaigns?.labels?.length || 0;
    const dynamicHeight = Math.max(300, campaignsCount * 50); 
    const chartHeightStyle = campaignsCount > 6 ? `${dynamicHeight}px` : '100%';

    // --- CONFIGURACIÓN GRÁFICOS ---
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1000,
            easing: 'easeOutQuart',
            delay: 200,
        },
    };

    const barData = {
        labels: data.charts?.campaigns?.labels || [],
        datasets: [{
            label: 'Descargas',
            data: data.charts?.campaigns?.data || [],
            backgroundColor: 'rgba(0, 169, 157, 0.75)', // Un poco más oscuro para que el texto blanco resalte
            borderColor: '#005461',
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.6,
        }]
    };

    const barOptions = {
        ...commonOptions,
        indexAxis: 'y',
        layout: {
            padding: { right: 30 } // Un poco de espacio extra a la derecha por si acaso
        },
        plugins: {
            legend: { display: false },
            title: { display: false }, 
            tooltip: {
                backgroundColor: 'rgba(0, 84, 97, 0.9)',
                padding: 10,
                cornerRadius: 8,
            },
            // --- CONFIGURACIÓN DE ETIQUETAS (BARRAS) ---
            datalabels: {
                color: '#ffffff', // Texto Blanco
                anchor: 'end',    // Anclado al final de la barra
                align: 'start',   // Alineado hacia adentro (para que quede dentro del color)
                offset: 4,
                font: {
                    weight: 'bold',
                    size: 12
                },
                formatter: (value) => {
                    return value > 0 ? value : ''; // Si es 0, no mostramos nada para que se vea limpio
                }
            }
        },
        scales: {
            x: { 
                grid: { color: '#f0f0f0' },
                ticks: { stepSize: 1, precision: 0, font: { size: 10 } },
                beginAtZero: true
            },
            y: { 
                grid: { display: false },
                ticks: { font: { size: 11, weight: '500' }, color: '#495057' }
            }
        }
    };

    const doughData = {
        labels: data.charts?.distribution?.labels || [],
        datasets: [{
            data: data.charts?.distribution?.data || [],
            backgroundColor: [
                'rgba(0, 84, 97, 0.85)', 'rgba(0, 169, 157, 0.85)', 'rgba(255, 193, 7, 0.85)',
                'rgba(13, 202, 240, 0.85)', 'rgba(220, 53, 69, 0.85)',
            ],
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 10
        }]
    };

    const doughOptions = {
        ...commonOptions,
        plugins: {
            legend: { 
                position: 'right',
                labels: { usePointStyle: true, font: { size: 11 }, boxWidth: 8 }
            },
            // --- CONFIGURACIÓN DE ETIQUETAS (DONA) ---
            datalabels: {
                color: '#ffffff',
                font: { weight: 'bold', size: 11 },
                formatter: (value) => {
                    return value > 0 ? value : ''; // Ocultar ceros
                }
            }
        },
        cutout: '65%', // Un poco más gruesa para que quepan los números
    };

    return (
        <div className={`container-fluid p-0 ${styles.dashboardGrid}`}>
            
            {/* --- SECCIÓN 1: HEADER + KPIS --- */}
            <div className={styles.sectionTop}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                     <h2 className={styles.pageTitle}><i className="bi bi-speedometer2 me-2"></i> Dashboard</h2>
                     {loading && <div className="spinner-border spinner-border-sm text-primary"></div>}
                </div>

                <div className="row g-2">
                    {/* KPI 1 */}
                    <div className="col-md-3">
                        <div className={`card shadow-sm border-start border-4 border-primary ${styles.cardEffect}`} style={{minHeight: '80px'}}>
                            <div className="card-body p-2 position-relative d-flex flex-column justify-content-center">
                                <div className="text-muted small fw-bold" style={{fontSize: '0.75rem'}}>ARCHIVOS</div>
                                <div className="fs-4 fw-bold text-dark lh-1">{data.kpi?.files || 0}</div>
                                <i className={`bi bi-music-note-list text-primary ${styles.iconBackground}`}></i>
                            </div>
                        </div>
                    </div>
                    {/* KPI 2 */}
                    <div className="col-md-3">
                        <div className={`card shadow-sm border-start border-4 border-success ${styles.cardEffect}`} style={{minHeight: '80px'}}>
                            <div className="card-body p-2 position-relative d-flex flex-column justify-content-center">
                                <div className="text-muted small fw-bold" style={{fontSize: '0.75rem'}}>ESPACIO</div>
                                <div className="fs-4 fw-bold text-dark lh-1">{data.kpi?.size || '0 MB'}</div>
                                <i className={`bi bi-hdd-fill text-success ${styles.iconBackground}`}></i>
                            </div>
                        </div>
                    </div>
                    {/* KPI 3 */}
                    <div className="col-md-3">
                        <div className={`card shadow-sm border-start border-4 border-warning ${styles.cardEffect}`} style={{minHeight: '80px'}}>
                            <div className="card-body p-2 position-relative d-flex flex-column justify-content-center">
                                <div className="text-muted small fw-bold" style={{fontSize: '0.75rem'}}>DESCARGAS</div>
                                <div className="fs-4 fw-bold text-dark lh-1">{data.kpi?.downloads_today || 0}</div>
                                <i className={`bi bi-download text-warning ${styles.iconBackground}`}></i>
                            </div>
                        </div>
                    </div>
                    {/* KPI 4 */}
                    <div className="col-md-3">
                        <div className={`card shadow-sm border-start border-4 border-info ${styles.cardEffect}`} style={{minHeight: '80px'}}>
                            <div className="card-body p-2 position-relative d-flex flex-column justify-content-center">
                                <div className="text-muted small fw-bold" style={{fontSize: '0.75rem'}}>USUARIOS</div>
                                <div className="fs-4 fw-bold text-dark lh-1">{data.kpi?.users || 0}</div>
                                <i className={`bi bi-people-fill text-info ${styles.iconBackground}`}></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 2: GRÁFICOS --- */}
            <div className={`${styles.sectionCharts} row g-2`}>
                
                {/* GRÁFICO BARRAS */}
                <div className="col-md-8 h-100">
                    <div className={`card h-100 shadow-sm ${styles.cardEffect}`}>
                        <div className={`card-header py-1 ${styles.cardHeaderCustom} d-flex justify-content-between align-items-center`}>
                            <div><i className="bi bi-bar-chart-line-fill me-2 text-primary"></i> Demanda</div>
                            <div className={styles.filterGroup}>
                                <button className={`${styles.filterBtn} ${timeRange === 'day' ? styles.filterBtnActive : ''}`} onClick={() => setTimeRange('day')}>Hoy</button>
                                <button className={`${styles.filterBtn} ${timeRange === 'week' ? styles.filterBtnActive : ''}`} onClick={() => setTimeRange('week')}>Sem</button>
                                <button className={`${styles.filterBtn} ${timeRange === 'month' ? styles.filterBtnActive : ''}`} onClick={() => setTimeRange('month')}>Mes</button>
                            </div>
                        </div>
                        
                        <div className="card-body p-2 h-100 d-flex flex-column overflow-hidden">
                            <div className={styles.chartScrollWrapper}>
                                <div style={{ height: chartHeightStyle, width: '100%' }}>
                                    <Bar data={barData} options={barOptions} key={`bar-${timeRange}`} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* GRÁFICO DONA */}
                <div className="col-md-4 h-100">
                    <div className={`card h-100 shadow-sm ${styles.cardEffect}`}>
                        <div className={`card-header py-1 ${styles.cardHeaderCustom}`}>
                            <i className="bi bi-pie-chart-fill me-2 text-success"></i> Distribución
                        </div>
                        <div className="card-body p-2 h-100 d-flex align-items-center justify-content-center">
                             <div className={styles.doughnutContainer}>
                                <Doughnut data={doughData} options={doughOptions} key={`dough-${timeRange}`} />
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 3: TABLA DE ACTIVIDAD --- */}
            <div className={`card shadow-sm ${styles.sectionTable} ${styles.cardEffect}`}>
                <div className={`card-header py-2 ${styles.cardHeaderCustom}`}>
                    <i className="bi bi-activity me-2 text-danger"></i> Actividad Reciente
                </div>
                
                <div className={styles.tableScrollContainer}>
                    <table className="table table-sm align-middle mb-0 w-100">
                        <thead className="table-light sticky-top" style={{zIndex: 1}}>
                            <tr><th className="ps-3">Usuario</th><th>Acción</th><th className="text-end pe-3">Hace...</th></tr>
                        </thead>
                        <tbody>
                            {data.activity && data.activity.length > 0 ? (
                                data.activity.map(log => (
                                    <tr key={log.id} style={{fontSize: '0.85rem'}}>
                                        <td className={`ps-3 ${styles.userText}`}>{log.user}</td>
                                        <td>
                                            <span className={
                                                log.action.includes('Descarga') ? styles.badgeSoftSuccess : 
                                                log.action === 'Indexación' ? styles.badgeSoftPrimary : 
                                                log.action === 'Login' ? styles.badgeSoftInfo : 'badge bg-secondary'
                                            }>{log.action}</span>
                                        </td>
                                        <td className="text-end pe-3 text-muted small">{log.time}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="3" className="text-center py-2 text-muted">Cargando actividad...</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;