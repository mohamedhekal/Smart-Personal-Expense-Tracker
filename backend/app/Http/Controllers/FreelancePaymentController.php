<?php

namespace App\Http\Controllers;

use App\Models\FreelancePayment;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class FreelancePaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = FreelancePayment::where('user_id', $request->user()->id)->latest();
        if ($request->filled('revenueId')) {
            $query->where('revenue_id', $request->integer('revenueId'));
        }
        $items = $query->paginate(50);
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function show(Request $request, FreelancePayment $payment)
    {
        abort_unless($payment->user_id === $request->user()->id, 403);
        return response()->json(['success' => true, 'data' => $payment]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'revenue_id' => ['required', 'exists:freelance_revenues,id'],
            'amount' => ['required', 'numeric'],
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);
        if (!empty($validated['date'])) {
            $validated['date'] = Carbon::parse($validated['date'])->toDateString();
        }
        $validated['user_id'] = $request->user()->id;
        $item = FreelancePayment::create($validated);
        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function destroy(Request $request, FreelancePayment $payment)
    {
        abort_unless($payment->user_id === $request->user()->id, 403);
        $payment->delete();
        return response()->json(['success' => true]);
    }
}
