<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $items = ExpenseCategory::where('user_id', $request->user()->id)->orderBy('name')->get();
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:50'],
            'is_default' => ['boolean'],
        ]);
        $validated['user_id'] = $request->user()->id;
        $item = ExpenseCategory::create($validated);
        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function destroy(Request $request, ExpenseCategory $category)
    {
        $this->authorizeOwnership($request->user()->id, $category->user_id);
        $category->delete();
        return response()->json(['success' => true]);
    }

    private function authorizeOwnership(int $authUserId, int $resourceUserId): void
    {
        abort_unless($authUserId === $resourceUserId, 403);
    }
}
