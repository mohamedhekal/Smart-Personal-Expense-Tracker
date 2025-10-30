<?php

namespace Database\Seeders;

use App\Models\FreelanceRevenue;
use Illuminate\Database\Seeder;

class FreelanceRevenueSeeder extends Seeder
{
    public function run(): void
    {
        $userId = 4;
        $rows = [
            [
                'title' => 'Landing Page Project',
                'client' => 'Client A',
                'amount' => 8000,
                'date' => now()->subDays(10)->toDateString(),
                'notes' => 'Paid 50% upfront',
            ],
        ];

        foreach ($rows as $data) {
            FreelanceRevenue::updateOrCreate(
                [
                    'user_id' => $userId,
                    'title' => $data['title'],
                    'date' => $data['date'],
                ],
                $data + ['user_id' => $userId]
            );
        }
    }
}
