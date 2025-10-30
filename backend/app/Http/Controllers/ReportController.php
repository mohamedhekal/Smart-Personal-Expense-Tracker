<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function overview(Request $request)
    {
        $range = $request->string('range', 'thisMonth')->toString();
        [$from, $to] = $this->resolveRange($range);
        $userId = $request->user()->id;

        $totalExpenses = DB::table('expenses')->where('user_id', $userId)
            ->when($from, fn($q) => $q->whereDate('date', '>=', $from))
            ->when($to, fn($q) => $q->whereDate('date', '<=', $to))
            ->sum('amount');
        $totalSalaries = DB::table('salaries')->where('user_id', $userId)
            ->when($from, fn($q) => $q->whereDate('received_date', '>=', $from))
            ->when($to, fn($q) => $q->whereDate('received_date', '<=', $to))
            ->sum('amount');

        return response()->json(['success' => true, 'data' => [
            'range' => $range,
            'from' => $from,
            'to' => $to,
            'total_expenses' => (float)$totalExpenses,
            'total_salaries' => (float)$totalSalaries,
        ]]);
    }

    public function expensesByCategory(Request $request)
    {
        $range = $request->string('range', 'thisMonth')->toString();
        [$from, $to] = $this->resolveRange($range);
        $userId = $request->user()->id;
        $rows = DB::table('expenses')
            ->select('category_id', DB::raw('SUM(amount) as total'))
            ->where('user_id', $userId)
            ->when($from, fn($q) => $q->whereDate('date', '>=', $from))
            ->when($to, fn($q) => $q->whereDate('date', '<=', $to))
            ->groupBy('category_id')
            ->get();
        return response()->json(['success' => true, 'data' => $rows]);
    }

    public function monthlyComparison(Request $request)
    {
        $year = (int)$request->input('year', now()->year);
        $userId = $request->user()->id;
        $expenses = DB::table('expenses')
            ->select(DB::raw('MONTH(date) as month'), DB::raw('SUM(amount) as total'))
            ->where('user_id', $userId)
            ->whereYear('date', $year)
            ->groupBy(DB::raw('MONTH(date)'))
            ->pluck('total', 'month');
        $salaries = DB::table('salaries')
            ->select(DB::raw('MONTH(received_date) as month'), DB::raw('SUM(amount) as total'))
            ->where('user_id', $userId)
            ->whereYear('received_date', $year)
            ->groupBy(DB::raw('MONTH(received_date)'))
            ->pluck('total', 'month');
        return response()->json(['success' => true, 'data' => [
            'year' => $year,
            'expenses' => $expenses,
            'salaries' => $salaries,
        ]]);
    }

    public function stats(Request $request)
    {
        $range = $request->string('range', 'thisMonth')->toString();
        [$from, $to] = $this->resolveRange($range);
        $userId = $request->user()->id;

        $totalExpenses = DB::table('expenses')->where('user_id', $userId)
            ->when($from, fn($q) => $q->whereDate('date', '>=', $from))
            ->when($to, fn($q) => $q->whereDate('date', '<=', $to))
            ->sum('amount');

        $totalSalaries = DB::table('salaries')->where('user_id', $userId)
            ->when($from, fn($q) => $q->whereDate('received_date', '>=', $from))
            ->when($to, fn($q) => $q->whereDate('received_date', '<=', $to))
            ->sum('amount');

        $totalRevenue = DB::table('freelance_revenues')->where('user_id', $userId)
            ->when($from, fn($q) => $q->whereDate('date', '>=', $from))
            ->when($to, fn($q) => $q->whereDate('date', '<=', $to))
            ->sum('amount');

        $savingsFund = DB::table('financial_goals')->where('user_id', $userId)->sum('current_amount');

        $balance = (float)$totalSalaries + (float)$totalRevenue - (float)$totalExpenses;

        return response()->json(['success' => true, 'data' => [
            'range' => $range,
            'from' => $from,
            'to' => $to,
            'revenue' => (float)$totalRevenue,
            'total_salaries' => (float)$totalSalaries,
            'expenses' => (float)$totalExpenses,
            'balance' => $balance,
            'savings_fund' => (float)$savingsFund,
        ]]);
    }

    private function resolveRange(string $range): array
    {
        return match ($range) {
            'thisMonth' => [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()],
            'lastMonth' => [now()->subMonth()->startOfMonth()->toDateString(), now()->subMonth()->endOfMonth()->toDateString()],
            'thisYear' => [now()->startOfYear()->toDateString(), now()->endOfYear()->toDateString()],
            default => [null, null]
        };
    }
}
