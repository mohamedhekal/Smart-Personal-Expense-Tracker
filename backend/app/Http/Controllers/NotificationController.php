<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $items = Notification::where('user_id', $request->user()->id)->latest()->paginate(50);
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function show(Request $request, Notification $notification)
    {
        abort_unless($notification->user_id === $request->user()->id, 403);
        return response()->json(['success' => true, 'data' => $notification]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
            'data' => ['nullable', 'array'],
        ]);
        $validated['user_id'] = $request->user()->id;
        if (isset($validated['data'])) {
            $validated['data'] = json_encode($validated['data']);
        }
        $item = Notification::create($validated);
        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function destroy(Request $request, Notification $notification)
    {
        abort_unless($notification->user_id === $request->user()->id, 403);
        $notification->delete();
        return response()->json(['success' => true]);
    }
}
