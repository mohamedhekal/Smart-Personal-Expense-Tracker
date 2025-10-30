<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OptimizationController extends Controller
{
    public function recommendations(Request $request)
    {
        $userId = $request->user()->id;
        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();
        $expenses = (float) DB::table('expenses')->where('user_id', $userId)
            ->whereBetween('date', [$monthStart, $monthEnd])->sum('amount');
        $income = (float) DB::table('salaries')->where('user_id', $userId)
            ->whereBetween('received_date', [$monthStart, $monthEnd])->sum('amount');
        $savingsRate = $income > 0 ? max(0, ($income - $expenses) / $income) : 0;

        $recs = [];
        if ($savingsRate < 0.2) {
            $recs[] = 'Increase monthly savings to at least 20% by reducing variable expenses.';
        }
        if ($expenses > $income) {
            $recs[] = 'Your expenses exceed income this month. Consider postponing non-essential purchases.';
        }
        return response()->json(['success' => true, 'data' => [
            'month' => [$monthStart, $monthEnd],
            'income' => $income,
            'expenses' => $expenses,
            'savings_rate' => round($savingsRate, 2),
            'recommendations' => $recs,
        ]]);
    }
}
