<?php

namespace Database\Seeders;

use App\Models\Salary;
use Illuminate\Database\Seeder;

class SalarySeeder extends Seeder
{
    public function run(): void
    {
        $userId = 4;
        $rows = [
            [
                'company' => 'Acme Inc.',
                'amount' => 15000,
                'received_date' => now()->subDays(5)->toDateString(),
                'notes' => 'Monthly salary',
                'is_recurring' => true,
                'day_of_month' => 25,
                'is_certificate_return' => false,
                'certificate_id' => null,
            ],
        ];

        foreach ($rows as $data) {
            Salary::updateOrCreate(
                [
                    'user_id' => $userId,
                    'company' => $data['company'],
                    'received_date' => $data['received_date'],
                ],
                $data + ['user_id' => $userId]
            );
        }
    }
}
