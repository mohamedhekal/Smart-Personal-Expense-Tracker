<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $userId = 4;
        $rows = [
            ['key' => 'currency', 'value' => 'EGP'],
            ['key' => 'language', 'value' => 'ar'],
            ['key' => 'notifications_enabled', 'value' => 'true'],
        ];

        foreach ($rows as $data) {
            Setting::updateOrCreate(
                [
                    'user_id' => $userId,
                    'key' => $data['key'],
                ],
                ['value' => $data['value']]
            );
        }
    }
}
