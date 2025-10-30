<?php

namespace Database\Seeders;

use App\Models\Notification;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $userId = 4;
        $rows = [
            [
                'title' => 'Welcome to Msarefy',
                'body' => 'Your account is ready. Start tracking your finances!',
                'data' => json_encode(['type' => 'info']),
                'read_at' => null,
            ],
        ];

        foreach ($rows as $data) {
            Notification::create($data + ['user_id' => $userId]);
        }
    }
}
