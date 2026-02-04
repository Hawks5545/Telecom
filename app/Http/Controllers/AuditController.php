<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AuditLog;
use App\Models\User;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user'); 

        // --- FILTROS ---
        if ($request->filled('dateFrom')) {
            $query->whereDate('created_at', '>=', $request->dateFrom);
        }

        if ($request->filled('dateTo')) {
            $query->whereDate('created_at', '<=', $request->dateTo);
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