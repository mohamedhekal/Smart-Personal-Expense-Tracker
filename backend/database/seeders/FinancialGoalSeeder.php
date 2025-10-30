<?php

namespace Database\Seeders;

use App\Models\FinancialGoal;
use Illuminate\Database\Seeder;

class FinancialGoalSeeder extends Seeder
{
    public function run(): void
    {
        $userId = 4;
        $rows = [
            [
                'title' => 'Emergency Fund',
                'target_amount' => 50000,
                'current_amount' => 12000,
                'deadline' => now()->addMonths(8)->toDateString(),
                'reminder_enabled' => true,
            ],
        ];

        foreach ($rows as $data) {
            FinancialGoal::updateOrCreate(
                [
                    'user_id' => $userId,
                    'title' => $data['title'],
                ],
                $data + ['user_id' => $userId]
            );
        }
    }
}
