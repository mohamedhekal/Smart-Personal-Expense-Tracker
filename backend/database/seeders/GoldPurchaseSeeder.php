<?php

namespace Database\Seeders;

use App\Models\GoldPurchase;
use Illuminate\Database\Seeder;

class GoldPurchaseSeeder extends Seeder
{
    public function run(): void
    {
        $userId = 4;
        $rows = [
            [
                'invoice_value' => 25000,
                'grams' => 50.750,
                'price_per_gram' => 492.50,
                'purity' => '24K',
                'type' => 'Coins',
                'purchase_date' => now()->subMonths(3)->toDateString(),
                'notes' => 'Seasonal dip purchase',
            ],
        ];

        foreach ($rows as $data) {
            GoldPurchase::updateOrCreate(
                [
                    'user_id' => $userId,
                    'purchase_date' => $data['purchase_date'],
                    'invoice_value' => $data['invoice_value'],
                ],
                $data + ['user_id' => $userId]
            );
        }
    }
}
