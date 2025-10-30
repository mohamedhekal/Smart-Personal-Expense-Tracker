<?php

namespace App\Http\Controllers;

use App\Models\FreelanceRevenue;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class FreelanceRevenueController extends Controller
{
    public function index(Request $request)
    {
        $items = FreelanceRevenue::where('user_id', $request->user()->id)->latest()->paginate(50);
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function show(Request $request, FreelanceRevenue $revenue)
    {
        abort_unless($revenue->user_id === $request->user()->id, 403);
        return response()->json(['success' => true, 'data' => $revenue]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'client' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric'],
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);
        if (!empty($validated['date'])) {
            $validated['date'] = Carbon::parse($validated['date'])->toDateString();
        }
        $validated['user_id'] = $request->user()->id;
        $item = FreelanceRevenue::create($validated);
        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function destroy(Request $request, FreelanceRevenue $revenue)
    {
        abort_unless($revenue->user_id === $request->user()->id, 403);
        $revenue->delete();
        return response()->json(['success' => true]);
    }
}
