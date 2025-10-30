<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use Illuminate\Database\Seeder;

class ActivityLogSeeder extends Seeder
{
    public function run(): void
    {
        $userId = 4;
        $rows = [
            [
                'action' => 'expense_created',
                'entity_type' => 'expense',
                'entity_id' => 1,
                'details' => json_encode(['name' => 'Groceries', 'amount' => 1200.50]),
                'amount' => 1200.50,
            ],
            [
                'action' => 'salary_received',
                'entity_type' => 'salary',
                'entity_id' => 1,
                'details' => json_encode(['company' => 'Acme Inc.', 'amount' => 15000]),
                'amount' => 15000,
            ],
        ];

        foreach ($rows as $data) {
            ActivityLog::create($data + ['user_id' => $userId]);
        }
    }
}
