<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::where('user_id', $request->user()->id)->latest();
        // Support both our current names and spec names
        $action = $request->string('action')->toString();
        $entityType = $request->string('entity_type', $request->string('entityType')->toString())->toString();
        $from = $request->input('from', $request->input('startDate'));
        $to = $request->input('to', $request->input('endDate'));
        if ($action !== '') {
            $query->where('action', $action);
        }
        if ($entityType !== '') {
            $query->where('entity_type', $entityType);
        }
        if (!empty($from)) {
            $query->whereDate('created_at', '>=', $from);
        }
        if (!empty($to)) {
            $query->whereDate('created_at', '<=', $to);
        }
        $items = $query->paginate(50);
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'max:255'],
            'entity_type' => ['nullable', 'string', 'max:255'],
            'entity_id' => ['nullable', 'integer'],
            'details' => ['nullable', 'array'],
            'amount' => ['nullable', 'numeric'],
        ]);
        $validated['user_id'] = $request->user()->id;
        if (isset($validated['details']) && is_array($validated['details'])) {
            $validated['details'] = json_encode($validated['details']);
        }
        $log = ActivityLog::create($validated);
        return response()->json(['success' => true, 'data' => $log], 201);
    }

    public function destroy(Request $request, ActivityLog $activityLog)
    {
        abort_unless($request->user()->id === $activityLog->user_id, 403);
        $activityLog->delete();
        return response()->json(['success' => true]);
    }

    public function clear(Request $request)
    {
        $query = ActivityLog::where('user_id', $request->user()->id);
        $action = $request->string('action')->toString();
        $entityType = $request->string('entity_type', $request->string('entityType')->toString())->toString();
        $from = $request->input('from', $request->input('startDate'));
        $to = $request->input('to', $request->input('endDate'));
        if ($action !== '') {
            $query->where('action', $action);
        }
        if ($entityType !== '') {
            $query->where('entity_type', $entityType);
        }
        if (!empty($from)) {
            $query->whereDate('created_at', '>=', $from);
        }
        if (!empty($to)) {
            $query->whereDate('created_at', '<=', $to);
        }
        $deleted = $query->delete();
        return response()->json(['success' => true, 'deleted' => $deleted]);
    }
}
