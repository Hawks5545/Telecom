<!DOCTYPE html>
<html>
<head>
    <title>Reporte de Actividad</title>
    <style>
        body { 
            font-family: sans-serif; 
            font-size: 12px; 
            color: #333;
            margin: 0;
            padding: 0;
        }

        /* --- CABECERA CON LOGO Y TÍTULO --- */
        .header-table {
            width: 100%;
            border-bottom: 2px solid #005461;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        .logo-cell {
            width: 40%; 
            text-align: left;
            vertical-align: middle;
        }
        .title-cell {
            width: 70%; 
            text-align: right;
            vertical-align: middle;
        }
        .logo-img {
            max-height: 80px; 
            max-width: 300px;
            object-fit: contain;
        }
        .report-title {
            margin: 0;
            color: #005461;
            text-transform: uppercase;
            font-size: 18px;
        }
        .report-date {
            margin: 5px 0 0;
            color: #666;
            font-size: 10px;
        }

        /* --- TABLAS GENERALES --- */
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px; 
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 10px; 
            text-align: center; 
        }
        th { 
            background-color: #005461; 
            color: white; 
            font-weight: bold; 
        }
        
        /* --- TARJETAS DE RESUMEN (KPIs) --- */
        .summary-table td { 
            width: 25%; 
            vertical-align: middle;
        }
        .summary-label { 
            display: block; 
            font-size: 9px; 
            color: #666; 
            text-transform: uppercase; 
            margin-bottom: 5px; 
            font-weight: bold;
        }
        .summary-value { 
            display: block; 
            font-size: 18px; 
            font-weight: bold; 
            color: #005461; 
        }
        .bg-light { background-color: #f8f9fa; }
        
        /* RESALTE PARA LA NUEVA MÉTRICA (TOTAL EN BD) */
        .highlight-cell { 
            background-color: #e3f2fd; /* Azul muy suave */
            border-color: #bbdefb;
        }
        .highlight-value { 
            color: #0277bd; 
        }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td style="border: none;" class="logo-cell">
                <img src="{{ public_path('images/logo/TextLogo.png') }}" class="logo-img" alt="Logo Telecom">
            </td>
            <td style="border: none;" class="title-cell">
                <h2 class="report-title">Reporte de Gestión</h2>
                <p class="report-date">Generado el: {{ date('Y-m-d H:i') }}</p>
            </td>
        </tr>
    </table>

    <table class="summary-table" style="margin-bottom: 30px;">
        <tr>
            <td class="bg-light">
                <span class="summary-label">Total Indexados (Histórico)</span>
                <span class="summary-value">{{ $stats['total'] }}</span>
            </td>
            <td class="highlight-cell">
                <span class="summary-label" style="color: #0277bd;">Total en BD (Actual)</span>
                <span class="summary-value highlight-value">{{ $stats['current_db'] }}</span>
            </td>
            <td class="bg-light">
                <span class="summary-label">Descargas (Individual)</span>
                <span class="summary-value">{{ $stats['descargadas'] }}</span>
            </td>
            <td class="bg-light">
                <span class="summary-label">ZIPs Generados</span>
                <span class="summary-value">{{ $stats['zip'] }}</span>
            </td>
        </tr>
    </table>

    <div style="margin-bottom: 10px; color: #444; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
        <strong style="font-size: 14px;">Detalle Diario por Agente</strong>
    </div>

    <table>
        <thead>
            <tr>
                <th style="text-align: left;">Fecha</th>
                <th style="text-align: left;">Agente</th>
                <th>Indexados (Archivos)</th>
                <th>Descargas (Individual)</th>
                <th>ZIPs Generados</th>
            </tr>
        </thead>
        <tbody>
            @forelse($data as $row)
            <tr>
                <td style="text-align: left;">{{ $row['fecha'] }}</td>
                <td style="text-align: left;"><strong>{{ $row['agente'] }}</strong></td>
                <td>{{ $row['totalGrabaciones'] }}</td>
                <td>{{ $row['descargadas'] }}</td>
                <td>{{ $row['zipGenerados'] }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="5" style="padding: 20px; color: #777; background-color: #f9f9f9;">
                    No hay datos para mostrar con los filtros seleccionados.
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>