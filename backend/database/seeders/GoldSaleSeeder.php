<?php

namespace Database\Seeders;

use App\Models\GoldPurchase;
use App\Models\GoldSale;
use Illuminate\Database\Seeder;

class GoldSaleSeeder extends Seeder
{
    public function run(): void
    {
        $userId = 4;
        $purchase = GoldPurchase::where('user_id', $userId)->first();

        $rows = [
            [
                'purchase_id' => optional($purchase)->id,
                'sale_value' => 12000,
                'price_per_gram' => 510.75,
                'sale_date' => now()->subMonth()->toDateString(),
                'profit_loss' => 350,
                'notes' => 'Partial liquidation',
            ],
        ];

        foreach ($rows as $data) {
            GoldSale::updateOrCreate(
                [
                    'user_id' => $userId,
                    'sale_date' => $data['sale_date'],
                    'sale_value' => $data['sale_value'],
                ],
                $data + ['user_id' => $userId]
            );
        }
    }
}
