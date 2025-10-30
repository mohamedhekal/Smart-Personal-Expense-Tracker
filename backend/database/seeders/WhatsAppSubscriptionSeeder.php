<?php

namespace Database\Seeders;

use App\Models\WhatsAppSubscription;
use Illuminate\Database\Seeder;

class WhatsAppSubscriptionSeeder extends Seeder
{
    public function run(): void
    {
        $userId = 4;
        $rows = [
            [
                'phone' => '+201001112222',
                'plan' => 'Business Basic',
                'amount' => 99.99,
                'start_date' => now()->subMonth()->toDateString(),
                'end_date' => now()->addMonths(11)->toDateString(),
                'is_active' => true,
                'notes' => 'Auto-renew enabled',
            ],
        ];

        foreach ($rows as $data) {
            WhatsAppSubscription::updateOrCreate(
                [
                    'user_id' => $userId,
                    'phone' => $data['phone'],
                ],
                $data + ['user_id' => $userId]
            );
        }
    }
}
