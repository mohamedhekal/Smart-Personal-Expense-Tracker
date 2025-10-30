<?php

namespace App\Http\Controllers;

use App\Models\CertificateWithdrawal;
use App\Models\BankCertificate;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class WithdrawalController extends Controller
{
    public function indexForCertificate(Request $request, BankCertificate $certificate)
    {
        $this->authorizeOwnership($request->user()->id, $certificate->user_id);
        $items = CertificateWithdrawal::where('user_id', $request->user()->id)
            ->where('certificate_id', $certificate->id)
            ->latest()->paginate(50);
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function show(Request $request, CertificateWithdrawal $withdrawal)
    {
        $this->authorizeOwnership($request->user()->id, $withdrawal->user_id);
        return response()->json(['success' => true, 'data' => $withdrawal]);
    }

    public function store(Request $request, BankCertificate $certificate)
    {
        $this->authorizeOwnership($request->user()->id, $certificate->user_id);
        $validated = $request->validate([
            'amount' => ['required', 'numeric'],
            'date' => ['required', 'date'],
            'repayment_date' => ['nullable', 'date'],
            'is_installment' => ['boolean'],
            'installment_count' => ['nullable', 'integer', 'min:1'],
        ]);
        if (!empty($validated['date'])) {
            $validated['date'] = Carbon::parse($validated['date'])->toDateString();
        }
        if (!empty($validated['repayment_date'])) {
            $validated['repayment_date'] = Carbon::parse($validated['repayment_date'])->toDateString();
        }
        $validated['user_id'] = $request->user()->id;
        $validated['certificate_id'] = $certificate->id;
        $item = CertificateWithdrawal::create($validated);
        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function repay(Request $request, CertificateWithdrawal $withdrawal)
    {
        $this->authorizeOwnership($request->user()->id, $withdrawal->user_id);
        $withdrawal->update([
            'is_repaid' => true,
            'repayment_date' => now()->toDateString(),
        ]);
        return response()->json(['success' => true, 'data' => $withdrawal]);
    }

    public function payInstallment(Request $request, CertificateWithdrawal $withdrawal)
    {
        $this->authorizeOwnership($request->user()->id, $withdrawal->user_id);
        $withdrawal->increment('paid_installments');
        return response()->json(['success' => true, 'data' => $withdrawal->fresh()]);
    }

    public function destroy(Request $request, CertificateWithdrawal $withdrawal)
    {
        $this->authorizeOwnership($request->user()->id, $withdrawal->user_id);
        $withdrawal->delete();
        return response()->json(['success' => true]);
    }

    private function authorizeOwnership(int $authUserId, int $resourceUserId): void
    {
        abort_unless($authUserId === $resourceUserId, 403);
    }
}
