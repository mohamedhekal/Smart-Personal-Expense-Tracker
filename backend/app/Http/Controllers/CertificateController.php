<?php

namespace App\Http\Controllers;

use App\Models\BankCertificate;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CertificateController extends Controller
{
    public function index(Request $request)
    {
        $items = BankCertificate::where('user_id', $request->user()->id)->latest()->paginate(50);
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function show(Request $request, BankCertificate $certificate)
    {
        $this->authorizeOwnership($request->user()->id, $certificate->user_id);
        return response()->json(['success' => true, 'data' => $certificate]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'bank_name' => ['required', 'string', 'max:255'],
            'certificate_name' => ['required', 'string', 'max:255'],
            'certificate_number' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric'],
            'monthly_return' => ['nullable', 'numeric'],
            'return_day_of_month' => ['nullable', 'integer', 'between:1,31'],
            'last_return_date' => ['nullable'],
            'max_withdrawal_limit' => ['nullable', 'numeric'],
            'deposit_date' => ['nullable'],
            'maturity_date' => ['nullable'],
        ]);
        $validated = $this->normalizeDates($validated, ['last_return_date', 'deposit_date', 'maturity_date']);
        $validated['user_id'] = $request->user()->id;
        $item = BankCertificate::create($validated);
        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function update(Request $request, BankCertificate $certificate)
    {
        $this->authorizeOwnership($request->user()->id, $certificate->user_id);
        $validated = $request->validate([
            'bank_name' => ['sometimes', 'string', 'max:255'],
            'certificate_name' => ['sometimes', 'string', 'max:255'],
            'certificate_number' => ['nullable', 'string', 'max:255'],
            'amount' => ['sometimes', 'numeric'],
            'monthly_return' => ['nullable', 'numeric'],
            'return_day_of_month' => ['nullable', 'integer', 'between:1,31'],
            'last_return_date' => ['nullable'],
            'max_withdrawal_limit' => ['nullable', 'numeric'],
            'deposit_date' => ['nullable'],
            'maturity_date' => ['nullable'],
        ]);
        $validated = $this->normalizeDates($validated, ['last_return_date', 'deposit_date', 'maturity_date']);
        $certificate->update($validated);
        return response()->json(['success' => true, 'data' => $certificate]);
    }

    public function destroy(Request $request, BankCertificate $certificate)
    {
        $this->authorizeOwnership($request->user()->id, $certificate->user_id);
        $certificate->delete();
        return response()->json(['success' => true]);
    }

    private function authorizeOwnership(int $authUserId, int $resourceUserId): void
    {
        abort_unless($authUserId === $resourceUserId, 403);
    }

    private function normalizeDates(array $data, array $keys): array
    {
        foreach ($keys as $key) {
            if (!array_key_exists($key, $data) || $data[$key] === null || $data[$key] === '') {
                continue;
            }
            try {
                $data[$key] = Carbon::parse($data[$key])->toDateString();
            } catch (\Throwable $e) {
                // leave as-is; validation may fail elsewhere if invalid
            }
        }
        return $data;
    }
}
