<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AuditLog;
use App\Models\User;
use Carbon\Carbon; // Importante para manejar fechas

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user'); 

        // --- FILTROS CON LÓGICA DE FECHAS MEJORADA ---
        
        if ($request->filled('dateFrom') && $request->filled('dateTo')) {
            // Caso: Rango completo (Desde el inicio del día X hasta el final del día Y)
            $from = Carbon::parse($request->dateFrom)->startOfDay(); 
            $to = Carbon::parse($request->dateTo)->endOfDay();       
            
            $query->whereBetween('created_at', [$from, $to]);

        } else {
            // Caso: Solo fecha de inicio
            if ($request->filled('dateFrom')) {
                $from = Carbon::parse($request->dateFrom)->startOfDay();
                $query->where('created_at', '>=', $from);
            }
            // Caso: Solo fecha final
            if ($request->filled('dateTo')) {
                $to = Carbon::parse($request->dateTo)->endOfDay();
                $query->where('created_at', '<=', $to);
            }
        }

        if ($request->filled('userId')) {
            $query->where('user_id', $request->userId);
        }

        if ($request->filled('action')) {
            $query->where('action', 'like', '%' . $request->action . '%');
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json($logs);
    }

    public function getUsers()
    {
        return response()->json(User::select('id', 'name')->orderBy('name')->get());
    }
}