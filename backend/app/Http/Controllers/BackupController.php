<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class BackupController extends Controller
{
    public function latest(Request $request)
    {
        return response()->json(['success' => true, 'data' => null]);
    }

    public function show(Request $request, string $id)
    {
        return response()->json(['success' => true, 'data' => null]);
    }

    public function export(Request $request)
    {
        return response()->json(['success' => true, 'message' => 'Export started']);
    }

    public function import(Request $request)
    {
        return response()->json(['success' => true, 'message' => 'Import queued']);
    }

    public function destroy(Request $request, string $id)
    {
        return response()->json(['success' => true]);
    }
}
