<?php

namespace Database\Seeders;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseSeeder extends Seeder
{
    public function run(): void
    {
        $userId = 4;

        $foodCategory = ExpenseCategory::where('user_id', $userId)->where('name', 'Food')->first();
        $transportCategory = ExpenseCategory::where('user_id', $userId)->where('name', 'Transport')->first();

        $rows = [
            [
                'name' => 'Groceries',
                'amount' => 1200.50,
                'category_id' => optional($foodCategory)->id,
                'date' => now()->toDateString(),
                'is_monthly' => false,
                'auto_add' => false,
                'day_of_month' => null,
                'notes' => 'Weekly grocery run',
            ],
            [
                'name' => 'Metro Card',
                'amount' => 300.00,
                'category_id' => optional($transportCategory)->id,
                'date' => now()->subDays(2)->toDateString(),
                'is_monthly' => true,
                'auto_add' => true,
                'day_of_month' => 1,
                'notes' => 'Monthly recharge',
            ],
        ];

        foreach ($rows as $data) {
            Expense::updateOrCreate(
                [
                    'user_id' => $userId,
                    'name' => $data['name'],
                    'date' => $data['date'],
                ],
                $data + ['user_id' => $userId]
            );
        }
    }
}
