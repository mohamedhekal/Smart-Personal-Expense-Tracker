<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $items = Expense::where('user_id', $request->user()->id)->latest()->paginate(50);
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric'],
            'category_id' => ['nullable', 'exists:expense_categories,id'],
            'date' => ['required'],
            'is_monthly' => ['boolean'],
            'auto_add' => ['boolean'],
            'day_of_month' => ['nullable', 'integer', 'between:1,31'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['date'] = $this->normalizeDate($validated['date']);
        $validated['user_id'] = $request->user()->id;
        $item = Expense::create($validated);
        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function show(Request $request, Expense $expense)
    {
        $this->authorizeOwnership($request->user()->id, $expense->user_id);
        return response()->json(['success' => true, 'data' => $expense]);
    }

    public function update(Request $request, Expense $expense)
    {
        $this->authorizeOwnership($request->user()->id, $expense->user_id);
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'amount' => ['sometimes', 'numeric'],
            'category_id' => ['nullable', 'exists:expense_categories,id'],
            'date' => ['sometimes'],
            'is_monthly' => ['boolean'],
            'auto_add' => ['boolean'],
            'day_of_month' => ['nullable', 'integer', 'between:1,31'],
            'notes' => ['nullable', 'string'],
        ]);
        if (array_key_exists('date', $validated)) {
            $validated['date'] = $this->normalizeDate($validated['date']);
        }
        $expense->update($validated);
        return response()->json(['success' => true, 'data' => $expense]);
    }

    public function destroy(Request $request, Expense $expense)
    {
        $this->authorizeOwnership($request->user()->id, $expense->user_id);
        $expense->delete();
        return response()->json(['success' => true]);
    }

    private function authorizeOwnership(int $authUserId, int $resourceUserId): void
    {
        abort_unless($authUserId === $resourceUserId, 403);
    }

    private function normalizeDate($value): string
    {
        return Carbon::parse($value)->toDateString();
    }
}
