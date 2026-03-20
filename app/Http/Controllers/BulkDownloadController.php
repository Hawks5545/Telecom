<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Recording;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use PhpOffice\PhpSpreadsheet\IOFactory as SpreadsheetFactory;
use PhpOffice\PhpWord\IOFactory as WordFactory;
use ZipStream\ZipStream;

class BulkDownloadController extends Controller
{
    private const MAX_FILES     = 5000;
    private const ALLOWED_TYPES = ['xlsx', 'xls', 'csv', 'txt', 'docx'];

    // --- 1. PREVISUALIZAR ---
    public function preview(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240'
        ]);

        $file      = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());

        if (!in_array($extension, self::ALLOWED_TYPES)) {
            return response()->json([
                'message' => 'Formato no permitido. Use: xlsx, xls, csv, txt, docx.'
            ], 422);
        }

        try {
            $tiempoInicio = microtime(true);

            $valores = $this->extractValues($file, $extension);

            if (empty($valores)) {
                return response()->json(['message' => 'No se encontraron datos en el archivo.'], 422);
            }

            $valoresBuscables = array_values(array_unique(
                array_filter($valores, fn($v) => $this->esValorBuscable($v))
            ));

            if (empty($valoresBuscables)) {
                return response()->json(['message' => 'No se encontraron nombres válidos en el archivo.'], 422);
            }

            if (count($valoresBuscables) > self::MAX_FILES) {
                return response()->json([
                    'message' => 'El archivo supera el límite de ' . self::MAX_FILES . ' grabaciones.'
                ], 422);
            }

            $tiempoExtraccion = round((microtime(true) - $tiempoInicio) * 1000);
            Log::info("BulkDownload extracción: {$tiempoExtraccion}ms — " . count($valoresBuscables) . " valores buscables de " . count($valores) . " totales");

            $tiempoBusqueda         = microtime(true);
            $grabacionesEncontradas = $this->busquedaHibrida($valoresBuscables);
            $tiempoBusquedaTotal    = round((microtime(true) - $tiempoBusqueda) * 1000);
            Log::info("BulkDownload búsqueda: {$tiempoBusquedaTotal}ms — {$grabacionesEncontradas->count()} grabaciones encontradas");

            $encontradas   = [];
            $noEncontradas = [];
            $idsUsados     = [];

            foreach ($valoresBuscables as $valor) {
                $limpio = pathinfo($valor, PATHINFO_FILENAME);

                $match = $grabacionesEncontradas->first(function ($rec) use ($limpio, $valor) {
                    $recNombre = pathinfo($rec->filename, PATHINFO_FILENAME);
                    return $recNombre === $limpio
                        || str_starts_with($rec->filename, $limpio)
                        || $rec->cedula   === $valor
                        || $rec->telefono === $valor;
                });

                if ($match && !in_array($match->id, $idsUsados)) {
                    $encontradas[] = [
                        'id'       => $match->id,
                        'filename' => $match->filename,
                        'size'     => $match->size,
                        'campana'  => $match->storageLocation->name ?? 'Sin campaña',
                    ];
                    $idsUsados[] = $match->id;
                } else {
                    $noEncontradas[] = $valor;
                }
            }

            $tiempoTotal = round((microtime(true) - $tiempoInicio) * 1000);
            Log::info("BulkDownload TOTAL: {$tiempoTotal}ms — Encontradas: " . count($encontradas) . " | No encontradas: " . count($noEncontradas));

            return response()->json([
                'total_archivo'        => count($valoresBuscables),
                'encontradas'          => count($encontradas),
                'no_encontradas'       => count($noEncontradas),
                'lista_encontradas'    => $encontradas,
                'lista_no_encontradas' => $noEncontradas,
            ]);

        } catch (\Exception $e) {
            Log::error("BulkDownload preview error: " . $e->getMessage());
            return response()->json(['message' => 'Error al procesar el archivo: ' . $e->getMessage()], 500);
        }
    }

    // --- 2. GENERAR TOKEN TEMPORAL DE DESCARGA ---
    public function generateToken(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return response()->json(['message' => 'No hay grabaciones seleccionadas.'], 400);
        }

        if (count($ids) > self::MAX_FILES) {
            return response()->json(['message' => 'Límite de ' . self::MAX_FILES . ' archivos excedido.'], 422);
        }

        // Generar token único y guardarlo en caché por 5 minutos
        $token = \Illuminate\Support\Str::random(64);
        Cache::put("bulk_download_{$token}", [
            'ids'     => $ids,
            'user_id' => Auth::id(),
            'ip'      => $request->ip(),
        ], 300); // 5 minutos

        return response()->json(['token' => $token]);
    }

    // --- 3. DESCARGA ZIP POR TOKEN (GET — Streaming inmediato) ---
    public function streamByToken(string $token)
    {
        $data = Cache::get("bulk_download_{$token}");

        if (!$data) {
            abort(404, 'Token de descarga inválido o expirado.');
        }

        // Invalidar token inmediatamente — un solo uso
        Cache::forget("bulk_download_{$token}");

        $ids = $data['ids'];

        $recordings = Recording::whereIn('id', $ids)
            ->select('id', 'filename', 'full_path', 'storage_location_id')
            ->with('storageLocation:id,name')
            ->get();

        if ($recordings->isEmpty()) {
            abort(404, 'No se encontraron grabaciones.');
        }

        $zipName        = 'Descarga_Masiva_' . date('Ymd_His') . '.zip';
        $campaignCounts = [];

        foreach ($recordings as $rec) {
            $campName = $rec->storageLocation->name ?? 'General';
            if (!isset($campaignCounts[$campName])) $campaignCounts[$campName] = 0;
            $campaignCounts[$campName]++;
        }

        // Auditoría
        try {
            AuditLog::create([
                'user_id'    => $data['user_id'],
                'action'     => 'Descarga ZIP Masiva',
                'details'    => "Descarga masiva por listado: {$recordings->count()} archivos.",
                'metadata'   => json_encode([
                    'file_count'          => $recordings->count(),
                    'campaigns_breakdown' => $campaignCounts
                ]),
                'ip_address' => $data['ip']
            ]);
        } catch (\Exception $e) {}

        // STREAMING DIRECTO — Sin esperar blob completo en el frontend
        return response()->stream(function () use ($recordings, $zipName) {

            $zip = new ZipStream(
                outputName: $zipName,
                sendHttpHeaders: false,
            );

            foreach ($recordings as $rec) {
                if (!file_exists($rec->full_path)) continue;

                try {
                    $zip->addFileFromPath(
                        fileName: $rec->filename,
                        path: $rec->full_path,
                    );
                } catch (\Exception $e) {
                    Log::warning("BulkDownload ZIP: No se pudo agregar {$rec->filename}: " . $e->getMessage());
                }
            }

            $zip->finish();

        }, 200, [
            'Content-Type'        => 'application/zip',
            'Content-Disposition' => 'attachment; filename="' . $zipName . '"',
            'Cache-Control'       => 'no-cache, no-store, must-revalidate',
            'X-Accel-Buffering'   => 'no',
            'Expires'             => '0',
        ]);
    }

    // --- BÚSQUEDA HÍBRIDA EN 3 PASOS ---
    private function busquedaHibrida(array $valores): \Illuminate\Support\Collection
    {
        $sinExtension = array_map(fn($v) => pathinfo($v, PATHINFO_FILENAME), $valores);
        $conExtension = $valores;

        // PASO 1: whereIn en filename
        $t1    = microtime(true);
        $paso1 = Recording::where(function ($q) use ($sinExtension, $conExtension) {
                $q->whereIn('filename', $conExtension)
                  ->orWhereIn('filename', $sinExtension);
            })
            ->select('id', 'filename', 'cedula', 'telefono', 'size', 'storage_location_id')
            ->with('storageLocation:id,name')
            ->get();
        Log::info("BulkDownload PASO1: " . round((microtime(true) - $t1) * 1000) . "ms — {$paso1->count()} encontradas");

        $encontradosPaso1   = $paso1->map(fn($r) => pathinfo($r->filename, PATHINFO_FILENAME))->toArray();
        $noEncontradosPaso1 = array_values(array_filter($sinExtension, fn($v) => !in_array($v, $encontradosPaso1)));

        if (empty($noEncontradosPaso1)) return $paso1;

        // PASO 2: whereIn en cédula y teléfono
        $t2    = microtime(true);
        $paso2 = Recording::where(function ($q) use ($noEncontradosPaso1) {
                $q->whereIn('cedula', $noEncontradosPaso1)
                  ->orWhereIn('telefono', $noEncontradosPaso1);
            })
            ->select('id', 'filename', 'cedula', 'telefono', 'size', 'storage_location_id')
            ->with('storageLocation:id,name')
            ->get();
        Log::info("BulkDownload PASO2: " . round((microtime(true) - $t2) * 1000) . "ms — {$paso2->count()} encontradas");

        $encontradosPaso2   = $paso2->flatMap(fn($r) => [$r->cedula, $r->telefono])->filter()->toArray();
        $noEncontradosPaso2 = array_values(array_filter($noEncontradosPaso1, fn($v) => !in_array($v, $encontradosPaso2)));

        if (empty($noEncontradosPaso2)) return $paso1->merge($paso2)->unique('id');

        // PASO 3: LIKE en filename
        $t3    = microtime(true);
        $paso3 = Recording::where(function ($q) use ($noEncontradosPaso2) {
                foreach ($noEncontradosPaso2 as $valor) {
                    $q->orWhere('filename', 'like', $valor . '%');
                }
            })
            ->select('id', 'filename', 'cedula', 'telefono', 'size', 'storage_location_id')
            ->with('storageLocation:id,name')
            ->get();
        Log::info("BulkDownload PASO3: " . round((microtime(true) - $t3) * 1000) . "ms — {$paso3->count()} encontradas — " . count($noEncontradosPaso2) . " valores buscados");

        return $paso1->merge($paso2)->merge($paso3)->unique('id');
    }

    // --- VALIDAR SI UN VALOR ES BUSCABLE ---
    private function esValorBuscable(string $valor): bool
    {
        $valor = trim($valor);

        if (strlen($valor) < 4) return false;

        if (preg_match('/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/', $valor)) return false;
        if (preg_match('/^\d{4}[\/\-]\d{2}[\/\-]\d{2}$/', $valor)) return false;
        if (preg_match('/^\d+$/', $valor) && (int)$valor >= 40000 && (int)$valor <= 60000) return false;
        if (preg_match('/^\d+(\.\d+)?\s*(bytes?|kb|mb|gb)/i', $valor)) return false;
        if (preg_match('/^\d{1,4}$/', $valor)) return false;

        $encabezados = ['nombre', 'fecha', 'tamaño', 'peso', 'size', 'name', 'date', 'archivo', 'file'];
        if (in_array(strtolower($valor), $encabezados)) return false;

        return true;
    }

    // --- EXTRACTOR DE VALORES POR FORMATO ---
    private function extractValues($file, string $extension): array
    {
        $path    = $file->getRealPath();
        $valores = [];

        switch ($extension) {
            case 'xlsx':
            case 'xls':
                $spreadsheet = SpreadsheetFactory::load($path);
                $sheet       = $spreadsheet->getActiveSheet();

                foreach ($sheet->getRowIterator() as $row) {
                    $cellIterator = $row->getCellIterator();
                    $cellIterator->setIterateOnlyExistingCells(true);

                    foreach ($cellIterator as $cell) {
                        $rawValue = $cell->getValue();

                        if (is_numeric($rawValue) && (int)$rawValue >= 40000 && (int)$rawValue <= 60000) {
                            continue;
                        }

                        $valor = trim((string) $rawValue);
                        if (!empty($valor)) $valores[] = $valor;
                    }
                }
                break;

            case 'csv':
                if (($handle = fopen($path, 'r')) !== false) {
                    while (($data = fgetcsv($handle)) !== false) {
                        foreach ($data as $valor) {
                            $valor = trim($valor);
                            if (!empty($valor)) $valores[] = $valor;
                        }
                    }
                    fclose($handle);
                }
                break;

            case 'txt':
                $lineas = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lineas as $linea) {
                    $partes = preg_split('/[,;\t|]+/', $linea);
                    foreach ($partes as $parte) {
                        $valor = trim($parte);
                        if (!empty($valor)) $valores[] = $valor;
                    }
                }
                break;

            case 'docx':
                $phpWord = WordFactory::load($path);
                foreach ($phpWord->getSections() as $section) {
                    foreach ($section->getElements() as $element) {
                        if (method_exists($element, 'getElements')) {
                            foreach ($element->getElements() as $child) {
                                if (method_exists($child, 'getText')) {
                                    $valor = trim($child->getText());
                                    if (!empty($valor)) $valores[] = $valor;
                                }
                            }
                        }
                    }
                }
                break;
        }

        return $valores;
    }
}
