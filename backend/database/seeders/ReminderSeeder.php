<?php

namespace Database\Seeders;

use App\Models\Reminder;
use Illuminate\Database\Seeder;

class ReminderSeeder extends Seeder
{
    public function run(): void
    {
        $userId = 4;
        $rows = [
            [
                'title' => 'Pay Internet Bill',
                'notes' => 'Due before the 10th',
                'due_date' => now()->addDays(7)->toDateString(),
                'is_done' => false,
            ],
        ];

        foreach ($rows as $data) {
            Reminder::updateOrCreate(
                [
                    'user_id' => $userId,
                    'title' => $data['title'],
                ],
                $data + ['user_id' => $userId]
            );
        }
    }
}
