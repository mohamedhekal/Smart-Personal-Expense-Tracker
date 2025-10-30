<?php

namespace App\Http\Controllers;

use App\Models\GoldPurchase;
use App\Models\GoldSale;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class GoldController extends Controller
{
    public function purchasesIndex(Request $request)
    {
        $items = GoldPurchase::where('user_id', $request->user()->id)->latest()->paginate(50);
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function purchaseShow(Request $request, GoldPurchase $purchase)
    {
        $this->authorizeOwnership($request->user()->id, $purchase->user_id);
        return response()->json(['success' => true, 'data' => $purchase]);
    }

    public function purchaseStore(Request $request)
    {
        $validated = $request->validate([
            'invoice_value' => ['required', 'numeric'],
            'grams' => ['required', 'numeric'],
            'price_per_gram' => ['required', 'numeric'],
            'purity' => ['nullable', 'string', 'max:50'],
            'type' => ['nullable', 'string', 'max:50'],
            'purchase_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);
        if (!empty($validated['purchase_date'])) {
            $validated['purchase_date'] = Carbon::parse($validated['purchase_date'])->toDateString();
        }
        $validated['user_id'] = $request->user()->id;
        $item = GoldPurchase::create($validated);
        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function purchaseUpdate(Request $request, GoldPurchase $purchase)
    {
        $this->authorizeOwnership($request->user()->id, $purchase->user_id);
        $validated = $request->validate([
            'invoice_value' => ['sometimes', 'numeric'],
            'grams' => ['sometimes', 'numeric'],
            'price_per_gram' => ['sometimes', 'numeric'],
            'purity' => ['nullable', 'string', 'max:50'],
            'type' => ['nullable', 'string', 'max:50'],
            'purchase_date' => ['sometimes', 'date'],
            'notes' => ['nullable', 'string'],
        ]);
        if (!empty($validated['purchase_date'])) {
            $validated['purchase_date'] = Carbon::parse($validated['purchase_date'])->toDateString();
        }
        $purchase->update($validated);
        return response()->json(['success' => true, 'data' => $purchase]);
    }

    public function purchaseDestroy(Request $request, GoldPurchase $purchase)
    {
        $this->authorizeOwnership($request->user()->id, $purchase->user_id);
        $purchase->delete();
        return response()->json(['success' => true]);
    }

    public function saleStore(Request $request)
    {
        $validated = $request->validate([
            'purchase_id' => ['nullable', 'exists:gold_purchases,id'],
            'sale_value' => ['required', 'numeric'],
            'price_per_gram' => ['nullable', 'numeric'],
            'sale_date' => ['required', 'date'],
            'profit_loss' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
        ]);
        if (!empty($validated['sale_date'])) {
            $validated['sale_date'] = Carbon::parse($validated['sale_date'])->toDateString();
        }
        $validated['user_id'] = $request->user()->id;
        $item = GoldSale::create($validated);
        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function salesIndex(Request $request)
    {
        $items = GoldSale::where('user_id', $request->user()->id)->latest()->paginate(50);
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function saleShow(Request $request, GoldSale $sale)
    {
        $this->authorizeOwnership($request->user()->id, $sale->user_id);
        return response()->json(['success' => true, 'data' => $sale]);
    }

    public function saleDestroy(Request $request, GoldSale $sale)
    {
        $this->authorizeOwnership($request->user()->id, $sale->user_id);
        $sale->delete();
        return response()->json(['success' => true]);
    }

    private function authorizeOwnership(int $authUserId, int $resourceUserId): void
    {
        abort_unless($authUserId === $resourceUserId, 403);
    }
}
