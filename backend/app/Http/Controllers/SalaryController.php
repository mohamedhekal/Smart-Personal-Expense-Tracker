<?php

namespace App\Http\Controllers;

use App\Models\Salary;
use Illuminate\Http\Request;

class SalaryController extends Controller
{
    public function index(Request $request)
    {
        $items = Salary::where('user_id', $request->user()->id)->latest()->paginate(50);
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric'],
            'received_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'is_recurring' => ['boolean'],
            'day_of_month' => ['nullable', 'integer', 'between:1,31'],
            'is_certificate_return' => ['boolean'],
            'certificate_id' => ['nullable', 'exists:bank_certificates,id'],
        ]);
        $validated['user_id'] = $request->user()->id;
        $item = Salary::create($validated);
        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function show(Request $request, Salary $salary)
    {
        $this->authorizeOwnership($request->user()->id, $salary->user_id);
        return response()->json(['success' => true, 'data' => $salary]);
    }

    public function update(Request $request, Salary $salary)
    {
        $this->authorizeOwnership($request->user()->id, $salary->user_id);
        $validated = $request->validate([
            'company' => ['sometimes', 'string', 'max:255'],
            'amount' => ['sometimes', 'numeric'],
            'received_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'is_recurring' => ['boolean'],
            'day_of_month' => ['nullable', 'integer', 'between:1,31'],
            'is_certificate_return' => ['boolean'],
            'certificate_id' => ['nullable', 'exists:bank_certificates,id'],
        ]);
        $salary->update($validated);
        return response()->json(['success' => true, 'data' => $salary]);
    }

    public function destroy(Request $request, Salary $salary)
    {
        $this->authorizeOwnership($request->user()->id, $salary->user_id);
        $salary->delete();
        return response()->json(['success' => true]);
    }

    private function authorizeOwnership(int $authUserId, int $resourceUserId): void
    {
        abort_unless($authUserId === $resourceUserId, 403);
    }
}
