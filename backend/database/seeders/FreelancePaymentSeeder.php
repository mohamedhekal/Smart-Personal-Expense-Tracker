<?php

namespace Database\Seeders;

use App\Models\FreelancePayment;
use App\Models\FreelanceRevenue;
use Illuminate\Database\Seeder;

class FreelancePaymentSeeder extends Seeder
{
    public function run(): void
    {
        $userId = 4;
        $revenue = FreelanceRevenue::where('user_id', $userId)->first();
        if (!$revenue) {
            return;
        }

        $rows = [
            [
                'revenue_id' => $revenue->id,
                'amount' => 4000,
                'date' => now()->subDays(7)->toDateString(),
                'notes' => 'First installment',
            ],
        ];

        foreach ($rows as $data) {
            FreelancePayment::updateOrCreate(
                [
                    'user_id' => $userId,
                    'revenue_id' => $data['revenue_id'],
                    'date' => $data['date'],
                ],
                $data + ['user_id' => $userId]
            );
        }
    }
}
