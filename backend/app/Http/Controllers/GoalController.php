<?php

namespace App\Http\Controllers;

use App\Models\FinancialGoal;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class GoalController extends Controller
{
    public function index(Request $request)
    {
        $items = FinancialGoal::where('user_id', $request->user()->id)->latest()->get();
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function show(Request $request, FinancialGoal $goal)
    {
        $this->authorizeOwnership($request->user()->id, $goal->user_id);
        return response()->json(['success' => true, 'data' => $goal]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'target_amount' => ['required', 'numeric', 'between:0,9999999999.99'],
            'current_amount' => ['nullable', 'numeric', 'between:0,9999999999.99'],
            'deadline' => ['nullable', 'date'],
            'reminder_enabled' => ['boolean'],
        ]);
        if (!empty($validated['deadline'])) {
            $validated['deadline'] = Carbon::parse($validated['deadline'])->toDateString();
        }
        $validated['user_id'] = $request->user()->id;
        $item = FinancialGoal::create($validated);
        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function update(Request $request, FinancialGoal $goal)
    {
        $this->authorizeOwnership($request->user()->id, $goal->user_id);
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'target_amount' => ['sometimes', 'numeric', 'between:0,9999999999.99'],
            'current_amount' => ['nullable', 'numeric', 'between:0,9999999999.99'],
            'deadline' => ['nullable', 'date'],
            'reminder_enabled' => ['boolean'],
        ]);
        if (!empty($validated['deadline'])) {
            $validated['deadline'] = Carbon::parse($validated['deadline'])->toDateString();
        }
        $goal->update($validated);
        return response()->json(['success' => true, 'data' => $goal]);
    }

    public function destroy(Request $request, FinancialGoal $goal)
    {
        $this->authorizeOwnership($request->user()->id, $goal->user_id);
        $goal->delete();
        return response()->json(['success' => true]);
    }

    public function addAmount(Request $request, FinancialGoal $goal)
    {
        $this->authorizeOwnership($request->user()->id, $goal->user_id);
        $validated = $request->validate([
            'amount' => ['required', 'numeric']
        ]);
        $goal->increment('current_amount', $validated['amount']);
        return response()->json(['success' => true, 'data' => $goal->fresh()]);
    }

    private function authorizeOwnership(int $authUserId, int $resourceUserId): void
    {
        abort_unless($authUserId === $resourceUserId, 403);
    }
}
