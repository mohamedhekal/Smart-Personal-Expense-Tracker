<?php

namespace App\Http\Controllers;

use App\Models\WhatsAppSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class WhatsAppSubscriptionController extends Controller
{
    public function index(Request $request)
    {
        $items = WhatsAppSubscription::where('user_id', $request->user()->id)->latest()->paginate(50);
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function show(Request $request, WhatsAppSubscription $subscription)
    {
        abort_unless($subscription->user_id === $request->user()->id, 403);
        return response()->json(['success' => true, 'data' => $subscription]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:50'],
            'plan' => ['nullable', 'string', 'max:100'],
            'amount' => ['nullable', 'numeric'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string'],
        ]);
        if (!empty($validated['start_date'])) {
            $validated['start_date'] = Carbon::parse($validated['start_date'])->toDateString();
        }
        if (!empty($validated['end_date'])) {
            $validated['end_date'] = Carbon::parse($validated['end_date'])->toDateString();
        }
        $validated['user_id'] = $request->user()->id;
        $item = WhatsAppSubscription::create($validated);
        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function destroy(Request $request, WhatsAppSubscription $subscription)
    {
        abort_unless($subscription->user_id === $request->user()->id, 403);
        $subscription->delete();
        return response()->json(['success' => true]);
    }
}
