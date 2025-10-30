<?php

namespace App\Http\Controllers;

use App\Models\Reminder;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    public function index(Request $request)
    {
        $items = Reminder::where('user_id', $request->user()->id)->latest()->paginate(50);
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function show(Request $request, Reminder $reminder)
    {
        abort_unless($reminder->user_id === $request->user()->id, 403);
        return response()->json(['success' => true, 'data' => $reminder]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'due_date' => ['nullable', 'date'],
            'is_done' => ['boolean'],
        ]);
        $validated['user_id'] = $request->user()->id;
        $item = Reminder::create($validated);
        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function destroy(Request $request, Reminder $reminder)
    {
        abort_unless($reminder->user_id === $request->user()->id, 403);
        $reminder->delete();
        return response()->json(['success' => true]);
    }
}
